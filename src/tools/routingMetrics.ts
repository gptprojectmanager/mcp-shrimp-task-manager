import {
  TaskComplexityLevel,
  TaskComplexityThresholds,
  CognitiveRoutingAssessment,
  MCPResult,
} from '../types/index.js';

// 路由性能指標接口
export interface RoutingMetrics {
  system1_calls: number;
  system2_calls: number;
  hybrid_calls: number;
  average_response_time: Map<string, number>;
  accuracy_metrics: {
    correct_routing_decisions: number;
    total_routing_decisions: number;
    system1_success_rate: number;
    system2_success_rate: number;
    hybrid_success_rate: number;
  };
  timestamp: Date;
  performance_trends: {
    daily_routing_counts: Map<string, { system1: number; system2: number; hybrid: number }>;
    response_time_trends: Map<string, number[]>;
    error_rates: Map<string, number>;
  };
  optimization_recommendations: string[];
}

// 路由決策記錄
export interface RoutingDecisionRecord {
  taskId: string;
  taskName: string;
  complexityScore: number;
  systemRecommendation: 'SYSTEM_1' | 'SYSTEM_2' | 'HYBRID';
  mcpServerTarget: 'supabase' | 'graphiti' | 'hybrid';
  responseTime: number;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
  actualComplexity?: TaskComplexityLevel; // 事後評估的實際複雜度
}

// 性能優化建議
export interface OptimizationRecommendation {
  type: 'THRESHOLD_ADJUSTMENT' | 'PERFORMANCE_IMPROVEMENT' | 'ERROR_REDUCTION' | 'CAPACITY_SCALING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  suggestedAction: string;
  expectedImpact: string;
  metrics: Record<string, number>;
}

/**
 * RoutingPerformanceMonitor: 認知路由性能監控系統
 * 追蹤 System 1/System 2 架構的路由效果、響應時間和系統準確性
 */
export class RoutingPerformanceMonitor {
  private metrics: RoutingMetrics;
  private decisionHistory: RoutingDecisionRecord[] = [];
  private maxHistorySize = 10000; // 保持最近 10000 個決策記錄

  constructor() {
    this.metrics = this.initializeMetrics();
  }

  /**
   * 初始化性能指標
   */
  private initializeMetrics(): RoutingMetrics {
    return {
      system1_calls: 0,
      system2_calls: 0,
      hybrid_calls: 0,
      average_response_time: new Map(),
      accuracy_metrics: {
        correct_routing_decisions: 0,
        total_routing_decisions: 0,
        system1_success_rate: 0,
        system2_success_rate: 0,
        hybrid_success_rate: 0,
      },
      timestamp: new Date(),
      performance_trends: {
        daily_routing_counts: new Map(),
        response_time_trends: new Map(),
        error_rates: new Map(),
      },
      optimization_recommendations: [],
    };
  }

  /**
   * 記錄路由決策和性能數據
   * @param taskId 任務ID
   * @param taskName 任務名稱
   * @param assessment 認知路由評估
   * @param result MCP操作結果
   */
  public recordRoutingDecision(
    taskId: string,
    taskName: string,
    assessment: CognitiveRoutingAssessment,
    result: MCPResult
  ): void {
    const decision: RoutingDecisionRecord = {
      taskId,
      taskName,
      complexityScore: assessment.complexityScore,
      systemRecommendation: assessment.systemRecommendation,
      mcpServerTarget: assessment.mcpServerTarget,
      responseTime: result.responseTime,
      success: result.success,
      errorMessage: result.error,
      timestamp: new Date(),
    };

    // 添加到決策歷史
    this.decisionHistory.push(decision);
    
    // 限制歷史記錄大小
    if (this.decisionHistory.length > this.maxHistorySize) {
      this.decisionHistory.shift();
    }

    // 更新指標
    this.updateMetrics(decision);
  }

  /**
   * 更新性能指標
   * @param decision 路由決策記錄
   */
  private updateMetrics(decision: RoutingDecisionRecord): void {
    // 更新調用計數
    switch (decision.systemRecommendation) {
      case 'SYSTEM_1':
        this.metrics.system1_calls++;
        break;
      case 'SYSTEM_2':
        this.metrics.system2_calls++;
        break;
      case 'HYBRID':
        this.metrics.hybrid_calls++;
        break;
    }

    // 更新響應時間
    const systemKey = decision.mcpServerTarget;
    const currentTimes = this.metrics.average_response_time.get(systemKey) || 0;
    const callCount = this.getSystemCallCount(decision.systemRecommendation);
    const newAverage = ((currentTimes * (callCount - 1)) + decision.responseTime) / callCount;
    this.metrics.average_response_time.set(systemKey, Math.round(newAverage));

    // 更新準確性指標
    this.metrics.accuracy_metrics.total_routing_decisions++;
    if (decision.success) {
      this.metrics.accuracy_metrics.correct_routing_decisions++;
    }

    // 更新成功率
    this.updateSuccessRates();

    // 更新趨勢數據
    this.updateTrends(decision);

    // 更新時間戳
    this.metrics.timestamp = new Date();
  }

  /**
   * 獲取系統調用計數
   */
  private getSystemCallCount(system: 'SYSTEM_1' | 'SYSTEM_2' | 'HYBRID'): number {
    switch (system) {
      case 'SYSTEM_1': return this.metrics.system1_calls;
      case 'SYSTEM_2': return this.metrics.system2_calls;
      case 'HYBRID': return this.metrics.hybrid_calls;
    }
  }

  /**
   * 更新成功率
   */
  private updateSuccessRates(): void {
    const system1Decisions = this.decisionHistory.filter(d => d.systemRecommendation === 'SYSTEM_1');
    const system2Decisions = this.decisionHistory.filter(d => d.systemRecommendation === 'SYSTEM_2');
    const hybridDecisions = this.decisionHistory.filter(d => d.systemRecommendation === 'HYBRID');

    this.metrics.accuracy_metrics.system1_success_rate = system1Decisions.length > 0
      ? Math.round((system1Decisions.filter(d => d.success).length / system1Decisions.length) * 100)
      : 0;

    this.metrics.accuracy_metrics.system2_success_rate = system2Decisions.length > 0
      ? Math.round((system2Decisions.filter(d => d.success).length / system2Decisions.length) * 100)
      : 0;

    this.metrics.accuracy_metrics.hybrid_success_rate = hybridDecisions.length > 0
      ? Math.round((hybridDecisions.filter(d => d.success).length / hybridDecisions.length) * 100)
      : 0;
  }

  /**
   * 更新趨勢數據
   */
  private updateTrends(decision: RoutingDecisionRecord): void {
    const dateKey = decision.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD

    // 更新每日路由計數
    const dailyCounts = this.metrics.performance_trends.daily_routing_counts.get(dateKey) || 
      { system1: 0, system2: 0, hybrid: 0 };
    
    switch (decision.systemRecommendation) {
      case 'SYSTEM_1': dailyCounts.system1++; break;
      case 'SYSTEM_2': dailyCounts.system2++; break;
      case 'HYBRID': dailyCounts.hybrid++; break;
    }
    
    this.metrics.performance_trends.daily_routing_counts.set(dateKey, dailyCounts);

    // 更新響應時間趨勢
    const responseTimes = this.metrics.performance_trends.response_time_trends.get(dateKey) || [];
    responseTimes.push(decision.responseTime);
    this.metrics.performance_trends.response_time_trends.set(dateKey, responseTimes);

    // 更新錯誤率
    if (!decision.success) {
      const currentErrors = this.metrics.performance_trends.error_rates.get(dateKey) || 0;
      this.metrics.performance_trends.error_rates.set(dateKey, currentErrors + 1);
    }
  }

  /**
   * 生成性能報告
   * @returns 完整的路由性能指標
   */
  public generatePerformanceReport(): RoutingMetrics {
    // 生成優化建議
    this.metrics.optimization_recommendations = this.generateOptimizationRecommendations();
    
    return { ...this.metrics };
  }

  /**
   * 生成優化建議
   */
  private generateOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const totalDecisions = this.metrics.accuracy_metrics.total_routing_decisions;
    
    if (totalDecisions === 0) {
      return ['No routing decisions recorded yet. Start using the system to generate performance data.'];
    }

    // 成功率分析
    const overallSuccessRate = (this.metrics.accuracy_metrics.correct_routing_decisions / totalDecisions) * 100;
    
    if (overallSuccessRate < 85) {
      recommendations.push(`Overall success rate (${overallSuccessRate.toFixed(1)}%) is below optimal. Consider reviewing complexity thresholds.`);
    }

    // 系統負載分析
    const system1Percentage = (this.metrics.system1_calls / totalDecisions) * 100;
    const system2Percentage = (this.metrics.system2_calls / totalDecisions) * 100;
    
    if (system1Percentage > 80) {
      recommendations.push('Heavy System 1 usage detected. Consider adjusting complexity thresholds to better utilize System 2 capabilities.');
    }
    
    if (system2Percentage > 70) {
      recommendations.push('High System 2 usage detected. Review task complexity assessment to ensure efficient routing.');
    }

    // 響應時間分析
    const avgResponseTime = Array.from(this.metrics.average_response_time.values())
      .reduce((sum, time) => sum + time, 0) / this.metrics.average_response_time.size;
    
    if (avgResponseTime > 5000) {
      recommendations.push(`Average response time (${avgResponseTime}ms) is high. Consider optimizing MCP server performance.`);
    }

    // 系統特定建議
    if (this.metrics.accuracy_metrics.system1_success_rate < 90) {
      recommendations.push(`System 1 success rate (${this.metrics.accuracy_metrics.system1_success_rate}%) could be improved. Check Supabase MCP configuration.`);
    }
    
    if (this.metrics.accuracy_metrics.system2_success_rate < 85) {
      recommendations.push(`System 2 success rate (${this.metrics.accuracy_metrics.system2_success_rate}%) needs attention. Verify Graphiti MCP setup.`);
    }

    // 趨勢分析建議
    const recentErrors = this.getRecentErrorRate();
    if (recentErrors > 10) {
      recommendations.push(`Recent error rate (${recentErrors}%) is elevated. Monitor system health and review error logs.`);
    }

    return recommendations.length > 0 ? recommendations : ['System performance is optimal. Continue monitoring for trends.'];
  }

  /**
   * 獲取最近錯誤率
   */
  private getRecentErrorRate(): number {
    const recentDecisions = this.decisionHistory.slice(-100); // 最近 100 個決策
    if (recentDecisions.length === 0) return 0;
    
    const failures = recentDecisions.filter(d => !d.success).length;
    return Math.round((failures / recentDecisions.length) * 100);
  }

  /**
   * 優化路由閾值
   * @returns 優化後的複雜度閾值建議
   */
  public optimizeRoutingThresholds(): {
    currentThresholds: typeof TaskComplexityThresholds;
    suggestedThresholds: typeof TaskComplexityThresholds;
    reasoning: string[];
  } {
    const reasoning: string[] = [];
    const currentThresholds = TaskComplexityThresholds;
    
    // 分析當前閾值效果
    const system1Tasks = this.decisionHistory.filter(d => d.systemRecommendation === 'SYSTEM_1');
    const system2Tasks = this.decisionHistory.filter(d => d.systemRecommendation === 'SYSTEM_2');
    
    // 計算建議閾值
    let suggestedDescriptionMedium = currentThresholds.DESCRIPTION_LENGTH.MEDIUM;
    let suggestedDescriptionHigh = currentThresholds.DESCRIPTION_LENGTH.HIGH;
    
    // 如果 System 1 成功率很高但 System 2 使用率過低，降低閾值
    if (this.metrics.accuracy_metrics.system1_success_rate > 95 && 
        this.metrics.system2_calls < this.metrics.system1_calls * 0.2) {
      suggestedDescriptionMedium = Math.floor(currentThresholds.DESCRIPTION_LENGTH.MEDIUM * 0.8);
      suggestedDescriptionHigh = Math.floor(currentThresholds.DESCRIPTION_LENGTH.HIGH * 0.8);
      reasoning.push('Lowering thresholds to increase System 2 utilization while maintaining high System 1 success rate');
    }
    
    // 如果 System 2 錯誤率高，提高閾值
    if (this.metrics.accuracy_metrics.system2_success_rate < 80) {
      suggestedDescriptionMedium = Math.floor(currentThresholds.DESCRIPTION_LENGTH.MEDIUM * 1.2);
      suggestedDescriptionHigh = Math.floor(currentThresholds.DESCRIPTION_LENGTH.HIGH * 1.2);
      reasoning.push('Raising thresholds to reduce System 2 errors and improve overall reliability');
    }

    const suggestedThresholds = {
      DESCRIPTION_LENGTH: {
        MEDIUM: suggestedDescriptionMedium,
        HIGH: suggestedDescriptionHigh,
        VERY_HIGH: currentThresholds.DESCRIPTION_LENGTH.VERY_HIGH,
      },
      DEPENDENCIES_COUNT: currentThresholds.DEPENDENCIES_COUNT,
      NOTES_LENGTH: currentThresholds.NOTES_LENGTH,
    };

    if (reasoning.length === 0) {
      reasoning.push('Current thresholds appear optimal based on performance data');
    }

    return {
      currentThresholds,
      suggestedThresholds,
      reasoning,
    };
  }

  /**
   * 記錄指標到 Supabase（模擬實現）
   * @param metrics 性能指標
   */
  public async logToSupabase(metrics: RoutingMetrics): Promise<{ success: boolean; error?: string }> {
    try {
      // 注意：這是一個模擬實現
      // 實際部署中需要使用真實的 Supabase 客戶端或 MCP 調用
      
      // 準備存儲數據
      const metricsData = {
        timestamp: metrics.timestamp.toISOString(),
        system1_calls: metrics.system1_calls,
        system2_calls: metrics.system2_calls,
        hybrid_calls: metrics.hybrid_calls,
        average_response_times: Object.fromEntries(metrics.average_response_time),
        accuracy_metrics: metrics.accuracy_metrics,
        optimization_recommendations: metrics.optimization_recommendations,
      };

      // 模擬 Supabase 存儲
      // const result = await supabaseClient
      //   .from('routing_performance_metrics')
      //   .insert([metricsData]);

      console.log('📊 Performance metrics logged:', {
        timestamp: metricsData.timestamp,
        total_calls: metrics.system1_calls + metrics.system2_calls + metrics.hybrid_calls,
        success_rate: metrics.accuracy_metrics.total_routing_decisions > 0 
          ? Math.round((metrics.accuracy_metrics.correct_routing_decisions / metrics.accuracy_metrics.total_routing_decisions) * 100)
          : 0
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error logging to Supabase'
      };
    }
  }

  /**
   * 獲取決策歷史（用於分析）
   * @param limit 返回記錄數量限制
   * @returns 最近的路由決策記錄
   */
  public getDecisionHistory(limit: number = 100): RoutingDecisionRecord[] {
    return this.decisionHistory.slice(-limit);
  }

  /**
   * 獲取性能統計摘要
   */
  public getPerformanceSummary(): {
    totalDecisions: number;
    averageResponseTime: number;
    successRate: number;
    systemDistribution: { system1: number; system2: number; hybrid: number };
    topRecommendations: string[];
  } {
    const totalDecisions = this.metrics.accuracy_metrics.total_routing_decisions;
    const successRate = totalDecisions > 0 
      ? Math.round((this.metrics.accuracy_metrics.correct_routing_decisions / totalDecisions) * 100)
      : 0;
    
    const avgResponseTime = Array.from(this.metrics.average_response_time.values())
      .reduce((sum, time) => sum + time, 0) / (this.metrics.average_response_time.size || 1);

    return {
      totalDecisions,
      averageResponseTime: Math.round(avgResponseTime),
      successRate,
      systemDistribution: {
        system1: this.metrics.system1_calls,
        system2: this.metrics.system2_calls,
        hybrid: this.metrics.hybrid_calls,
      },
      topRecommendations: this.metrics.optimization_recommendations.slice(0, 3),
    };
  }
}

// 導出單例實例
export const routingPerformanceMonitor = new RoutingPerformanceMonitor();