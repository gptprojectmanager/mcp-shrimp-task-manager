# Debate Protocol Usage Guide

## Overview

The Debate Protocol system enhances task verification through Prover-Estimator debate patterns, anti-obfuscation validation, and configurable scoring mechanisms. This guide covers configuration, usage, and best practices.

## Configuration System

### Basic Configuration

```typescript
import { debateConfig } from '../src/config/debateProtocol.js';

// Get current configuration
const config = debateConfig.getConfig();

// Update configuration
const result = debateConfig.updateConfig({
  performance: {
    maxProcessingTimeMs: 10000,
    maxRecommendations: 8
  }
});

if (result.success) {
  console.log('Configuration updated successfully');
} else {
  console.error('Configuration errors:', result.errors);
}
```

### Intensity Levels

The system supports three debate intensity levels:

#### Light Intensity
- **Use case**: Simple tasks, quick validation
- **Weights**: Prover 40%, Estimator 30%, Synthesis 30%
- **Incentives**: Minimal consensus requirements, moderate conflict tolerance
- **Performance**: Fastest processing

#### Moderate Intensity (Default)
- **Use case**: Standard tasks, balanced validation
- **Weights**: Prover 35%, Estimator 35%, Synthesis 30%
- **Incentives**: Balanced consensus/conflict handling
- **Performance**: Standard processing time

#### Rigorous Intensity
- **Use case**: Critical tasks, thorough validation
- **Weights**: Prover 30%, Estimator 40%, Synthesis 30%
- **Incentives**: High consensus requirements, low conflict tolerance
- **Performance**: Longer processing time, higher accuracy

### Anti-Obfuscation Settings

```typescript
// Configure anti-obfuscation detection
debateConfig.updateConfig({
  antiObfuscation: {
    enabled: true,
    evidenceThreshold: 75,
    manipulationSensitivity: 'HIGH',
    suspiciousPatternKeywords: [
      'fake', 'mock', 'placeholder', 'todo'
    ]
  }
});
```

## Usage Examples

### Basic Verification with Debate Protocol

```typescript
import { verifyTask } from '../src/tools/task/verifyTask.js';

// Standard verification (uses current config)
const result = await verifyTask({
  taskId: 'task-uuid',
  summary: 'Task completion summary',
  score: 85
});

// Verification with debate parameters
const debateResult = await verifyTask({
  taskId: 'task-uuid',
  summary: 'Detailed task completion with evidence',
  score: 85,
  debateParams: {
    enableDebateProtocol: true,
    debateIntensity: 'RIGOROUS',
    antiObfuscationEnabled: true,
    proverScore: 90,
    estimatorScore: 80,
    consensusPoints: ['Requirements met', 'Tests passing'],
    conflicts: ['Performance concerns'],
    resolutionJustification: 'Overall completion despite minor performance issues'
  }
});
```

### Configuration for Different Task Types

```typescript
// For critical system tasks
debateConfig.updateConfig({
  intensitySettings: {
    rigorous: {
      weights: { prover: 0.25, estimator: 0.45, synthesis: 0.3 },
      incentives: {
        consensusBonus: 4.0,
        conflictPenalty: 3.0,
        scoreDiscrepancyPenalty: 20,
        maxScoreDiscrepancy: 15
      }
    }
  }
});

// For rapid prototyping tasks
debateConfig.updateConfig({
  intensitySettings: {
    light: {
      weights: { prover: 0.5, estimator: 0.2, synthesis: 0.3 },
      incentives: {
        consensusBonus: 1.0,
        conflictPenalty: 0.5,
        scoreDiscrepancyPenalty: 3,
        maxScoreDiscrepancy: 40
      }
    }
  }
});
```

## Performance Optimization

### Analyzing Performance Impact

```typescript
import { DebateConfigAnalyzer } from '../src/config/debateProtocol.js';

const analysis = DebateConfigAnalyzer.analyzePerformanceImpact(config);
console.log('Estimated processing time:', analysis.estimatedProcessingTime);
console.log('Memory usage:', analysis.memoryUsage);
console.log('Recommendations:', analysis.recommendations);
```

### Performance Tuning

1. **Reduce Processing Time**:
   - Limit suspicious pattern keywords
   - Disable analytics for high-throughput scenarios
   - Use LIGHT intensity for non-critical tasks

2. **Optimize Memory Usage**:
   - Limit recommendation count
   - Reduce pattern keyword list
   - Disable detailed logging

3. **Balance Accuracy vs Speed**:
   - Use MODERATE intensity as default
   - Enable anti-obfuscation selectively
   - Configure appropriate thresholds

## Testing Framework

### Running Tests

```bash
# Run all debate protocol tests
npm test -- --testPathPattern=debateProtocol

# Run specific test suites
npm test -- --testNamePattern="Anti-Obfuscation"
npm test -- --testNamePattern="Configuration"
npm test -- --testNamePattern="Performance"
```

### Custom Test Cases

```typescript
// Create custom validation tests
describe('Custom Task Validation', () => {
  it('should validate domain-specific tasks', () => {
    const task = createMockTask({
      description: 'Implement secure payment processing',
      verificationCriteria: 'PCI DSS compliance required'
    });
    
    const result = performAntiObfuscationValidation(
      task,
      'Implemented payment processing with PCI DSS compliance',
      90
    );
    
    expect(result.manipulationRisk).toBe('LOW');
    expect(result.evidenceConsistency).toBeGreaterThan(80);
  });
});
```

## Best Practices

### Configuration Management

1. **Environment-Specific Configs**:
   ```typescript
   // Development environment
   if (process.env.NODE_ENV === 'development') {
     debateConfig.updateConfig({
       performance: { logLevel: 'DEBUG' },
       antiObfuscation: { manipulationSensitivity: 'LOW' }
     });
   }
   
   // Production environment
   if (process.env.NODE_ENV === 'production') {
     debateConfig.updateConfig({
       performance: { logLevel: 'ERROR' },
       antiObfuscation: { manipulationSensitivity: 'HIGH' }
     });
   }
   ```

2. **Task-Type-Specific Settings**:
   ```typescript
   function getConfigForTaskType(taskType: string) {
     switch (taskType) {
       case 'security':
         return { debateIntensity: 'RIGOROUS', antiObfuscationEnabled: true };
       case 'prototype':
         return { debateIntensity: 'LIGHT', antiObfuscationEnabled: false };
       default:
         return { debateIntensity: 'MODERATE', antiObfuscationEnabled: true };
     }
   }
   ```

### Validation Guidelines

1. **Prover-Estimator Balance**:
   - Prover should focus on evidence and achievements
   - Estimator should identify risks and gaps
   - Resolution should synthesize both perspectives

2. **Evidence Standards**:
   - Include concrete implementation details
   - Reference verification criteria compliance
   - Provide measurable outcomes

3. **Conflict Resolution**:
   - Document genuine disagreements
   - Justify final scoring decisions
   - Learn from debate patterns

### Monitoring and Analytics

```typescript
// Track debate protocol effectiveness
const analytics = {
  totalVerifications: 0,
  debateProtocolUsage: 0,
  averageProcessingTime: 0,
  manipulationDetectionRate: 0
};

// Collect metrics during verification
function collectMetrics(result: any) {
  analytics.totalVerifications++;
  if (result.metadata?.debateResult) {
    analytics.debateProtocolUsage++;
  }
  // ... collect other metrics
}
```

## Troubleshooting

### Common Issues

1. **Configuration Validation Errors**:
   ```typescript
   const validation = DebateConfigValidator.validate(config);
   if (!validation.isValid) {
     console.error('Config errors:', validation.errors);
     // Fix common issues:
     // - Ensure weights sum to 1.0
     // - Check threshold ranges (0-100)
     // - Verify confidence thresholds are in order
   }
   ```

2. **Performance Issues**:
   ```typescript
   // Check processing time
   const analysis = DebateConfigAnalyzer.analyzePerformanceImpact(config);
   if (analysis.estimatedProcessingTime > config.performance.maxProcessingTimeMs) {
     // Recommendations will suggest optimizations
     console.log('Optimization needed:', analysis.recommendations);
   }
   ```

3. **Anti-Obfuscation False Positives**:
   ```typescript
   // Adjust sensitivity for domain-specific language
   debateConfig.updateConfig({
     antiObfuscation: {
       manipulationSensitivity: 'LOW',
       suspiciousPatternKeywords: customKeywords // Remove domain terms
     }
   });
   ```

### Debug Mode

```typescript
// Enable detailed logging
debateConfig.updateConfig({
  performance: { logLevel: 'DEBUG' }
});

// Manual validation steps
const task = getTaskById('task-id');
const evidence = validateTaskEvidence(task, summary);
const patterns = detectInconsistencies(summary);
const incentives = applyHonestIncentives(score, evidence.score, patterns);
```

## API Reference

### Configuration Classes

- `DebateProtocolConfig`: Main configuration interface
- `DebateConfigValidator`: Configuration validation utilities
- `DebateConfigLoader`: Singleton configuration manager
- `DebateConfigAnalyzer`: Performance impact analysis

### Validation Functions

- `performAntiObfuscationValidation()`: Complete validation pipeline
- `validateTaskEvidence()`: Evidence consistency checking
- `detectInconsistencies()`: Pattern and contradiction detection
- `applyHonestIncentives()`: Truthfulness incentive application

### Integration Points

- `verifyTask()`: Enhanced verification with debate protocol
- `calculateDebateScore()`: Core debate scoring logic
- `updateTaskWithDebateResults()`: Complete task update with metadata

For detailed API documentation, refer to the TypeScript definitions in the source code.