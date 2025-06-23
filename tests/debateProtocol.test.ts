/**
 * Debate Protocol Testing Framework
 * 辯論協議測試框架
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  DebateProtocolConfig, 
  DebateConfigValidator, 
  DebateConfigLoader,
  DebateConfigAnalyzer,
  DEFAULT_DEBATE_CONFIG,
  debateConfig
} from '../src/config/debateProtocol.js';
import { 
  performAntiObfuscationValidation,
  validateTaskEvidence,
  detectInconsistencies,
  applyHonestIncentives
} from '../src/utils/antiObfuscation.js';
import { Task, TaskStatus } from '../src/types/index.js';

// 測試用模擬任務
const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'test-task-id',
  name: 'Test Task',
  description: 'This is a comprehensive test task for validation',
  status: TaskStatus.IN_PROGRESS,
  dependencies: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  implementationGuide: 'Follow the implementation steps carefully',
  verificationCriteria: 'Ensure all requirements are met with proper testing',
  ...overrides
});

describe('Debate Protocol Configuration System', () => {
  
  describe('DebateConfigValidator', () => {
    it('should validate default configuration successfully', () => {
      const result = DebateConfigValidator.validate(DEFAULT_DEBATE_CONFIG);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should detect invalid weight sums', () => {
      const invalidConfig: DebateProtocolConfig = {
        ...DEFAULT_DEBATE_CONFIG,
        intensitySettings: {
          ...DEFAULT_DEBATE_CONFIG.intensitySettings,
          light: {
            ...DEFAULT_DEBATE_CONFIG.intensitySettings.light,
            weights: { prover: 0.5, estimator: 0.5, synthesis: 0.2 } // sums to 1.2
          }
        }
      };
      
      const result = DebateConfigValidator.validate(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('weights do not sum to 1.0'))).toBe(true);
    });
    
    it('should detect invalid thresholds', () => {
      const invalidConfig: DebateProtocolConfig = {
        ...DEFAULT_DEBATE_CONFIG,
        scoring: {
          ...DEFAULT_DEBATE_CONFIG.scoring,
          completionThreshold: 150 // invalid range
        }
      };
      
      const result = DebateConfigValidator.validate(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Completion threshold must be between 0 and 100'))).toBe(true);
    });
    
    it('should detect invalid confidence threshold order', () => {
      const invalidConfig: DebateProtocolConfig = {
        ...DEFAULT_DEBATE_CONFIG,
        scoring: {
          ...DEFAULT_DEBATE_CONFIG.scoring,
          confidenceThresholds: {
            low: 90,
            medium: 80, // should be higher than low
            high: 95
          }
        }
      };
      
      const result = DebateConfigValidator.validate(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('ascending order'))).toBe(true);
    });
  });
  
  describe('DebateConfigLoader', () => {
    let configLoader: DebateConfigLoader;
    
    beforeEach(() => {
      configLoader = DebateConfigLoader.getInstance();
      configLoader.resetToDefault();
    });
    
    it('should return singleton instance', () => {
      const instance1 = DebateConfigLoader.getInstance();
      const instance2 = DebateConfigLoader.getInstance();
      expect(instance1).toBe(instance2);
    });
    
    it('should update configuration successfully', () => {
      const updates = {
        performance: {
          ...DEFAULT_DEBATE_CONFIG.performance,
          maxProcessingTimeMs: 10000
        }
      };
      
      const result = configLoader.updateConfig(updates);
      expect(result.success).toBe(true);
      expect(configLoader.getConfig().performance.maxProcessingTimeMs).toBe(10000);
    });
    
    it('should reject invalid configuration updates', () => {
      const invalidUpdates = {
        scoring: {
          ...DEFAULT_DEBATE_CONFIG.scoring,
          completionThreshold: -10
        }
      };
      
      const result = configLoader.updateConfig(invalidUpdates);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should get intensity configuration correctly', () => {
      const lightConfig = configLoader.getIntensityConfig('LIGHT');
      expect(lightConfig.weights.prover).toBe(0.4);
      
      const rigorousConfig = configLoader.getIntensityConfig('RIGOROUS');
      expect(rigorousConfig.weights.estimator).toBe(0.4);
    });
  });
  
  describe('DebateConfigAnalyzer', () => {
    it('should analyze performance impact', () => {
      const analysis = DebateConfigAnalyzer.analyzePerformanceImpact(DEFAULT_DEBATE_CONFIG);
      
      expect(analysis.estimatedProcessingTime).toBeGreaterThan(0);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(analysis.memoryUsage);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });
    
    it('should provide recommendations for high-load configurations', () => {
      const heavyConfig: DebateProtocolConfig = {
        ...DEFAULT_DEBATE_CONFIG,
        antiObfuscation: {
          ...DEFAULT_DEBATE_CONFIG.antiObfuscation,
          suspiciousPatternKeywords: new Array(50).fill('keyword') // excessive keywords
        },
        performance: {
          ...DEFAULT_DEBATE_CONFIG.performance,
          maxRecommendations: 20 // excessive recommendations
        }
      };
      
      const analysis = DebateConfigAnalyzer.analyzePerformanceImpact(heavyConfig);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations.some(r => r.includes('關鍵字數量'))).toBe(true);
    });
  });
});

describe('Anti-Obfuscation Validation', () => {
  
  describe('validateTaskEvidence', () => {
    it('should validate consistent task evidence', () => {
      const task = createMockTask({
        description: 'Implement user authentication system with secure login',
        verificationCriteria: 'Authentication system should handle login securely',
        implementationGuide: 'Use bcrypt for password hashing and JWT for sessions'
      });
      
      const summary = 'Successfully implemented secure authentication system with bcrypt password hashing and JWT session management. Login functionality thoroughly tested and meets all security requirements.';
      
      const result = validateTaskEvidence(task, summary);
      expect(result.score).toBeGreaterThan(70);
      expect(result.issues.length).toBe(0);
    });
    
    it('should detect inconsistent task evidence', () => {
      const task = createMockTask({
        description: 'Implement user authentication system',
        verificationCriteria: 'Authentication system should be secure'
      });
      
      const summary = 'Created a simple dashboard with charts and graphs.'; // completely unrelated
      
      const result = validateTaskEvidence(task, summary);
      expect(result.score).toBeLessThan(50);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });
  
  describe('detectInconsistencies', () => {
    it('should detect suspicious keywords', () => {
      const suspiciousText = 'This is a mock implementation that is incomplete and needs fixing.';
      const patterns = detectInconsistencies(suspiciousText);
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.includes('mock'))).toBe(true);
      expect(patterns.some(p => p.includes('incomplete'))).toBe(true);
    });
    
    it('should detect contradictory statements', () => {
      const contradictoryText = 'The feature is completed and working perfectly. However, it is not implemented and broken.';
      const patterns = detectInconsistencies(contradictoryText);
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.includes('矛盾陳述'))).toBe(true);
    });
    
    it('should detect excessive repetition', () => {
      const repetitiveText = 'This is working fine. This is working fine. This is working fine. This is working fine.';
      const patterns = detectInconsistencies(repetitiveText);
      
      expect(patterns.some(p => p.includes('重複'))).toBe(true);
    });
  });
  
  describe('applyHonestIncentives', () => {
    it('should apply bonuses for high evidence scores', () => {
      const result = applyHonestIncentives(85, 90, [], DEFAULT_DEBATE_CONFIG.antiObfuscation);
      
      expect(result.adjustedScore).toBeGreaterThan(85);
      expect(result.incentiveAnalysis.some(a => a.includes('獎勵'))).toBe(true);
    });
    
    it('should apply penalties for suspicious patterns', () => {
      const suspiciousPatterns = ['包含可疑關鍵字: mock', '矛盾陳述: completed and incomplete'];
      const result = applyHonestIncentives(85, 60, suspiciousPatterns, DEFAULT_DEBATE_CONFIG.antiObfuscation);
      
      expect(result.adjustedScore).toBeLessThan(85);
      expect(result.incentiveAnalysis.some(a => a.includes('扣除'))).toBe(true);
    });
  });
  
  describe('performAntiObfuscationValidation', () => {
    it('should perform comprehensive validation', () => {
      const task = createMockTask();
      const summary = 'Completed the task implementation following all guidelines and verification criteria.';
      
      const result = performAntiObfuscationValidation(task, summary, 85);
      
      expect(result.evidenceConsistency).toBeGreaterThan(0);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.manipulationRisk);
      expect(Array.isArray(result.truthfulnessIndicators)).toBe(true);
      expect(Array.isArray(result.suspiciousPatterns)).toBe(true);
    });
  });
});

describe('Debate Protocol Integration Tests', () => {
  
  describe('End-to-End Workflow', () => {
    it('should process debate verification with all components', () => {
      const task = createMockTask();
      const summary = 'Successfully implemented all requirements with thorough testing and documentation.';
      
      // Test configuration loading
      const config = debateConfig.getConfig();
      expect(config).toBeDefined();
      
      // Test anti-obfuscation validation
      const validation = performAntiObfuscationValidation(task, summary, 90);
      expect(validation.manipulationRisk).toBe('LOW');
      
      // Test performance analysis
      const performance = DebateConfigAnalyzer.analyzePerformanceImpact(config);
      expect(performance.estimatedProcessingTime).toBeLessThan(config.performance.maxProcessingTimeMs);
    });
  });
  
  describe('Performance Benchmarks', () => {
    it('should complete validation within time limits', () => {
      const startTime = Date.now();
      const task = createMockTask();
      const summary = 'This is a comprehensive summary with detailed implementation notes and verification results.';
      
      performAntiObfuscationValidation(task, summary, 85);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(DEFAULT_DEBATE_CONFIG.performance.maxProcessingTimeMs);
    });
    
    it('should handle large summaries efficiently', () => {
      const task = createMockTask();
      const largeSummary = 'Detailed implementation summary. '.repeat(1000); // ~31KB text
      
      const startTime = Date.now();
      const result = performAntiObfuscationValidation(task, largeSummary, 85);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result).toBeDefined();
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty summaries', () => {
      const task = createMockTask();
      const result = performAntiObfuscationValidation(task, '', 80);
      
      expect(result.evidenceConsistency).toBeLessThan(50);
      expect(result.manipulationRisk).not.toBe('LOW');
    });
    
    it('should handle tasks without optional fields', () => {
      const minimalTask = createMockTask({
        verificationCriteria: undefined,
        implementationGuide: undefined,
        analysisResult: undefined
      });
      
      const result = performAntiObfuscationValidation(minimalTask, 'Basic completion summary', 80);
      expect(result).toBeDefined();
      expect(result.evidenceConsistency).toBeGreaterThan(0);
    });
    
    it('should handle extreme scores', () => {
      const task = createMockTask();
      
      const lowScoreResult = performAntiObfuscationValidation(task, 'Poor implementation', 10);
      expect(lowScoreResult.manipulationRisk).not.toBe('LOW');
      
      const highScoreResult = performAntiObfuscationValidation(task, 'Perfect implementation', 100);
      expect(highScoreResult.evidenceConsistency).toBeGreaterThan(0);
    });
  });
  
  describe('Configuration Edge Cases', () => {
    it('should handle extreme configuration values', () => {
      const extremeConfig: DebateProtocolConfig = {
        ...DEFAULT_DEBATE_CONFIG,
        performance: {
          ...DEFAULT_DEBATE_CONFIG.performance,
          maxProcessingTimeMs: 1, // extremely low
          maxRecommendations: 100 // extremely high
        }
      };
      
      const analysis = DebateConfigAnalyzer.analyzePerformanceImpact(extremeConfig);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
    
    it('should maintain stability with disabled features', () => {
      const disabledConfig: DebateProtocolConfig = {
        ...DEFAULT_DEBATE_CONFIG,
        antiObfuscation: {
          ...DEFAULT_DEBATE_CONFIG.antiObfuscation,
          enabled: false
        },
        performance: {
          ...DEFAULT_DEBATE_CONFIG.performance,
          enableAnalytics: false
        }
      };
      
      const validation = DebateConfigValidator.validate(disabledConfig);
      expect(validation.isValid).toBe(true);
    });
  });
});

describe('Debate Protocol Analytics', () => {
  
  describe('Performance Metrics', () => {
    it('should track processing time metrics', () => {
      const metrics: Array<{ operation: string; duration: number }> = [];
      
      const task = createMockTask();
      const summary = 'Test summary for metrics collection';
      
      const start = performance.now();
      performAntiObfuscationValidation(task, summary, 85);
      const end = performance.now();
      
      metrics.push({ operation: 'anti-obfuscation-validation', duration: end - start });
      
      expect(metrics[0].duration).toBeGreaterThan(0);
      expect(metrics[0].duration).toBeLessThan(1000); // Should be fast
    });
  });
  
  describe('Quality Metrics', () => {
    it('should measure validation accuracy', () => {
      const testCases = [
        { task: createMockTask(), summary: 'High quality implementation with all requirements met', expectedRisk: 'LOW' },
        { task: createMockTask(), summary: 'This is fake and incomplete mock implementation', expectedRisk: 'HIGH' },
        { task: createMockTask(), summary: 'Partial implementation with some issues', expectedRisk: 'MEDIUM' }
      ];
      
      const results = testCases.map(testCase => ({
        expected: testCase.expectedRisk,
        actual: performAntiObfuscationValidation(testCase.task, testCase.summary, 80).manipulationRisk
      }));
      
      const accuracy = results.filter(r => r.expected === r.actual).length / results.length;
      expect(accuracy).toBeGreaterThan(0.6); // At least 60% accuracy
    });
  });
});