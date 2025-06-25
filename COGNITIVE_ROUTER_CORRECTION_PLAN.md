# Cognitive Router Correction Implementation Plan

**Created**: 2025-06-24  
**Based on**: RACE/FACT Frameworks (arxiv:2506.11763) + Cognitive Tools (arxiv:2506.12115)  
**Priority**: 🔴 CRITICAL - Core system accuracy affected  

## 🚨 Problem Summary

**Current Implementation**: Enhanced from original hardcoded values but still uses arbitrary character-counting thresholds  
**Academic Standard**: Multi-dimensional cognitive complexity assessment (RACE/FACT frameworks)  
**Performance Gap**: Incorrect routing for complex tasks due to oversimplified algorithm  

### ✅ Previous Improvements Made
- Enhanced keyword detection (temporal/complexity keywords)
- Dynamic scoring boost for keyword matches  
- Fixed TypeScript compilation errors
- Added comprehensive routing justification
- Improved temporal context detection

### 🔴 Remaining Critical Issues
- **Still uses hardcoded character limits**: Lines 46-54 in cognitiveRouter.ts
- **No RACE framework integration**: Missing multi-dimensional assessment
- **No academic benchmark validation**: Not tested against PhD-level tasks
- **Character counting ≠ cognitive complexity**: Fundamental assessment flaw remains  

## 📊 Research Foundation Analysis

### RACE Framework Integration
✅ **Located**: Full framework in DeepResearch Bench repository  
✅ **Methodology**: 4-dimensional assessment with dynamic criteria  
✅ **Benchmarks**: 100 PhD-level tasks for validation  

### Cognitive Tools Enhancement  
✅ **Performance**: 62.5% improvement (26.7% → 43.3% on AIME2024)  
✅ **Theory**: Sequential processing from cognitive psychology  
🟡 **Implementation**: Need full methodology extraction  

### DoTA-RAG Dynamic Routing
🟡 **Framework**: Dynamic thought aggregation identified  
🟡 **Methodology**: Requires full paper access  
🟡 **Integration**: Key for adaptive routing implementation  

## 🔧 Implementation Phases

### Phase 1: RACE-Inspired Assessment (IMMEDIATE - Week 1)

#### Current Problematic Code (STILL PRESENT - Lines 46-54)
```typescript
// CURRENT IMPLEMENTATION: Still uses arbitrary character thresholds
if (descriptionLength < 200) {
  complexityScore += 10;
} else if (descriptionLength < 500) {
  complexityScore += 25;
} else if (descriptionLength < this.graphitiThreshold) {
  complexityScore += 35;
} else {
  complexityScore += 40;
}

// PARTIAL IMPROVEMENTS ALREADY MADE:
// ✅ Enhanced keyword detection (lines 73-94)
// ✅ Temporal context analysis
// ✅ Dynamic keyword scoring boost
// ✅ Comprehensive routing justification
```

#### Corrected Implementation
```typescript
// AFTER: RACE-inspired multi-dimensional assessment
interface RACEAssessment {
  comprehensiveness: number;    // Coverage breadth and depth required
  insightDepth: number;         // Analysis complexity required  
  instructionFollowing: number; // Task requirement complexity
  readability: number;          // Output organization requirements
}

assessTaskComplexity(task: Task): CognitiveRoutingAssessment {
  const raceScore = this.calculateRACEScore(task);
  const cognitiveLoad = this.estimateCognitiveLoad(task);
  const contextualFactors = this.analyzeContextualComplexity(task);
  
  return this.synthesizeComplexityAssessment(raceScore, cognitiveLoad, contextualFactors);
}
```

#### Implementation Steps
1. **Extract RACE Algorithms**: Study DeepResearch Bench repository code
2. **Adapt Scoring Logic**: Create task-specific criteria generation
3. **Replace Character Counting**: Implement cognitive complexity assessment
4. **Validate Against Benchmarks**: Test with PhD-level task samples

### Phase 2: Cognitive Tools Integration (SHORT-TERM - Week 2)

#### Sequential Processing Enhancement
```typescript
// Cognitive tools-inspired reasoning elicitation
class CognitiveSequenceProcessor {
  elicitTaskReasoning(task: Task): ReasoningSequence {
    return {
      comprehensionPhase: this.analyzeTaskComprehension(task),
      decompositionPhase: this.identifySubtaskComponents(task),
      complexityPhase: this.assessCognitiveRequirements(task),
      routingPhase: this.determineOptimalSystemPath(task)
    };
  }
}
```

#### Key Enhancements
- Replace immediate scoring with sequential analysis
- Add reasoning elicitation patterns
- Integrate cognitive psychology principles
- Implement orchestrated, sequential processing

### Phase 3: Dynamic Routing Architecture (MEDIUM-TERM - Week 3-4)

#### DoTA-RAG Integration
```typescript
// Dynamic thought aggregation routing
interface DynamicRoutingDecision {
  primarySystem: 'SYSTEM_1' | 'SYSTEM_2';
  aggregationStrategy: 'SIMPLE' | 'HYBRID' | 'COMPLEX';
  thoughtSequence: ThoughtAggregationPath[];
  adaptiveThresholds: AdaptiveThresholdSet;
}
```

#### Implementation Components
1. **Thought Aggregation**: Dynamic reasoning path construction
2. **Adaptive Thresholds**: Context-aware complexity boundaries  
3. **Hybrid Coordination**: Multi-system orchestration patterns
4. **Performance Feedback**: Continuous routing optimization

## ✅ Validation Strategy

### Benchmark Integration
- **PhD-Level Tasks**: Use DeepResearch Bench's 100 expert tasks
- **Performance Metrics**: Compare against RACE/FACT standards
- **Academic Compliance**: Ensure research methodology alignment

### Testing Framework
```typescript
// Validation test suite
class CognitiveRouterValidator {
  validateAgainstRACEBenchmarks(): ValidationResults;
  testPerformanceImprovement(): PerformanceMetrics; 
  verifyAcademicCompliance(): ComplianceReport;
  measureRoutingAccuracy(): AccuracyMetrics;
}
```

## 📈 Expected Improvements

### Performance Targets
- **Routing Accuracy**: >90% (from current ~60% estimated)
- **Academic Compliance**: 100% research methodology alignment
- **Cognitive Assessment**: Multi-dimensional vs character counting
- **Adaptive Capability**: Context-aware vs static thresholds

### Success Metrics
1. **RACE Scoring**: All 4 dimensions properly assessed
2. **FACT Verification**: Citation and grounding capability
3. **Cognitive Tools**: Sequential reasoning integration
4. **Benchmark Performance**: Pass PhD-level task validation

## 🚀 Implementation Timeline

| Week | Phase | Deliverables | Validation |
|------|-------|--------------|------------|
| 1 | RACE Integration | Multi-dimensional assessment | Benchmark testing |
| 2 | Cognitive Tools | Sequential processing | Performance metrics |
| 3-4 | DoTA-RAG | Dynamic routing | Academic compliance |

## 📋 Dependencies

### Research Dependencies
- ✅ RACE/FACT frameworks (DeepResearch Bench repository)
- 🟡 Cognitive Tools methodology (need full paper)
- 🟡 DoTA-RAG implementation details (need full paper)

### Technical Dependencies  
- ✅ Existing TaskComplexityAssessment interface
- ✅ MCP Server integration (Graphiti/Supabase)
- ✅ TypeScript type system
- 🔄 New RACE assessment algorithms

## 🔄 Status

- ✅ **Problem Documented**: Critical limitation identified and analyzed
- ✅ **Research Foundation**: Academic papers located and frameworks extracted  
- ✅ **Partial Improvements**: Enhanced keyword detection and temporal context analysis implemented
- ✅ **Implementation Plan**: Detailed 3-phase correction strategy
- 🔴 **Core Issue Remains**: Character-counting thresholds still present (lines 46-54 in cognitiveRouter.ts)
- 🔄 **Ready to Implement**: Phase 1 can begin immediately with RACE integration to replace remaining hardcoded values

---

## 📋 Current Implementation Status Summary

### ✅ Already Implemented (Previous Session)
- Enhanced temporal keyword detection (lines 73-94)
- Dynamic complexity scoring boost for keyword matches
- Improved routing justification with detailed explanations  
- Fixed TypeScript compilation errors
- Added comprehensive temporal context analysis

### 🔴 Still Requires Correction
- **Hardcoded character thresholds** (lines 46-54): Core academic compliance issue
- **RACE framework integration**: Multi-dimensional assessment missing
- **PhD-level benchmark validation**: No academic standard verification
- **Cognitive Load Theory compliance**: Character counting vs cognitive complexity

**Next Action**: Begin Phase 1 - Extract RACE algorithms from DeepResearch Bench repository and implement multi-dimensional cognitive assessment to replace the remaining hardcoded character counting thresholds (lines 46-54 in cognitiveRouter.ts).