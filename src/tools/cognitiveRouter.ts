import {
  Task,
  TaskComplexityLevel,
  TaskComplexityThresholds,
  TaskComplexityAssessment,
  CognitiveRoutingAssessment,
  MCPOperation,
  MCPResult,
} from '../types/index.js';

/**
 * CognitiveRouter: Core cognitive routing system implementing System 1/System 2 architecture
 * Routes tasks between Supabase MCP (System 1 - fast) and Graphiti MCP (System 2 - deliberative)
 * Based on DoTA-RAG framework and academic research patterns
 */
export class CognitiveRouter {
  private readonly supabaseThreshold = TaskComplexityThresholds.DESCRIPTION_LENGTH.MEDIUM;
  private readonly graphitiThreshold = TaskComplexityThresholds.DESCRIPTION_LENGTH.HIGH;
  private readonly dependencyThresholdMedium = TaskComplexityThresholds.DEPENDENCIES_COUNT.MEDIUM;
  private readonly dependencyThresholdHigh = TaskComplexityThresholds.DEPENDENCIES_COUNT.HIGH;

  /**
   * Assess task complexity and determine cognitive routing strategy
   * @param task Task to assess for cognitive routing
   * @returns Enhanced cognitive routing assessment
   */
  public assessTaskComplexity(task: Task): CognitiveRoutingAssessment {
    const descriptionLength = task.description.length;
    const dependenciesCount = task.dependencies.length;
    const notesLength = task.notes?.length || 0;
    const hasNotes = !!task.notes;

    // Calculate complexity score (0-100)
    let complexityScore = 0;
    
    // Description length scoring (40% weight)
    if (descriptionLength < this.supabaseThreshold) {
      complexityScore += 10;
    } else if (descriptionLength < this.graphitiThreshold) {
      complexityScore += 30;
    } else {
      complexityScore += 40;
    }

    // Dependencies scoring (30% weight)
    if (dependenciesCount < this.dependencyThresholdMedium) {
      complexityScore += 5;
    } else if (dependenciesCount < this.dependencyThresholdHigh) {
      complexityScore += 15;
    } else {
      complexityScore += 30;
    }

    // Notes complexity scoring (20% weight)
    if (notesLength > TaskComplexityThresholds.NOTES_LENGTH.HIGH) {
      complexityScore += 20;
    } else if (notesLength > TaskComplexityThresholds.NOTES_LENGTH.MEDIUM) {
      complexityScore += 10;
    }

    // Temporal context indicators (10% weight)
    const temporalKeywords = ['temporal', 'time', 'sequence', 'history', 'memory', 'context', 'knowledge'];
    const hasTemporalContext = temporalKeywords.some(keyword => 
      task.description.toLowerCase().includes(keyword) || 
      (task.notes && task.notes.toLowerCase().includes(keyword))
    );
    
    if (hasTemporalContext) {
      complexityScore += 10;
    }

    // Determine complexity level
    let level: TaskComplexityLevel;
    if (complexityScore <= 25) {
      level = TaskComplexityLevel.LOW;
    } else if (complexityScore <= 50) {
      level = TaskComplexityLevel.MEDIUM;
    } else if (complexityScore <= 75) {
      level = TaskComplexityLevel.HIGH;
    } else {
      level = TaskComplexityLevel.VERY_HIGH;
    }

    // Determine system recommendation and routing
    let systemRecommendation: 'SYSTEM_1' | 'SYSTEM_2' | 'HYBRID';
    let mcpServerTarget: 'supabase' | 'graphiti' | 'hybrid';
    let episodicMemoryRequired = false;
    const routingJustification: string[] = [];

    if (level === TaskComplexityLevel.LOW) {
      systemRecommendation = 'SYSTEM_1';
      mcpServerTarget = 'supabase';
      routingJustification.push('Low complexity task suitable for fast System 1 processing');
      routingJustification.push('High-throughput database operations via Supabase MCP');
    } else if (level === TaskComplexityLevel.MEDIUM) {
      systemRecommendation = 'HYBRID';
      mcpServerTarget = 'hybrid';
      routingJustification.push('Medium complexity requires hybrid System 1/System 2 coordination');
      routingJustification.push('Initial processing via Supabase, complex analysis via Graphiti');
    } else {
      systemRecommendation = 'SYSTEM_2';
      mcpServerTarget = 'graphiti';
      episodicMemoryRequired = true;
      routingJustification.push('High complexity requires deliberative System 2 processing');
      routingJustification.push('Episodic memory storage and temporal knowledge graphs via Graphiti MCP');
      
      if (hasTemporalContext) {
        routingJustification.push('Temporal context detected - enhanced memory capabilities required');
      }
    }

    // Create base complexity assessment
    const baseAssessment: TaskComplexityAssessment = {
      level,
      metrics: {
        descriptionLength,
        dependenciesCount,
        notesLength,
        hasNotes,
      },
      recommendations: routingJustification,
    };

    // Return enhanced cognitive routing assessment
    return {
      ...baseAssessment,
      systemRecommendation,
      mcpServerTarget,
      routingJustification,
      episodicMemoryRequired,
      temporalContextRequired: hasTemporalContext,
      complexityScore,
    };
  }

  /**
   * Route task to appropriate system based on assessment
   * @param assessment Cognitive routing assessment
   * @returns Target system type
   */
  public routeToSystem(assessment: CognitiveRoutingAssessment): 'supabase' | 'graphiti' | 'hybrid' {
    return assessment.mcpServerTarget;
  }

  /**
   * Execute operation via appropriate MCP server
   * @param systemType Target system type
   * @param operation MCP operation to execute
   * @returns Promise with operation result
   */
  public async executeViaMCP(systemType: string, operation: MCPOperation): Promise<MCPResult> {
    const startTime = Date.now();
    
    try {
      // Note: Actual MCP integration will be implemented in Task 3 (MCP Integration Layer)
      // This is a placeholder implementation for the core routing logic
      
      let result: any;
      
      if (systemType === 'supabase' || operation.type === 'supabase') {
        // Route to Supabase MCP (System 1)
        result = await this.executeSupabaseOperation(operation);
      } else if (systemType === 'graphiti' || operation.type === 'graphiti') {
        // Route to Graphiti MCP (System 2)
        result = await this.executeGraphitiOperation(operation);
      } else if (systemType === 'hybrid') {
        // Coordinate both systems
        result = await this.executeHybridOperation(operation);
      } else {
        throw new Error(`Unknown system type: ${systemType}`);
      }

      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        data: result,
        responseTime,
        serverType: operation.type,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        serverType: operation.type,
      };
    }
  }

  /**
   * Execute operation via Supabase MCP (System 1)
   * @param operation MCP operation
   * @returns Operation result
   */
  private async executeSupabaseOperation(operation: MCPOperation): Promise<any> {
    // Placeholder for Supabase MCP integration
    // Will be implemented in Task 3: MCP Integration Layer
    return {
      system: 'supabase',
      operation: operation.operation,
      parameters: operation.parameters,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute operation via Graphiti MCP (System 2)
   * @param operation MCP operation
   * @returns Operation result
   */
  private async executeGraphitiOperation(operation: MCPOperation): Promise<any> {
    // Placeholder for Graphiti MCP integration
    // Will be implemented in Task 3: MCP Integration Layer
    return {
      system: 'graphiti',
      operation: operation.operation,
      parameters: operation.parameters,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute hybrid operation coordinating both systems
   * @param operation MCP operation
   * @returns Combined operation result
   */
  private async executeHybridOperation(operation: MCPOperation): Promise<any> {
    // Placeholder for hybrid coordination
    // Will be implemented in Task 3: MCP Integration Layer
    const supabaseResult = await this.executeSupabaseOperation(operation);
    const graphitiResult = await this.executeGraphitiOperation(operation);
    
    return {
      system: 'hybrid',
      supabaseResult,
      graphitiResult,
      operation: operation.operation,
      parameters: operation.parameters,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get routing statistics for performance monitoring
   * @returns Routing statistics object
   */
  public getRoutingStatistics(): Record<string, any> {
    // Placeholder for routing statistics
    // Will be enhanced in Task 6: Performance Monitoring
    return {
      totalRoutingDecisions: 0,
      system1Decisions: 0,
      system2Decisions: 0,
      hybridDecisions: 0,
      averageComplexityScore: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Export default instance for convenience
export const cognitiveRouter = new CognitiveRouter();