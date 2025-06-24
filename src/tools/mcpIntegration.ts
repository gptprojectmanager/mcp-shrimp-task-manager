import {
  MCPOperation,
  MCPResult,
  CognitiveRoutingAssessment,
  Task,
} from '../types/index.js';

// 操作重試配置：定義 MCP 操作的重試策略
interface RetryConfiguration {
  maxRetries: number; // 最大重試次數
  baseDelay: number; // 基礎延遲時間 (毫秒)
  backoffMultiplier: number; // 退避乘數
  maxDelay: number; // 最大延遲時間 (毫秒)
}

// 預設重試配置
const DEFAULT_RETRY_CONFIG: RetryConfiguration = {
  maxRetries: 3,
  baseDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
};

// Supabase 操作介面：定義 System 1 (高吞吐量) 操作類型
export interface SupabaseOperation {
  type: 'read_table_rows' | 'create_table_records' | 'update_table_records' | 'delete_table_records';
  parameters: {
    table_name: string;
    columns?: string;
    filters?: Record<string, any>;
    limit?: number;
    order_by?: string;
    ascending?: boolean;
    records?: any | any[];
    updates?: Record<string, any>;
  };
  metadata?: {
    cacheKey?: string;
    priority?: 'low' | 'medium' | 'high';
    timeout?: number;
  };
}

// Graphiti 操作介面：定義 System 2 (情節記憶) 操作類型
export interface GraphitiOperation {
  type: 'add_memory' | 'search_memory_nodes' | 'search_memory_facts' | 'get_episodes' | 'clear_graph';
  parameters: {
    // add_memory 參數
    name?: string;
    episode_body?: string;
    group_id?: string;
    source?: string;
    source_description?: string;
    uuid?: string;
    // search 參數
    query?: string;
    max_nodes?: number;
    max_facts?: number;
    center_node_uuid?: string;
    group_ids?: string[];
    entity?: string;
    // get_episodes 參數
    last_n?: number;
  };
  metadata?: {
    complexity?: 'high' | 'very_high';
    requiresEpisodicMemory?: boolean;
    temporalContext?: boolean;
  };
}

// 混合操作介面：定義需要協調兩個 MCP 服務器的複雜操作
export interface HybridOperation {
  type: 'coordinated_analysis' | 'data_with_memory' | 'cached_reasoning';
  supabaseOperation: SupabaseOperation;
  graphitiOperation: GraphitiOperation;
  coordination: {
    sequence: 'supabase_first' | 'graphiti_first' | 'parallel';
    dataFlow: 'supabase_to_graphiti' | 'graphiti_to_supabase' | 'independent';
    resultCombination: 'merge' | 'prioritize_supabase' | 'prioritize_graphiti';
  };
}

// MCP 連接配置
interface MCPConnectionConfig {
  supabase: {
    enabled: boolean;
    endpoint: string;
    timeout: number;
  };
  graphiti: {
    enabled: boolean;
    endpoint: string;
    timeout: number;
  };
}

// 預設 MCP 連接配置 (基於 .claude.json)
const DEFAULT_MCP_CONFIG: MCPConnectionConfig = {
  supabase: {
    enabled: true,
    endpoint: 'http://localhost:8000',
    timeout: 30000,
  },
  graphiti: {
    enabled: true,
    endpoint: 'http://localhost:8010/sse',
    timeout: 45000,
  },
};

/**
 * MCPIntegrationLayer: 統一的 MCP 集成層
 * 提供 Supabase MCP (System 1) 和 Graphiti MCP (System 2) 的統一介面
 * 包含錯誤處理、重試邏輯和性能監控
 */
export class MCPIntegrationLayer {
  private config: MCPConnectionConfig;
  private retryConfig: RetryConfiguration;
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor(
    config: Partial<MCPConnectionConfig> = {},
    retryConfig: Partial<RetryConfiguration> = {}
  ) {
    this.config = { ...DEFAULT_MCP_CONFIG, ...config };
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * 調用 Supabase MCP 進行 System 1 操作 (高吞吐量、快速處理)
   * @param operation Supabase 操作定義
   * @returns Promise 包含操作結果
   */
  public async callSupabaseMCP(operation: SupabaseOperation): Promise<MCPResult> {
    const startTime = Date.now();
    const operationId = `supabase_${operation.type}_${Date.now()}`;

    try {
      if (!this.config.supabase.enabled) {
        throw new Error('Supabase MCP is disabled in configuration');
      }

      let result: any;

      // 根據操作類型調用相應的 MCP 工具
      switch (operation.type) {
        case 'read_table_rows':
          // 使用 mcp__supabase__read_table_rows
          result = await this.executeWithRetry(() => 
            this.callMCPTool('mcp__supabase__read_table_rows', {
              table_name: operation.parameters.table_name,
              columns: operation.parameters.columns,
              filters: operation.parameters.filters,
              limit: operation.parameters.limit,
              order_by: operation.parameters.order_by,
              ascending: operation.parameters.ascending,
            })
          );
          break;

        case 'create_table_records':
          // 使用 mcp__supabase__create_table_records
          result = await this.executeWithRetry(() =>
            this.callMCPTool('mcp__supabase__create_table_records', {
              table_name: operation.parameters.table_name,
              records: operation.parameters.records,
            })
          );
          break;

        case 'update_table_records':
          // 使用 mcp__supabase__update_table_records
          result = await this.executeWithRetry(() =>
            this.callMCPTool('mcp__supabase__update_table_records', {
              table_name: operation.parameters.table_name,
              updates: operation.parameters.updates,
              filters: operation.parameters.filters,
            })
          );
          break;

        case 'delete_table_records':
          // 使用 mcp__supabase__delete_table_records
          result = await this.executeWithRetry(() =>
            this.callMCPTool('mcp__supabase__delete_table_records', {
              table_name: operation.parameters.table_name,
              filters: operation.parameters.filters,
            })
          );
          break;

        default:
          throw new Error(`Unsupported Supabase operation: ${operation.type}`);
      }

      const responseTime = Date.now() - startTime;
      this.recordPerformanceMetric(`supabase_${operation.type}`, responseTime);

      return {
        success: true,
        data: result,
        responseTime,
        serverType: 'supabase',
        metadata: {
          operationId,
          cacheHit: false,
          routingDecision: 'System 1 (Supabase) - High-throughput processing',
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordPerformanceMetric(`supabase_${operation.type}_error`, responseTime);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Supabase MCP error',
        responseTime,
        serverType: 'supabase',
        metadata: {
          operationId,
          routingDecision: 'System 1 (Supabase) - Operation failed',
        },
      };
    }
  }

  /**
   * 調用 Graphiti MCP 進行 System 2 操作 (情節記憶、複雜推理)
   * @param operation Graphiti 操作定義
   * @returns Promise 包含操作結果
   */
  public async callGraphitiMCP(operation: GraphitiOperation): Promise<MCPResult> {
    const startTime = Date.now();
    const operationId = `graphiti_${operation.type}_${Date.now()}`;

    try {
      if (!this.config.graphiti.enabled) {
        throw new Error('Graphiti MCP is disabled in configuration');
      }

      let result: any;

      // 根據操作類型調用相應的 MCP 工具
      switch (operation.type) {
        case 'add_memory':
          // 使用 mcp__graphiti-memory__add_memory
          result = await this.executeWithRetry(() =>
            this.callMCPTool('mcp__graphiti-memory__add_memory', {
              name: operation.parameters.name!,
              episode_body: operation.parameters.episode_body!,
              group_id: operation.parameters.group_id,
              source: operation.parameters.source,
              source_description: operation.parameters.source_description,
              uuid: operation.parameters.uuid,
            })
          );
          break;

        case 'search_memory_nodes':
          // 使用 mcp__graphiti-memory__search_memory_nodes
          result = await this.executeWithRetry(() =>
            this.callMCPTool('mcp__graphiti-memory__search_memory_nodes', {
              query: operation.parameters.query!,
              max_nodes: operation.parameters.max_nodes,
              center_node_uuid: operation.parameters.center_node_uuid,
              group_ids: operation.parameters.group_ids,
              entity: operation.parameters.entity,
            })
          );
          break;

        case 'search_memory_facts':
          // 使用 mcp__graphiti-memory__search_memory_facts
          result = await this.executeWithRetry(() =>
            this.callMCPTool('mcp__graphiti-memory__search_memory_facts', {
              query: operation.parameters.query!,
              max_facts: operation.parameters.max_facts,
              center_node_uuid: operation.parameters.center_node_uuid,
              group_ids: operation.parameters.group_ids,
            })
          );
          break;

        case 'get_episodes':
          // 使用 mcp__graphiti-memory__get_episodes
          result = await this.executeWithRetry(() =>
            this.callMCPTool('mcp__graphiti-memory__get_episodes', {
              group_id: operation.parameters.group_id,
              last_n: operation.parameters.last_n,
            })
          );
          break;

        case 'clear_graph':
          // 使用 mcp__graphiti-memory__clear_graph
          result = await this.executeWithRetry(() =>
            this.callMCPTool('mcp__graphiti-memory__clear_graph', {})
          );
          break;

        default:
          throw new Error(`Unsupported Graphiti operation: ${operation.type}`);
      }

      const responseTime = Date.now() - startTime;
      this.recordPerformanceMetric(`graphiti_${operation.type}`, responseTime);

      return {
        success: true,
        data: result,
        responseTime,
        serverType: 'graphiti',
        metadata: {
          operationId,
          cacheHit: false,
          routingDecision: 'System 2 (Graphiti) - Episodic memory processing',
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordPerformanceMetric(`graphiti_${operation.type}_error`, responseTime);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Graphiti MCP error',
        responseTime,
        serverType: 'graphiti',
        metadata: {
          operationId,
          routingDecision: 'System 2 (Graphiti) - Operation failed',
        },
      };
    }
  }

  /**
   * 執行混合操作，協調 Supabase 和 Graphiti MCP 服務器
   * @param operation 混合操作定義
   * @returns Promise 包含組合操作結果
   */
  public async executeHybridOperation(operation: HybridOperation): Promise<MCPResult> {
    const startTime = Date.now();
    const operationId = `hybrid_${operation.type}_${Date.now()}`;

    try {
      let supabaseResult: MCPResult;
      let graphitiResult: MCPResult;

      // 根據協調配置執行操作
      switch (operation.coordination.sequence) {
        case 'supabase_first':
          supabaseResult = await this.callSupabaseMCP(operation.supabaseOperation);
          // 根據 Supabase 結果調整 Graphiti 操作 (如果配置了數據流)
          if (operation.coordination.dataFlow === 'supabase_to_graphiti' && supabaseResult.success) {
            operation.graphitiOperation.parameters.episode_body = 
              JSON.stringify(supabaseResult.data);
          }
          graphitiResult = await this.callGraphitiMCP(operation.graphitiOperation);
          break;

        case 'graphiti_first':
          graphitiResult = await this.callGraphitiMCP(operation.graphitiOperation);
          // 根據 Graphiti 結果調整 Supabase 操作
          if (operation.coordination.dataFlow === 'graphiti_to_supabase' && graphitiResult.success) {
            // 處理 Graphiti 到 Supabase 的數據流
          }
          supabaseResult = await this.callSupabaseMCP(operation.supabaseOperation);
          break;

        case 'parallel':
          // 並行執行兩個操作
          [supabaseResult, graphitiResult] = await Promise.all([
            this.callSupabaseMCP(operation.supabaseOperation),
            this.callGraphitiMCP(operation.graphitiOperation),
          ]);
          break;
      }

      // 組合結果
      const combinedData = this.combineResults(
        supabaseResult,
        graphitiResult,
        operation.coordination.resultCombination
      );

      const responseTime = Date.now() - startTime;
      this.recordPerformanceMetric(`hybrid_${operation.type}`, responseTime);

      return {
        success: supabaseResult.success && graphitiResult.success,
        data: combinedData,
        responseTime,
        serverType: 'graphiti', // 混合操作歸類為 System 2
        metadata: {
          operationId,
          cacheHit: false,
          routingDecision: `Hybrid System 1/System 2 coordination - Supabase: ${supabaseResult.success}, Graphiti: ${graphitiResult.success}`,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordPerformanceMetric(`hybrid_${operation.type}_error`, responseTime);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown hybrid operation error',
        responseTime,
        serverType: 'graphiti',
        metadata: {
          operationId,
          routingDecision: 'Hybrid operation failed',
        },
      };
    }
  }

  /**
   * 基於認知路由評估智能路由操作
   * @param assessment 認知路由評估
   * @param operation 基礎 MCP 操作
   * @returns Promise 包含路由操作結果
   */
  public async routeOperation(
    assessment: CognitiveRoutingAssessment,
    operation: MCPOperation
  ): Promise<MCPResult> {
    const startTime = Date.now();

    try {
      switch (assessment.mcpServerTarget) {
        case 'supabase':
          // System 1: 快速、高吞吐量操作
          const supabaseParams = {
            table_name: operation.parameters.table_name || 'tasks',
            ...operation.parameters,
          };
          const supabaseOp: SupabaseOperation = {
            type: operation.operation as any,
            parameters: supabaseParams,
            metadata: {
              priority: assessment.complexityScore < 15 ? 'high' : 'medium',
            },
          };
          return await this.callSupabaseMCP(supabaseOp);

        case 'graphiti':
          // System 2: 複雜推理、情節記憶
          const graphitiOp: GraphitiOperation = {
            type: operation.operation as any,
            parameters: operation.parameters,
            metadata: {
              complexity: assessment.complexityScore > 75 ? 'very_high' : 'high',
              requiresEpisodicMemory: assessment.episodicMemoryRequired,
              temporalContext: assessment.temporalContextRequired,
            },
          };
          return await this.callGraphitiMCP(graphitiOp);

        case 'hybrid':
          // 混合模式: 協調兩個系統
          // 創建基本的混合操作 (需要根據具體需求調整)
          const hybridOp: HybridOperation = {
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
          };
          return await this.executeHybridOperation(hybridOp);

        default:
          throw new Error(`Unknown MCP server target: ${assessment.mcpServerTarget}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Routing operation failed',
        responseTime,
        serverType: assessment.mcpServerTarget as any,
        metadata: {
          routingDecision: `Failed to route to ${assessment.mcpServerTarget}`,
        },
      };
    }
  }

  /**
   * 模擬 MCP 工具調用 (實際實現需要集成真實的 MCP 客戶端)
   * @param toolName MCP 工具名稱
   * @param parameters 工具參數
   * @returns Promise 包含工具結果
   */
  private async callMCPTool(toolName: string, parameters: any): Promise<any> {
    // 注意：這是一個模擬實現
    // 在實際部署中，需要使用真實的 MCP 客戶端來調用工具
    // 例如使用 @modelcontextprotocol/sdk
    
    // 模擬 API 延遲
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

    // 模擬不同工具的響應
    if (toolName.includes('supabase')) {
      return {
        tool: toolName,
        parameters,
        result: 'Supabase operation completed',
        timestamp: new Date().toISOString(),
      };
    } else if (toolName.includes('graphiti')) {
      return {
        tool: toolName,
        parameters,
        result: 'Graphiti operation completed',
        timestamp: new Date().toISOString(),
      };
    }

    throw new Error(`Unknown MCP tool: ${toolName}`);
  }

  /**
   * 使用重試邏輯執行操作
   * @param operation 要執行的操作函數
   * @returns Promise 包含操作結果
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === this.retryConfig.maxRetries) {
          break;
        }

        // 計算延遲時間 (指數退避)
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
          this.retryConfig.maxDelay
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * 組合兩個 MCP 結果
   * @param supabaseResult Supabase 操作結果
   * @param graphitiResult Graphiti 操作結果
   * @param combination 組合策略
   * @returns 組合後的數據
   */
  private combineResults(
    supabaseResult: MCPResult,
    graphitiResult: MCPResult,
    combination: 'merge' | 'prioritize_supabase' | 'prioritize_graphiti'
  ): any {
    switch (combination) {
      case 'merge':
        return {
          supabase: supabaseResult.data,
          graphiti: graphitiResult.data,
          combined: true,
        };

      case 'prioritize_supabase':
        return supabaseResult.success ? supabaseResult.data : graphitiResult.data;

      case 'prioritize_graphiti':
        return graphitiResult.success ? graphitiResult.data : supabaseResult.data;

      default:
        return { supabase: supabaseResult.data, graphiti: graphitiResult.data };
    }
  }

  /**
   * 記錄性能指標
   * @param operation 操作名稱
   * @param responseTime 響應時間
   */
  private recordPerformanceMetric(operation: string, responseTime: number): void {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }

    const metrics = this.performanceMetrics.get(operation)!;
    metrics.push(responseTime);

    // 保持最近 100 個記錄
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * 獲取性能統計
   * @returns 性能指標統計
   */
  public getPerformanceStatistics(): Record<string, any> {
    const stats: Record<string, any> = {};

    this.performanceMetrics.forEach((times, operation) => {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      stats[operation] = {
        averageResponseTime: Math.round(avgTime),
        minResponseTime: minTime,
        maxResponseTime: maxTime,
        totalCalls: times.length,
        lastUpdated: new Date().toISOString(),
      };
    });

    return stats;
  }

  /**
   * 檢查 MCP 服務器連接狀態
   * @returns Promise 包含連接狀態
   */
  public async checkConnectionStatus(): Promise<{
    supabase: { connected: boolean; responseTime?: number };
    graphiti: { connected: boolean; responseTime?: number };
  }> {
    const results = {
      supabase: { connected: false, responseTime: undefined as number | undefined },
      graphiti: { connected: false, responseTime: undefined as number | undefined },
    };

    // 測試 Supabase 連接
    try {
      const supabaseStart = Date.now();
      await this.callSupabaseMCP({
        type: 'read_table_rows',
        parameters: { table_name: 'connection_test', limit: 1 },
      });
      results.supabase.connected = true;
      results.supabase.responseTime = Date.now() - supabaseStart;
    } catch (error) {
      // 連接失敗，保持 connected: false
    }

    // 測試 Graphiti 連接
    try {
      const graphitiStart = Date.now();
      await this.callGraphitiMCP({
        type: 'search_memory_nodes',
        parameters: { query: 'connection_test', max_nodes: 1 },
      });
      results.graphiti.connected = true;
      results.graphiti.responseTime = Date.now() - graphitiStart;
    } catch (error) {
      // 連接失敗，保持 connected: false
    }

    return results;
  }
}

// 導出預設實例以便於使用
export const mcpIntegration = new MCPIntegrationLayer();