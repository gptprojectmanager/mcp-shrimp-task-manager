import {
  Task,
  TaskComplexityLevel,
  TaskComplexityThresholds,
  TaskComplexityAssessment,
  CognitiveRoutingAssessment,
  MCPOperation,
  MCPResult,
} from '../types/index.js';
import { MCPIntegrationLayer } from './mcpIntegration.js';
import { RoutingPerformanceMonitor, routingPerformanceMonitor } from './routingMetrics.js';

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
  private readonly mcpIntegration: MCPIntegrationLayer;
  private readonly performanceMonitor: RoutingPerformanceMonitor;

  constructor(mcpIntegration?: MCPIntegrationLayer, performanceMonitor?: RoutingPerformanceMonitor) {
    this.mcpIntegration = mcpIntegration || new MCPIntegrationLayer();
    this.performanceMonitor = performanceMonitor || routingPerformanceMonitor;
  }

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
   * Execute operation via appropriate MCP server using integrated MCP layer
   * @param systemType Target system type
   * @param operation MCP operation to execute
   * @param taskId Optional task ID for performance tracking
   * @param taskName Optional task name for performance tracking
   * @param assessment Optional assessment for performance tracking
   * @returns Promise with operation result
   */
  public async executeViaMCP(
    systemType: string, 
    operation: MCPOperation, 
    taskId?: string, 
    taskName?: string,
    assessment?: CognitiveRoutingAssessment
  ): Promise<MCPResult> {
    const startTime = Date.now();
    let result: MCPResult;

    try {
      if (systemType === 'supabase' || operation.type === 'supabase') {
        // Route to Supabase MCP (System 1) via integration layer
        const supabaseParams = {
          table_name: operation.parameters.table_name || 'tasks',
          ...operation.parameters,
        };
        result = await this.mcpIntegration.callSupabaseMCP({
          type: operation.operation as any,
          parameters: supabaseParams,
        });
      } else if (systemType === 'graphiti' || operation.type === 'graphiti') {
        // Route to Graphiti MCP (System 2) via integration layer
        result = await this.mcpIntegration.callGraphitiMCP({
          type: operation.operation as any,
          parameters: operation.parameters,
        });
      } else if (systemType === 'hybrid') {
        // Coordinate both systems via integration layer
        result = await this.mcpIntegration.executeHybridOperation({
          type: 'coordinated_analysis',
          supabaseOperation: {
            type: 'read_table_rows',
            parameters: { table_name: 'tasks' },
          },
          graphitiOperation: {
            type: 'search_memory_nodes',
            parameters: { query: operation.parameters.query || 'task analysis' },
          },
          coordination: {
            sequence: 'supabase_first',
            dataFlow: 'supabase_to_graphiti',
            resultCombination: 'merge',
          },
        });
      } else {
        throw new Error(`Unknown system type: ${systemType}`);
      }
    } catch (error) {
      result = {
        success: false,
        error: error instanceof Error ? error.message : 'Cognitive routing failed',
        responseTime: Date.now() - startTime,
        serverType: operation.type,
        metadata: {
          routingDecision: `Failed to route to ${systemType}`,
        },
      };
    }

    // Record performance metrics if tracking data is available
    if (taskId && taskName && assessment) {
      this.performanceMonitor.recordRoutingDecision(taskId, taskName, assessment, result);
    }

    return result;
  }

  /**
   * Execute operation with cognitive routing assessment
   * @param assessment Cognitive routing assessment
   * @param operation MCP operation to execute
   * @returns Promise with routed operation result
   */
  public async executeWithCognitiveRouting(
    assessment: CognitiveRoutingAssessment,
    operation: MCPOperation
  ): Promise<MCPResult> {
    return await this.mcpIntegration.routeOperation(assessment, operation);
  }

  /**
   * Get MCP integration layer performance statistics
   * @returns Performance statistics from MCP integration layer
   */
  public getMCPPerformanceStatistics(): Record<string, any> {
    return this.mcpIntegration.getPerformanceStatistics();
  }

  /**
   * Check MCP server connection status
   * @returns Promise with connection status for both servers
   */
  public async checkMCPConnectionStatus(): Promise<{
    supabase: { connected: boolean; responseTime?: number };
    graphiti: { connected: boolean; responseTime?: number };
  }> {
    return await this.mcpIntegration.checkConnectionStatus();
  }

  /**
   * Get routing statistics for performance monitoring
   * @returns Routing statistics object
   */
  public getRoutingStatistics(): Record<string, any> {
    return this.performanceMonitor.getPerformanceSummary();
  }

  /**
   * Generate comprehensive performance report
   * @returns Complete routing performance metrics
   */
  public generatePerformanceReport() {
    return this.performanceMonitor.generatePerformanceReport();
  }

  /**
   * Optimize routing thresholds based on performance data
   * @returns Optimization recommendations
   */
  public optimizeThresholds() {
    return this.performanceMonitor.optimizeRoutingThresholds();
  }

  /**
   * Get recent decision history for analysis
   * @param limit Number of recent decisions to return
   * @returns Array of routing decision records
   */
  public getDecisionHistory(limit: number = 50) {
    return this.performanceMonitor.getDecisionHistory(limit);
  }

  /**
   * Log performance metrics to Supabase
   * @returns Promise with logging result
   */
  public async logPerformanceMetrics() {
    const metrics = this.performanceMonitor.generatePerformanceReport();
    return await this.performanceMonitor.logToSupabase(metrics);
  }
}

// Export default instance for convenience
export const cognitiveRouter = new CognitiveRouter();