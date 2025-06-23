/**
 * Anti-obfuscation validation utilities
 * 防混淆驗證工具模組
 */

import { Task, AntiObfuscationResult } from "../types/index.js";

// 防混淆配置
export interface AntiObfuscationConfig {
  evidenceThreshold: number; // 證據一致性閾值 (0-100)
  manipulationDetectionSensitivity: 'LOW' | 'MEDIUM' | 'HIGH'; // 檢測敏感度
  maxScoreDifference: number; // 最大分數差異容忍度
  suspiciousPatternKeywords: string[]; // 可疑模式關鍵字
  truthfulnessWeights: {
    consistencyWeight: number; // 一致性權重
    evidenceWeight: number; // 證據權重
    implementationWeight: number; // 實施權重
  };
}

// 預設防混淆配置
export const DEFAULT_ANTI_OBFUSCATION_CONFIG: AntiObfuscationConfig = {
  evidenceThreshold: 70,
  manipulationDetectionSensitivity: 'MEDIUM',
  maxScoreDifference: 25,
  suspiciousPatternKeywords: [
    'fake', 'mock', 'placeholder', 'todo', 'fixme', 'hack',
    'temporary', 'incomplete', 'unfinished', 'broken',
    'inconsistent', 'contradictory', 'misleading'
  ],
  truthfulnessWeights: {
    consistencyWeight: 0.4,
    evidenceWeight: 0.35,
    implementationWeight: 0.25
  }
};

/**
 * 驗證任務證據的一致性
 * @param task 任務對象
 * @param summary 完成摘要
 * @param config 防混淆配置
 * @returns 證據驗證結果
 */
export function validateTaskEvidence(
  task: Task, 
  summary: string, 
  config: AntiObfuscationConfig = DEFAULT_ANTI_OBFUSCATION_CONFIG
): { score: number; issues: string[] } {
  const issues: string[] = [];
  let consistencyScore = 100;

  // 檢查描述與摘要的一致性
  const descriptionKeywords = extractKeywords(task.description);
  const summaryKeywords = extractKeywords(summary);
  const commonKeywords = descriptionKeywords.filter(k => summaryKeywords.includes(k));
  const descriptionCoverage = commonKeywords.length / Math.max(descriptionKeywords.length, 1);
  
  if (descriptionCoverage < 0.3) {
    issues.push("摘要與任務描述關聯性不足");
    consistencyScore -= 20;
  }

  // 檢查驗證標準的符合度
  if (task.verificationCriteria) {
    const criteriaKeywords = extractKeywords(task.verificationCriteria);
    const criteriaAlignment = criteriaKeywords.filter(k => summaryKeywords.includes(k)).length / Math.max(criteriaKeywords.length, 1);
    
    if (criteriaAlignment < 0.4) {
      issues.push("未充分滿足驗證標準要求");
      consistencyScore -= 15;
    }
  }

  // 檢查實施指南的執行情況
  if (task.implementationGuide) {
    const guideKeywords = extractKeywords(task.implementationGuide);
    const implementationAlignment = guideKeywords.filter(k => summaryKeywords.includes(k)).length / Math.max(guideKeywords.length, 1);
    
    if (implementationAlignment < 0.3) {
      issues.push("實施過程與指南偏差較大");
      consistencyScore -= 10;
    }
  }

  return {
    score: Math.max(0, consistencyScore),
    issues
  };
}

/**
 * 檢測可疑的混淆模式
 * @param text 待檢測文本
 * @param config 防混淆配置
 * @returns 檢測到的可疑模式
 */
export function detectInconsistencies(
  text: string, 
  config: AntiObfuscationConfig = DEFAULT_ANTI_OBFUSCATION_CONFIG
): string[] {
  const suspiciousPatterns: string[] = [];
  const lowercaseText = text.toLowerCase();

  // 檢查可疑關鍵字
  config.suspiciousPatternKeywords.forEach(keyword => {
    if (lowercaseText.includes(keyword.toLowerCase())) {
      suspiciousPatterns.push(`包含可疑關鍵字: ${keyword}`);
    }
  });

  // 檢查過度重複的短語
  const phrases = text.split(/[.!?]+/).filter(p => p.trim().length > 0);
  const phraseFreq = new Map<string, number>();
  phrases.forEach(phrase => {
    const normalized = phrase.trim().toLowerCase();
    phraseFreq.set(normalized, (phraseFreq.get(normalized) || 0) + 1);
  });

  for (const [phrase, count] of phraseFreq) {
    if (count > 3 && phrase.length > 10) {
      suspiciousPatterns.push(`過度重複的表述: "${phrase.substring(0, 50)}..."`);
    }
  }

  // 檢查矛盾陳述
  const contradictoryPairs = [
    ['completed', 'incomplete'],
    ['finished', 'unfinished'],
    ['working', 'broken'],
    ['implemented', 'not implemented'],
    ['successful', 'failed']
  ];

  contradictoryPairs.forEach(([positive, negative]) => {
    if (lowercaseText.includes(positive) && lowercaseText.includes(negative)) {
      suspiciousPatterns.push(`矛盾陳述: 同時包含 "${positive}" 和 "${negative}"`);
    }
  });

  return suspiciousPatterns;
}

/**
 * 應用誠實激勵機制
 * @param baseScore 基礎分數
 * @param evidenceScore 證據一致性分數
 * @param suspiciousPatterns 可疑模式列表
 * @param config 防混淆配置
 * @returns 調整後的分數和激勵分析
 */
export function applyHonestIncentives(
  baseScore: number,
  evidenceScore: number,
  suspiciousPatterns: string[],
  config: AntiObfuscationConfig = DEFAULT_ANTI_OBFUSCATION_CONFIG
): { adjustedScore: number; incentiveAnalysis: string[] } {
  const incentiveAnalysis: string[] = [];
  let adjustedScore = baseScore;

  // 證據一致性獎勵/懲罰
  if (evidenceScore >= config.evidenceThreshold) {
    const bonus = Math.min(5, (evidenceScore - config.evidenceThreshold) / 6);
    adjustedScore += bonus;
    incentiveAnalysis.push(`證據一致性良好，獲得 ${bonus.toFixed(1)} 分獎勵`);
  } else {
    const penalty = Math.min(15, (config.evidenceThreshold - evidenceScore) / 3);
    adjustedScore -= penalty;
    incentiveAnalysis.push(`證據一致性不足，扣除 ${penalty.toFixed(1)} 分`);
  }

  // 可疑模式懲罰
  if (suspiciousPatterns.length > 0) {
    const penalty = Math.min(20, suspiciousPatterns.length * 4);
    adjustedScore -= penalty;
    incentiveAnalysis.push(`檢測到 ${suspiciousPatterns.length} 個可疑模式，扣除 ${penalty} 分`);
  } else {
    adjustedScore += 2;
    incentiveAnalysis.push("未檢測到可疑模式，獲得 2 分誠實獎勵");
  }

  // 確保分數在有效範圍內
  adjustedScore = Math.max(0, Math.min(100, adjustedScore));

  return {
    adjustedScore: Math.round(adjustedScore),
    incentiveAnalysis
  };
}

/**
 * 綜合防混淆驗證
 * @param task 任務對象
 * @param summary 完成摘要
 * @param baseScore 基礎分數
 * @param config 防混淆配置
 * @returns 完整的防混淆驗證結果
 */
export function performAntiObfuscationValidation(
  task: Task,
  summary: string,
  baseScore: number,
  config: AntiObfuscationConfig = DEFAULT_ANTI_OBFUSCATION_CONFIG
): AntiObfuscationResult {
  // 驗證任務證據
  const evidenceValidation = validateTaskEvidence(task, summary, config);
  
  // 檢測可疑模式
  const suspiciousPatterns = detectInconsistencies(summary, config);
  
  // 應用誠實激勵
  const incentiveResult = applyHonestIncentives(
    baseScore, 
    evidenceValidation.score, 
    suspiciousPatterns, 
    config
  );

  // 確定操縱風險等級
  let manipulationRisk: AntiObfuscationResult['manipulationRisk'] = 'LOW';
  
  if (suspiciousPatterns.length >= 3 || evidenceValidation.score < 50) {
    manipulationRisk = 'HIGH';
  } else if (suspiciousPatterns.length >= 1 || evidenceValidation.score < config.evidenceThreshold) {
    manipulationRisk = 'MEDIUM';
  }

  // 收集真實性指標
  const truthfulnessIndicators: string[] = [];
  if (evidenceValidation.score >= config.evidenceThreshold) {
    truthfulnessIndicators.push("證據一致性達標");
  }
  if (suspiciousPatterns.length === 0) {
    truthfulnessIndicators.push("無可疑模式");
  }
  if (incentiveResult.adjustedScore >= baseScore) {
    truthfulnessIndicators.push("誠實激勵評分提升");
  }

  return {
    evidenceConsistency: evidenceValidation.score,
    manipulationRisk,
    truthfulnessIndicators: truthfulnessIndicators.concat(incentiveResult.incentiveAnalysis),
    suspiciousPatterns: suspiciousPatterns.concat(evidenceValidation.issues)
  };
}

/**
 * 從文本中提取關鍵字
 * @param text 輸入文本
 * @returns 關鍵字數組
 */
function extractKeywords(text: string): string[] {
  // 移除標點符號並轉為小寫
  const cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // 分割單詞並過濾
  const words = cleaned.split(/\s+/).filter(word => 
    word.length > 2 && 
    !isCommonWord(word)
  );
  
  // 去重並返回
  return [...new Set(words)];
}

/**
 * 檢查是否為常見停用詞
 * @param word 單詞
 * @returns 是否為停用詞
 */
function isCommonWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'can', 'must', 'shall', 'need', 'use', 'used', 'using',
    'make', 'made', 'get', 'got', 'take', 'took', 'come', 'came', 'go', 'went'
  ]);
  
  return stopWords.has(word);
}