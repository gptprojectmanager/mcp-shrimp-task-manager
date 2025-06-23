/**
 * Debate Protocol Configuration System
 * 辯論協議配置系統
 */

export interface DebateProtocolConfig {
  // 辯論強度配置
  intensitySettings: {
    light: DebateIntensityConfig;
    moderate: DebateIntensityConfig;
    rigorous: DebateIntensityConfig;
  };
  
  // 防混淆檢測配置
  antiObfuscation: {
    enabled: boolean;
    evidenceThreshold: number;
    manipulationSensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
    suspiciousPatternKeywords: string[];
    truthfulnessWeights: {
      consistencyWeight: number;
      evidenceWeight: number;
      implementationWeight: number;
    };
  };
  
  // 性能配置
  performance: {
    maxProcessingTimeMs: number;
    maxRecommendations: number;
    enableAnalytics: boolean;
    logLevel: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  };
  
  // 評分配置
  scoring: {
    completionThreshold: number;
    confidenceThresholds: {
      low: number;
      medium: number;
      high: number;
    };
    scoringPrecision: number;
  };
}

export interface DebateIntensityConfig {
  // 權重分配
  weights: {
    prover: number;
    estimator: number;
    synthesis: number;
  };
  
  // 共識和衝突獎懲
  incentives: {
    consensusBonus: number;
    conflictPenalty: number;
    scoreDiscrepancyPenalty: number;
    maxScoreDiscrepancy: number;
  };
  
  // 處理參數
  processing: {
    requiredConsensusPoints: number;
    maxAllowedConflicts: number;
    evidenceRequirement: 'MINIMAL' | 'MODERATE' | 'COMPREHENSIVE';
  };
}

// 預設配置
export const DEFAULT_DEBATE_CONFIG: DebateProtocolConfig = {
  intensitySettings: {
    light: {
      weights: {
        prover: 0.4,
        estimator: 0.3,
        synthesis: 0.3
      },
      incentives: {
        consensusBonus: 1.5,
        conflictPenalty: 1.0,
        scoreDiscrepancyPenalty: 5,
        maxScoreDiscrepancy: 35
      },
      processing: {
        requiredConsensusPoints: 1,
        maxAllowedConflicts: 3,
        evidenceRequirement: 'MINIMAL'
      }
    },
    moderate: {
      weights: {
        prover: 0.35,
        estimator: 0.35,
        synthesis: 0.3
      },
      incentives: {
        consensusBonus: 2.0,
        conflictPenalty: 1.5,
        scoreDiscrepancyPenalty: 10,
        maxScoreDiscrepancy: 25
      },
      processing: {
        requiredConsensusPoints: 2,
        maxAllowedConflicts: 2,
        evidenceRequirement: 'MODERATE'
      }
    },
    rigorous: {
      weights: {
        prover: 0.3,
        estimator: 0.4,
        synthesis: 0.3
      },
      incentives: {
        consensusBonus: 3.0,
        conflictPenalty: 2.0,
        scoreDiscrepancyPenalty: 15,
        maxScoreDiscrepancy: 20
      },
      processing: {
        requiredConsensusPoints: 3,
        maxAllowedConflicts: 1,
        evidenceRequirement: 'COMPREHENSIVE'
      }
    }
  },
  
  antiObfuscation: {
    enabled: true,
    evidenceThreshold: 70,
    manipulationSensitivity: 'MEDIUM',
    suspiciousPatternKeywords: [
      'fake', 'mock', 'placeholder', 'todo', 'fixme', 'hack',
      'temporary', 'incomplete', 'unfinished', 'broken',
      'inconsistent', 'contradictory', 'misleading', 'test',
      'dummy', 'stub', 'not implemented', 'coming soon'
    ],
    truthfulnessWeights: {
      consistencyWeight: 0.4,
      evidenceWeight: 0.35,
      implementationWeight: 0.25
    }
  },
  
  performance: {
    maxProcessingTimeMs: 5000,
    maxRecommendations: 5,
    enableAnalytics: true,
    logLevel: 'INFO'
  },
  
  scoring: {
    completionThreshold: 80,
    confidenceThresholds: {
      low: 75,
      medium: 85,
      high: 95
    },
    scoringPrecision: 2
  }
};

// 配置驗證器
export class DebateConfigValidator {
  static validate(config: DebateProtocolConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 驗證權重總和
    Object.entries(config.intensitySettings).forEach(([intensity, settings]) => {
      const weightSum = settings.weights.prover + settings.weights.estimator + settings.weights.synthesis;
      if (Math.abs(weightSum - 1.0) > 0.01) {
        errors.push(`${intensity} intensity weights do not sum to 1.0 (sum: ${weightSum})`);
      }
    });
    
    // 驗證閾值範圍
    if (config.scoring.completionThreshold < 0 || config.scoring.completionThreshold > 100) {
      errors.push('Completion threshold must be between 0 and 100');
    }
    
    if (config.antiObfuscation.evidenceThreshold < 0 || config.antiObfuscation.evidenceThreshold > 100) {
      errors.push('Evidence threshold must be between 0 and 100');
    }
    
    // 驗證信心度閾值順序
    const { low, medium, high } = config.scoring.confidenceThresholds;
    if (low >= medium || medium >= high) {
      errors.push('Confidence thresholds must be in ascending order (low < medium < high)');
    }
    
    // 驗證性能參數
    if (config.performance.maxProcessingTimeMs <= 0) {
      errors.push('Max processing time must be positive');
    }
    
    if (config.performance.maxRecommendations <= 0) {
      errors.push('Max recommendations must be positive');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// 配置載入器
export class DebateConfigLoader {
  private static instance: DebateConfigLoader;
  private config: DebateProtocolConfig;
  
  private constructor() {
    this.config = { ...DEFAULT_DEBATE_CONFIG };
  }
  
  static getInstance(): DebateConfigLoader {
    if (!DebateConfigLoader.instance) {
      DebateConfigLoader.instance = new DebateConfigLoader();
    }
    return DebateConfigLoader.instance;
  }
  
  getConfig(): DebateProtocolConfig {
    return this.config;
  }
  
  updateConfig(updates: Partial<DebateProtocolConfig>): { success: boolean; errors: string[] } {
    const newConfig = this.mergeConfig(this.config, updates);
    const validation = DebateConfigValidator.validate(newConfig);
    
    if (validation.isValid) {
      this.config = newConfig;
      return { success: true, errors: [] };
    }
    
    return { success: false, errors: validation.errors };
  }
  
  resetToDefault(): void {
    this.config = { ...DEFAULT_DEBATE_CONFIG };
  }
  
  getIntensityConfig(intensity: 'LIGHT' | 'MODERATE' | 'RIGOROUS'): DebateIntensityConfig {
    const key = intensity.toLowerCase() as keyof typeof this.config.intensitySettings;
    return this.config.intensitySettings[key];
  }
  
  private mergeConfig(base: DebateProtocolConfig, updates: Partial<DebateProtocolConfig>): DebateProtocolConfig {
    return {
      ...base,
      ...updates,
      intensitySettings: {
        ...base.intensitySettings,
        ...(updates.intensitySettings || {})
      },
      antiObfuscation: {
        ...base.antiObfuscation,
        ...(updates.antiObfuscation || {})
      },
      performance: {
        ...base.performance,
        ...(updates.performance || {})
      },
      scoring: {
        ...base.scoring,
        ...(updates.scoring || {})
      }
    };
  }
}

// 配置分析器
export class DebateConfigAnalyzer {
  static analyzePerformanceImpact(config: DebateProtocolConfig): {
    estimatedProcessingTime: number;
    memoryUsage: 'LOW' | 'MEDIUM' | 'HIGH';
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let estimatedTime = 100; // 基礎處理時間 (ms)
    let memoryUsage: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    
    // 基於辯論強度估算
    const intensityImpact = {
      light: 1.2,
      moderate: 1.5,
      rigorous: 2.0
    };
    
    // 計算平均強度影響
    const avgImpact = (intensityImpact.light + intensityImpact.moderate + intensityImpact.rigorous) / 3;
    estimatedTime *= avgImpact;
    
    // 防混淆檢查影響
    if (config.antiObfuscation.enabled) {
      estimatedTime *= 1.3;
      memoryUsage = 'MEDIUM';
      
      if (config.antiObfuscation.suspiciousPatternKeywords.length > 20) {
        estimatedTime *= 1.2;
        recommendations.push('考慮減少可疑模式關鍵字數量以提升性能');
      }
    }
    
    // 分析記錄影響
    if (config.performance.enableAnalytics) {
      estimatedTime *= 1.1;
      memoryUsage = memoryUsage === 'LOW' ? 'MEDIUM' : 'HIGH';
    }
    
    // 建議優化
    if (estimatedTime > config.performance.maxProcessingTimeMs * 0.8) {
      recommendations.push('預估處理時間接近限制，建議調整配置參數');
    }
    
    if (config.performance.maxRecommendations > 10) {
      recommendations.push('建議限制推薦數量以提升性能');
    }
    
    return {
      estimatedProcessingTime: Math.round(estimatedTime),
      memoryUsage,
      recommendations
    };
  }
}

// 導出配置管理器實例
export const debateConfig = DebateConfigLoader.getInstance();