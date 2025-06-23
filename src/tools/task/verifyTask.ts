import { z } from "zod";
import { UUID_V4_REGEX } from "../../utils/regex.js";
import {
  getTaskById,
  updateTaskStatus,
  updateTaskSummary,
  updateTaskWithDebateResults,
} from "../../models/taskModel.js";
import { TaskStatus, DebateVerificationParams, DebateScoreBreakdown, AntiObfuscationResult, TaskCompletionMetadata } from "../../types/index.js";
import { getVerifyTaskPrompt } from "../../prompts/index.js";
import { 
  performAntiObfuscationValidation, 
  DEFAULT_ANTI_OBFUSCATION_CONFIG,
  AntiObfuscationConfig 
} from "../../utils/antiObfuscation.js";
import { debateConfig } from "../../config/debateProtocol.js";

// 檢驗任務工具
export const verifyTaskSchema = z.object({
  taskId: z
    .string()
    .regex(UUID_V4_REGEX, {
      message: "任務ID格式無效，請提供有效的UUID v4格式",
    })
    .describe("待驗證任務的唯一標識符，必須是系統中存在的有效任務ID"),
  summary: z
    .string()
    .min(30, {
      message: "最少30個字",
    })
    .describe(
      "當分數高於或等於 80分時代表任務完成摘要，簡潔描述實施結果和重要決策，當分數低於 80分時代表缺失或需要修正的部分說明，最少30個字"
    ),
  score: z
    .number()
    .min(0, { message: "分數不能小於0" })
    .max(100, { message: "分數不能大於100" })
    .describe("針對任務的評分，當評分等於或超過80分時自動完成任務"),
  // 可選的辯論協議參數
  debateParams: z.optional(z.object({
    enableDebateProtocol: z.boolean().default(false),
    debateIntensity: z.enum(['LIGHT', 'MODERATE', 'RIGOROUS']).default('MODERATE'),
    antiObfuscationEnabled: z.boolean().default(true),
    proverScore: z.number().min(0).max(100).optional(),
    estimatorScore: z.number().min(0).max(100).optional(),
    consensusPoints: z.array(z.string()).optional(),
    conflicts: z.array(z.string()).optional(),
    resolutionJustification: z.string().optional(),
  })),
});

// 辯論協議評分邏輯
function calculateDebateScore(
  task: any,
  summary: string,
  baseScore: number,
  debateParams?: z.infer<typeof verifyTaskSchema>['debateParams']
): { finalScore: number; debateBreakdown?: DebateScoreBreakdown; antiObfuscationResult?: AntiObfuscationResult } {
  // 獲取當前配置並執行防混淆驗證
  const config = debateConfig.getConfig();
  const antiObfuscationConfig = {
    evidenceThreshold: config.antiObfuscation.evidenceThreshold,
    manipulationDetectionSensitivity: config.antiObfuscation.manipulationSensitivity,
    maxScoreDifference: 25, // 從配置中推導
    suspiciousPatternKeywords: config.antiObfuscation.suspiciousPatternKeywords,
    truthfulnessWeights: config.antiObfuscation.truthfulnessWeights
  };
  
  const antiObfuscationResult = performAntiObfuscationValidation(
    task, 
    summary, 
    baseScore, 
    antiObfuscationConfig
  );

  if (!debateParams?.enableDebateProtocol) {
    // 即使沒有啟用辯論協議，也應用防混淆檢查
    const adjustedScore = applyAntiObfuscationAdjustment(baseScore, antiObfuscationResult);
    return { 
      finalScore: adjustedScore, 
      antiObfuscationResult 
    };
  }

  const { proverScore, estimatorScore, consensusPoints = [], conflicts = [], resolutionJustification = '' } = debateParams;

  if (proverScore !== undefined && estimatorScore !== undefined) {
    // 從配置中獲取辯論權重和激勵參數
    const intensityKey = debateParams.debateIntensity?.toLowerCase() || 'moderate';
    const intensityConfig = config.intensitySettings[intensityKey as keyof typeof config.intensitySettings];
    const weights = intensityConfig.weights;
    const incentives = intensityConfig.incentives;
    
    // 誠實均衡評分：懲罰過度樂觀或悲觀
    const scoreDiff = Math.abs(proverScore - estimatorScore);
    const consensusBonus = consensusPoints.length * incentives.consensusBonus;
    const conflictPenalty = conflicts.length * incentives.conflictPenalty;
    const discrepancyPenalty = scoreDiff > incentives.maxScoreDiscrepancy ? incentives.scoreDiscrepancyPenalty : 0;
    
    let honestEquilibriumScore = Math.max(0, Math.min(100, 
      (proverScore * weights.prover + estimatorScore * weights.estimator + baseScore * weights.synthesis) 
      + consensusBonus - conflictPenalty - discrepancyPenalty
    ));

    // 整合防混淆檢查結果
    if (debateParams.antiObfuscationEnabled) {
      honestEquilibriumScore = applyAntiObfuscationAdjustment(honestEquilibriumScore, antiObfuscationResult);
    }

    const debateBreakdown: DebateScoreBreakdown = {
      proverScore,
      estimatorScore,
      consensusPoints,
      conflicts,
      resolutionJustification,
      honestEquilibriumScore
    };

    return { 
      finalScore: Math.round(honestEquilibriumScore), 
      debateBreakdown, 
      antiObfuscationResult 
    };
  }

  // 沒有完整辯論參數時，仍應用防混淆檢查
  const adjustedScore = applyAntiObfuscationAdjustment(baseScore, antiObfuscationResult);
  return { 
    finalScore: adjustedScore, 
    antiObfuscationResult 
  };
}

// 應用防混淆調整
function applyAntiObfuscationAdjustment(
  score: number, 
  antiObfuscationResult: AntiObfuscationResult
): number {
  let adjustedScore = score;

  // 根據操縱風險調整分數
  switch (antiObfuscationResult.manipulationRisk) {
    case 'HIGH':
      adjustedScore = Math.min(score * 0.7, score - 15);
      break;
    case 'MEDIUM':
      adjustedScore = Math.min(score * 0.85, score - 8);
      break;
    case 'LOW':
      // 低風險給予小幅獎勵
      adjustedScore = Math.min(100, score + 2);
      break;
  }

  // 根據證據一致性進行微調
  const evidenceBonus = Math.max(-10, Math.min(5, 
    (antiObfuscationResult.evidenceConsistency - 70) / 6
  ));
  adjustedScore += evidenceBonus;

  return Math.max(0, Math.min(100, Math.round(adjustedScore)));
}

// 計算完成信心度
function calculateCompletionConfidence(
  finalScore: number, 
  debateResult: { finalScore: number; debateBreakdown?: DebateScoreBreakdown; antiObfuscationResult?: AntiObfuscationResult }
): 'LOW' | 'MEDIUM' | 'HIGH' {
  // 基於最終分數的基礎信心度
  let confidenceScore = finalScore;
  
  // 如果有辯論分析，考慮共識程度
  if (debateResult.debateBreakdown) {
    const { proverScore, estimatorScore, consensusPoints, conflicts } = debateResult.debateBreakdown;
    const scoreDifference = Math.abs(proverScore - estimatorScore);
    
    // 分數差異小且共識點多時提高信心度
    if (scoreDifference < 15 && consensusPoints.length > conflicts.length) {
      confidenceScore += 5;
    } else if (scoreDifference > 30 || conflicts.length > consensusPoints.length) {
      confidenceScore -= 10;
    }
  }
  
  // 防混淆結果影響信心度
  if (debateResult.antiObfuscationResult) {
    const { manipulationRisk, evidenceConsistency } = debateResult.antiObfuscationResult;
    
    if (manipulationRisk === 'LOW' && evidenceConsistency > 80) {
      confidenceScore += 3;
    } else if (manipulationRisk === 'HIGH' || evidenceConsistency < 50) {
      confidenceScore -= 15;
    }
  }
  
  // 確定信心度等級
  if (confidenceScore >= 90) return 'HIGH';
  if (confidenceScore >= 75) return 'MEDIUM';
  return 'LOW';
}

// 生成完成建議
function generateCompletionRecommendations(
  task: any,
  debateResult: { finalScore: number; debateBreakdown?: DebateScoreBreakdown; antiObfuscationResult?: AntiObfuscationResult },
  finalScore: number
): string[] {
  const recommendations: string[] = [];
  
  // 基於分數的通用建議
  if (finalScore >= 95) {
    recommendations.push("任務完成品質優秀，可作為未來類似任務的參考標準");
  } else if (finalScore >= 85) {
    recommendations.push("任務完成品質良好，建議記錄成功經驗以供參考");
  } else if (finalScore >= 80) {
    recommendations.push("任務基本完成，建議關注改進點以提升未來表現");
  }
  
  // 基於辯論分析的建議
  if (debateResult.debateBreakdown) {
    const { consensusPoints, conflicts, proverScore, estimatorScore } = debateResult.debateBreakdown;
    
    if (consensusPoints.length > 0) {
      recommendations.push(`強化已獲共識的優勢：${consensusPoints.slice(0, 2).join('、')}`);
    }
    
    if (conflicts.length > 0) {
      recommendations.push(`留意爭議領域以供未來改進：${conflicts.slice(0, 2).join('、')}`);
    }
    
    const scoreDiff = Math.abs(proverScore - estimatorScore);
    if (scoreDiff > 20) {
      recommendations.push("辯論雙方分歧較大，建議進一步驗證實施品質");
    }
  }
  
  // 基於防混淆分析的建議
  if (debateResult.antiObfuscationResult) {
    const { manipulationRisk, evidenceConsistency, truthfulnessIndicators } = debateResult.antiObfuscationResult;
    
    if (manipulationRisk === 'LOW' && evidenceConsistency > 85) {
      recommendations.push("證據一致性優秀，驗證過程值得信賴");
    } else if (manipulationRisk === 'MEDIUM') {
      recommendations.push("建議加強任務執行過程的證據記錄");
    } else if (manipulationRisk === 'HIGH') {
      recommendations.push("檢測到潛在問題，建議重新檢視任務實施品質");
    }
    
    if (truthfulnessIndicators.length > 2) {
      recommendations.push("展現良好的誠實度指標，有助於建立可信度");
    }
  }
  
  // 基於任務特徵的建議
  if (task.dependencies && task.dependencies.length > 0) {
    recommendations.push("複雜依賴任務完成，經驗可應用於類似協調性工作");
  }
  
  if (task.relatedFiles && task.relatedFiles.length > 3) {
    recommendations.push("多文件協作任務完成，建議記錄文件管理最佳實踐");
  }
  
  return recommendations.slice(0, 5); // 限制建議數量
}

export async function verifyTask({
  taskId,
  summary,
  score,
  debateParams,
}: z.infer<typeof verifyTaskSchema>) {
  const task = await getTaskById(taskId);

  if (!task) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## 系統錯誤\n\n找不到ID為 \`${taskId}\` 的任務。請使用「list_tasks」工具確認有效的任務ID後再試。`,
        },
      ],
      isError: true,
    };
  }

  if (task.status !== TaskStatus.IN_PROGRESS) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## 狀態錯誤\n\n任務 "${task.name}" (ID: \`${task.id}\`) 當前狀態為 "${task.status}"，不處於進行中狀態，無法進行檢驗。\n\n只有狀態為「進行中」的任務才能進行檢驗。請先使用「execute_task」工具開始任務執行。`,
        },
      ],
      isError: true,
    };
  }

  // 計算辯論協議評分（包含防混淆驗證）
  const debateResult = calculateDebateScore(task, summary, score, debateParams);
  const finalScore = debateResult.finalScore;

  // 如果啟用辯論協議，記錄辯論結果
  let enhancedSummary = summary;
  if (debateResult.debateBreakdown) {
    const debate = debateResult.debateBreakdown;
    enhancedSummary += `\n\n## 辯論協議分析結果\n`;
    enhancedSummary += `- **支持方評分**: ${debate.proverScore}\n`;
    enhancedSummary += `- **評估方評分**: ${debate.estimatorScore}\n`;
    enhancedSummary += `- **誠實均衡評分**: ${debate.honestEquilibriumScore}\n`;
    if (debate.consensusPoints.length > 0) {
      enhancedSummary += `- **共識點**: ${debate.consensusPoints.join(', ')}\n`;
    }
    if (debate.conflicts.length > 0) {
      enhancedSummary += `- **爭議點**: ${debate.conflicts.join(', ')}\n`;
    }
    if (debate.resolutionJustification) {
      enhancedSummary += `- **解決方案**: ${debate.resolutionJustification}\n`;
    }
  }

  if (debateResult.antiObfuscationResult) {
    const antiObf = debateResult.antiObfuscationResult;
    enhancedSummary += `\n## 防混淆驗證結果\n`;
    enhancedSummary += `- **證據一致性**: ${antiObf.evidenceConsistency}%\n`;
    enhancedSummary += `- **操縱風險**: ${antiObf.manipulationRisk}\n`;
    if (antiObf.truthfulnessIndicators.length > 0) {
      enhancedSummary += `- **真實性指標**: ${antiObf.truthfulnessIndicators.join(', ')}\n`;
    }
    if (antiObf.suspiciousPatterns.length > 0) {
      enhancedSummary += `- **可疑模式**: ${antiObf.suspiciousPatterns.join(', ')}\n`;
    }
  }

  if (finalScore >= 80) {
    // 構建任務完成元數據
    const completionMetadata: TaskCompletionMetadata = {
      completionTimestamp: Date.now(),
      verificationMethod: debateResult.debateBreakdown ? 'DEBATE_PROTOCOL' : 'STANDARD',
      finalScore,
      originalScore: score,
      debateAnalysis: debateResult.debateBreakdown ? {
        proverScore: debateResult.debateBreakdown.proverScore,
        estimatorScore: debateResult.debateBreakdown.estimatorScore,
        consensusPoints: debateResult.debateBreakdown.consensusPoints,
        conflicts: debateResult.debateBreakdown.conflicts,
        honestEquilibriumScore: debateResult.debateBreakdown.honestEquilibriumScore,
      } : undefined,
      antiObfuscationAnalysis: debateResult.antiObfuscationResult ? {
        evidenceConsistency: debateResult.antiObfuscationResult.evidenceConsistency,
        manipulationRisk: debateResult.antiObfuscationResult.manipulationRisk,
        suspiciousPatterns: debateResult.antiObfuscationResult.suspiciousPatterns,
        truthfulnessIndicators: debateResult.antiObfuscationResult.truthfulnessIndicators,
      } : undefined,
      completionConfidence: calculateCompletionConfidence(finalScore, debateResult),
      recommendations: generateCompletionRecommendations(task, debateResult, finalScore)
    };

    // 使用綜合更新函數同時更新摘要、元數據和狀態
    await updateTaskWithDebateResults(taskId, enhancedSummary, completionMetadata);
    await updateTaskStatus(taskId, TaskStatus.COMPLETED);
  }

  // 使用prompt生成器獲取最終prompt，傳入調整後的分數
  const prompt = getVerifyTaskPrompt({ task, score: finalScore, summary: enhancedSummary });

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
      },
    ],
    // 回傳辯論協議結果供系統分析使用
    metadata: {
      debateResult: debateResult.debateBreakdown ? {
        originalScore: score,
        finalScore,
        debateBreakdown: debateResult.debateBreakdown,
        antiObfuscationResult: debateResult.antiObfuscationResult,
      } : undefined
    }
  };
}
