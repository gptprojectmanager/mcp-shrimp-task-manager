# DeepResearch Bench Analysis - RACE/FACT Frameworks

**Paper ID**: arxiv:2506.11763  
**Repository**: https://github.com/Ayanami0730/deep_research_bench  
**Authors**: Mingxuan Du, Benfeng Xu, Chiwei Zhu, Xiaorui Wang, Zhendong Mao  
**Retrieved**: 2025-06-24  

## ✅ CRITICAL DISCOVERY: RACE/FACT Methodologies Found!

### RACE Framework (Reference-based Adaptive Criteria-driven Evaluation)
**Purpose**: Evaluates report generation quality  

**Key Components**:
1. **Dynamic Criteria Generation**: Task-specific evaluation across 4 dimensions
   - 📚 **Comprehensiveness**: Coverage breadth and depth
   - 🔍 **Insight/Depth**: Quality of analysis and insight generation  
   - 📋 **Instruction-Following**: Adherence to task requirements
   - 📖 **Readability**: Clarity, organization, presentation

2. **Reference-Based Scoring**: Compares against high-quality reference reports
3. **Weighted Assessment**: Dynamic weights adapted to task requirements

### FACT Framework (Framework for Factual Abundance and Citation Trustworthiness)
**Purpose**: Evaluates information retrieval and grounding capabilities

**Key Components**:
1. **Statement-URL Extraction**: Extracts factual claims and sources
2. **Deduplication**: Removes redundant statement-URL pairs
3. **Support Verification**: Web scraping + LLM judgment for citation accuracy
4. **Citation Metrics**: 
   - Citation Accuracy: % of correctly supported citations
   - Effective Citations: Average verifiably supported citations per task

## 🎯 Implementation Relevance for Cognitive Router

### RACE Framework Applications
- **Dynamic Criteria**: Can inform our task complexity assessment
- **Multi-dimensional Scoring**: Replace hardcoded thresholds with adaptive criteria
- **Reference-Based**: Use benchmark tasks for calibration

### FACT Framework Applications  
- **Verification Patterns**: Could enhance our task verification system
- **Grounding Requirements**: Inform episodic memory storage decisions
- **Citation Tracking**: Monitor knowledge source reliability

## 🔧 Correction Plan for Cognitive Router

### Replace Hardcoded Thresholds
```typescript
// BEFORE (Hardcoded)
if (descriptionLength < 200) complexityScore += 10;

// AFTER (RACE-Inspired)
const comprehensivenessScore = this.assessComprehensiveness(task);
const depthScore = this.assessRequiredDepth(task);
const instructionComplexity = this.assessInstructionComplexity(task);
```

### PhD-Level Benchmarking Standards
- **100 PhD-level research tasks** across 22 domains
- **Expert validation** (PhD-level + 5+ years experience)
- **Real-world demand distribution** from 96,147 user queries

## 📊 Performance Standards
- Top performing systems: 40-49% overall RACE scores
- Citation accuracy: 77-94% across models
- Effective citations: 4-111 per task (huge variance)

## 🚀 Next Implementation Steps

1. **Extract RACE Scoring Logic**: Implement dynamic criteria generation
2. **Adapt FACT Verification**: Create citation/source tracking for episodic memory
3. **Benchmark Integration**: Use their 100 tasks for cognitive router validation
4. **Multi-dimensional Assessment**: Replace character counting with comprehensive evaluation

## Status
✅ **RACE/FACT Frameworks Located and Analyzed**  
✅ **Implementation Path Identified**  
🔄 **Ready for Cognitive Router Correction**