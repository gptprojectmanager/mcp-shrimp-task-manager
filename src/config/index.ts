/**
 * Configuration Management Index
 * 配置管理入口
 */

export * from './debateProtocol.js';

// 配置管理工具
export class ConfigManager {
  private static instance: ConfigManager;
  
  private constructor() {}
  
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  // 獲取所有配置的摘要
  getConfigSummary() {
    const { debateConfig } = require('./debateProtocol.js');
    const config = debateConfig.getConfig();
    
    return {
      debateProtocol: {
        enabled: true,
        intensityLevels: Object.keys(config.intensitySettings),
        antiObfuscationEnabled: config.antiObfuscation.enabled,
        performanceSettings: {
          maxProcessingTime: config.performance.maxProcessingTimeMs,
          analyticsEnabled: config.performance.enableAnalytics
        }
      }
    };
  }
  
  // 驗證所有配置
  validateAllConfigs(): { isValid: boolean; errors: string[] } {
    const { DebateConfigValidator, debateConfig } = require('./debateProtocol.js');
    const config = debateConfig.getConfig();
    
    return DebateConfigValidator.validate(config);
  }
}

// 導出配置管理器實例
export const configManager = ConfigManager.getInstance();