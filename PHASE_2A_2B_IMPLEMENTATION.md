# Phase 2A-2B: System 1/System 2 Cognitive Architecture Integration

## Overview

Strategic integration of Graphiti MCP (episodic memory/System 2) and Supabase MCP (high-throughput/System 1) servers with intelligent routing based on task complexity assessment and academic research frameworks.

## Academic Research Foundation

### Papers Referenced
- **arxiv:2506.10408v1**: DoTA-RAG Framework - Dynamic-of-Thought Aggregation RAG
- **arxiv:2506.12571**: Advanced RAG methodologies  
- **RACE/FACT methodologies**: Structured reasoning frameworks

### Cognitive Architecture Theory
- **System 1 (Fast)**: Automatic, intuitive, high-throughput processing
- **System 2 (Deliberative)**: Controlled, analytical, complex reasoning

## Technical Implementation Strategy

### System Mapping
- **System 1 (Supabase MCP)**: `localhost:8000`
  - High-throughput database operations
  - Simple queries and retrieval
  - Fast response requirements
  - Tasks with complexity < MEDIUM threshold

- **System 2 (Graphiti MCP)**: `localhost:8010` 
  - Episodic memory storage/retrieval
  - Temporal knowledge graphs
  - Complex reasoning operations
  - Tasks with complexity >= HIGH threshold

### Routing Decision Logic

```typescript
// Complexity-Based Routing
LOW complexity (description < 500 chars, dependencies < 2) → Supabase (System 1)
MEDIUM complexity (hybrid assessment) → Both systems coordination
HIGH complexity (description > 1000 chars, dependencies > 5) → Graphiti (System 2) 
VERY_HIGH complexity → Graphiti + episodic memory storage
```

## Task Implementation Plan

### Task 1: Create CognitiveRouter Core Module
**ID**: `fc39ecf6-93f1-4734-9cfe-510132689fc0`
- Implement core cognitive routing system
- Intelligent delegation between Supabase and Graphiti MCP
- Based on TaskComplexityLevel assessment

### Task 2: Extend TaskComplexityAssessment for Cognitive Routing  
**ID**: `91f58f38-770a-4f71-b941-b4e3007499af`
- Enhance TaskComplexityAssessment interface
- Add cognitive routing decisions and MCP server recommendations
- Include episodic memory requirements

### Task 3: Implement MCP Integration Layer
**ID**: `12e1a221-395b-4825-9bc7-a7312549749d`  
- Create unified interface for MCP communication
- Abstract protocol details for both servers
- Handle error cases and retry logic

### Task 4: Integrate Episodic Memory via Graphiti MCP
**ID**: `f6d0e8fe-31fe-4b76-ab65-f6e6523eb80c`
- Persistent storage of complex task analysis
- Temporal knowledge graph integration
- System 2 cognitive operations

### Task 5: Update Task Model with Cognitive Routing
**ID**: `7a8b3050-3c93-4f5b-ae70-78315f0f7e17`
- Integrate routing logic into task lifecycle
- Automatic complexity assessment during creation
- MCP server delegation during execution

### Task 6: Add Performance Monitoring for Routing Effectiveness  
**ID**: `7990716d-c4ff-4b18-89a4-3be53392671a`
- Track routing effectiveness metrics
- Monitor MCP server response times
- Continuous optimization recommendations

## Architecture Integration

### Existing Infrastructure
- **Shrimp Task Manager**: TaskComplexityLevel enum (LOW/MEDIUM/HIGH/VERY_HIGH)
- **MCP Servers**: Pre-configured in `/home/sam/.claude.json`
- **Type System**: Comprehensive TypeScript interfaces

### New Components
- `CognitiveRouter` class for intelligent routing
- `CognitiveRoutingAssessment` interface extending existing assessment
- `MCPIntegrationLayer` for unified MCP communication
- `RoutingPerformanceMonitor` for effectiveness tracking

## Expected Benefits

1. **Intelligent Task Routing**: Automatic delegation based on complexity
2. **Optimized Performance**: Fast operations via System 1, complex reasoning via System 2  
3. **Episodic Memory**: Persistent knowledge accumulation for complex tasks
4. **Academic Compliance**: Implementation follows established cognitive science research
5. **Scalable Architecture**: Foundation for advanced AI task management

## Implementation Status

- ✅ **Research & Analysis**: Academic papers reviewed, strategy defined
- ✅ **Task Planning**: 6 tasks defined with clear dependencies  
- ⏳ **Implementation**: Ready to begin Task 1 (CognitiveRouter Core Module)
- ⏳ **Testing**: Performance monitoring and validation pending
- ⏳ **Optimization**: Routing effectiveness analysis pending

## Dependencies

### MCP Server Requirements
- Graphiti MCP Server running on `localhost:8010`
- Supabase MCP Server running on `localhost:8000`  
- Claude Code MCP integration enabled

### Code Dependencies
- Existing TaskComplexityAssessment framework
- Shrimp Task Manager type system
- MCP protocol integration

---

**Generated**: 2025-01-24  
**Implementation**: Phase 2A-2B Cognitive Architecture Integration  
**Academic Foundation**: DoTA-RAG, RACE/FACT, System 1/System 2 Theory