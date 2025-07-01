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
 * RACE Framework Interfaces - Based on DeepResearch Bench (arxiv:2506.11763)
 * Multi-dimensional cognitive complexity assessment
 */
interface RACEAssessment {
  comprehensiveness: number;      // Coverage breadth and depth (0-10)
  insightDepth: number;          // Analysis complexity required (0-10)
  instructionComplexity: number; // Task requirement complexity (0-10)
  readabilityRequirement: number; // Output organization needs (0-10)
  totalScore: number;            // Weighted total (0-40)
  weights: RACEWeights;          // Dynamic weights used
}

interface RACEWeights {
  comprehensiveness: number;     // Weight for comprehensiveness dimension
  depth: number;                // Weight for depth dimension
  instruction: number;          // Weight for instruction complexity
  readability: number;          // Weight for readability requirements
}

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
    
    // RACE Framework: Multi-dimensional cognitive assessment (40% weight)
    // Replaces hardcoded character counting with academic research-based evaluation
    const raceAssessment = this.calculateRACEComplexity(task);
    complexityScore += raceAssessment.totalScore;

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

    // Temporal context indicators (15% weight) - Enhanced detection
    const temporalKeywords = ['temporal', 'time', 'sequence', 'history', 'memory', 'context', 'knowledge', 'episodic', 'sophisticated', 'coordination', 'architecture', 'integration'];
    const complexityKeywords = ['complex', 'multiple', 'extensive', 'sophisticated', 'advanced', 'comprehensive'];
    
    const temporalMatches = temporalKeywords.filter(keyword => 
      task.description.toLowerCase().includes(keyword) || 
      (task.notes && task.notes.toLowerCase().includes(keyword))
    ).length;
    
    const complexityMatches = complexityKeywords.filter(keyword =>
      task.description.toLowerCase().includes(keyword) || 
      (task.notes && task.notes.toLowerCase().includes(keyword))
    ).length;
    
    // Boost score for temporal/complexity keywords
    if (temporalMatches > 0) {
      complexityScore += Math.min(15, temporalMatches * 5);
    }
    if (complexityMatches > 0) {
      complexityScore += Math.min(10, complexityMatches * 3);
    }
    
    const hasTemporalContext = temporalMatches > 0;

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

  /**
   * RACE Framework Implementation: Multi-dimensional cognitive complexity assessment
   * Based on academic research (arxiv:2506.11763) - DeepResearch Bench methodology
   * Replaces hardcoded character counting with research-validated assessment
   */
  private calculateRACEComplexity(task: Task): RACEAssessment {
    // 1. Comprehensiveness: Coverage breadth and depth required
    const comprehensiveness = this.assessComprehensiveness(task);
    
    // 2. Insight/Depth: Analysis complexity and cognitive load required
    const insightDepth = this.assessRequiredDepth(task);
    
    // 3. Instruction-Following: Task requirement complexity
    const instructionComplexity = this.assessInstructionComplexity(task);
    
    // 4. Readability: Output organization and presentation requirements
    const readabilityRequirement = this.assessReadabilityRequirements(task);

    // Dynamic weighting based on task characteristics
    const weights = this.calculateDynamicWeights(task);
    
    const totalScore = Math.min(40, // Cap at 40 points (40% of total complexity score)
      (comprehensiveness * weights.comprehensiveness +
       insightDepth * weights.depth +
       instructionComplexity * weights.instruction +
       readabilityRequirement * weights.readability)
    );

    return {
      comprehensiveness,
      insightDepth,
      instructionComplexity,
      readabilityRequirement,
      totalScore,
      weights
    };
  }

  /**
   * Assess comprehensiveness requirements based on task scope and breadth
   */
  private assessComprehensiveness(task: Task): number {
    let score = 0;
    const description = task.description.toLowerCase();
    const notes = task.notes?.toLowerCase() || '';
    
    // Scope indicators
    const scopeKeywords = ['comprehensive', 'complete', 'extensive', 'thorough', 'all', 'entire', 'full'];
    const scopeMatches = scopeKeywords.filter(keyword => 
      description.includes(keyword) || notes.includes(keyword)
    ).length;
    
    // Multi-domain indicators
    const domainKeywords = ['multiple', 'various', 'different', 'several', 'many'];
    const domainMatches = domainKeywords.filter(keyword => 
      description.includes(keyword) || notes.includes(keyword)
    ).length;
    
    // Base score from task structure
    score += Math.min(5, task.dependencies.length * 0.5); // Dependencies indicate broader scope
    score += Math.min(5, scopeMatches * 2); // Explicit scope requirements
    score += Math.min(3, domainMatches * 1.5); // Multi-domain complexity
    
    return Math.min(10, score);
  }

  /**
   * Assess depth and insight requirements based on cognitive complexity
   */
  private assessRequiredDepth(task: Task): number {
    let score = 0;
    const description = task.description.toLowerCase();
    const notes = task.notes?.toLowerCase() || '';
    
    // Analytical depth indicators
    const depthKeywords = ['analyze', 'evaluate', 'assess', 'investigate', 'research', 'deep', 'sophisticated'];
    const depthMatches = depthKeywords.filter(keyword => 
      description.includes(keyword) || notes.includes(keyword)
    ).length;
    
    // Technical complexity indicators
    const technicalKeywords = ['algorithm', 'architecture', 'framework', 'system', 'integration', 'optimization'];
    const technicalMatches = technicalKeywords.filter(keyword => 
      description.includes(keyword) || notes.includes(keyword)
    ).length;
    
    // Reasoning complexity indicators
    const reasoningKeywords = ['why', 'how', 'cause', 'effect', 'impact', 'consequence', 'reasoning'];
    const reasoningMatches = reasoningKeywords.filter(keyword => 
      description.includes(keyword) || notes.includes(keyword)
    ).length;
    
    score += Math.min(4, depthMatches * 1.5);
    score += Math.min(3, technicalMatches * 1);
    score += Math.min(3, reasoningMatches * 1);
    
    return Math.min(10, score);
  }

  /**
   * Assess instruction-following complexity based on task requirements
   */
  private assessInstructionComplexity(task: Task): number {
    let score = 0;
    const description = task.description.toLowerCase();
    const notes = task.notes?.toLowerCase() || '';
    
    // Multi-step indicators
    const stepKeywords = ['step', 'phase', 'stage', 'then', 'next', 'after', 'sequence'];
    const stepMatches = stepKeywords.filter(keyword => 
      description.includes(keyword) || notes.includes(keyword)
    ).length;
    
    // Constraint indicators
    const constraintKeywords = ['must', 'should', 'require', 'ensure', 'verify', 'validate', 'check'];
    const constraintMatches = constraintKeywords.filter(keyword => 
      description.includes(keyword) || notes.includes(keyword)
    ).length;
    
    // Format/output requirements
    const formatKeywords = ['format', 'structure', 'organize', 'document', 'report', 'output'];
    const formatMatches = formatKeywords.filter(keyword => 
      description.includes(keyword) || notes.includes(keyword)
    ).length;
    
    score += Math.min(4, stepMatches * 1);
    score += Math.min(3, constraintMatches * 0.5);
    score += Math.min(3, formatMatches * 1);
    
    return Math.min(10, score);
  }

  /**
   * Assess readability and presentation requirements
   */
  private assessReadabilityRequirements(task: Task): number {
    let score = 0;
    const description = task.description.toLowerCase();
    const notes = task.notes?.toLowerCase() || '';
    
    // Presentation indicators
    const presentationKeywords = ['clear', 'readable', 'organized', 'structured', 'formatted', 'presentation'];
    const presentationMatches = presentationKeywords.filter(keyword => 
      description.includes(keyword) || notes.includes(keyword)
    ).length;
    
    // Documentation indicators
    const docKeywords = ['document', 'explain', 'describe', 'summary', 'report', 'guide'];
    const docMatches = docKeywords.filter(keyword => 
      description.includes(keyword) || notes.includes(keyword)
    ).length;
    
    // Base score from task complexity (more complex tasks need better organization)
    const baseComplexity = Math.min(3, (task.description.length / 200) + task.dependencies.length * 0.5);
    
    score += Math.min(3, presentationMatches * 1.5);
    score += Math.min(4, docMatches * 1);
    score += Math.min(3, baseComplexity);
    
    return Math.min(10, score);
  }

  /**
   * Calculate dynamic weights based on task characteristics
   */
  private calculateDynamicWeights(task: Task): RACEWeights {
    const description = task.description.toLowerCase();
    const notes = task.notes?.toLowerCase() || '';
    
    // Default weights
    let weights = {
      comprehensiveness: 0.3,
      depth: 0.3,
      instruction: 0.25,
      readability: 0.15
    };
    
    // Adjust based on task type indicators
    if (description.includes('research') || description.includes('investigate')) {
      weights.comprehensiveness += 0.1;
      weights.depth += 0.1;
      weights.instruction -= 0.1;
      weights.readability -= 0.1;
    }
    
    if (description.includes('implement') || description.includes('code') || description.includes('develop')) {
      weights.instruction += 0.15;
      weights.depth += 0.05;
      weights.comprehensiveness -= 0.1;
      weights.readability -= 0.1;
    }
    
    if (description.includes('document') || description.includes('explain') || description.includes('guide')) {
      weights.readability += 0.2;
      weights.instruction += 0.05;
      weights.comprehensiveness -= 0.1;
      weights.depth -= 0.15;
    }
    
    return weights;
  }
}

// Export default instance for convenience
export const cognitiveRouter = new CognitiveRouter();