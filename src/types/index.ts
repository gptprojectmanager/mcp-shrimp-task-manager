// 任務狀態枚舉：定義任務在工作流程中的當前階段
export enum TaskStatus {
  PENDING = "pending", // 已創建但尚未開始執行的任務
  IN_PROGRESS = "in_progress", // 當前正在執行的任務
  COMPLETED = "completed", // 已成功完成並通過驗證的任務
  BLOCKED = "blocked", // 由於依賴關係而暫時無法執行的任務
}

// 任務依賴關係：定義任務之間的前置條件關係
export interface TaskDependency {
  taskId: string; // 前置任務的唯一標識符，當前任務執行前必須完成此依賴任務
}

// 相關文件類型：定義文件與任務的關係類型
export enum RelatedFileType {
  TO_MODIFY = "TO_MODIFY", // 需要在任務中修改的文件
  REFERENCE = "REFERENCE", // 任務的參考資料或相關文檔
  CREATE = "CREATE", // 需要在任務中建立的文件
  DEPENDENCY = "DEPENDENCY", // 任務依賴的組件或庫文件
  OTHER = "OTHER", // 其他類型的相關文件
}

// 相關文件：定義任務相關的文件信息
export interface RelatedFile {
  path: string; // 文件路徑，可以是相對於項目根目錄的路徑或絕對路徑
  type: RelatedFileType; // 文件與任務的關係類型
  description?: string; // 文件的補充描述，說明其與任務的具體關係或用途
  lineStart?: number; // 相關代碼區塊的起始行（選填）
  lineEnd?: number; // 相關代碼區塊的結束行（選填）
}

// 任務介面：定義任務的完整數據結構
export interface Task {
  id: string; // 任務的唯一標識符
  name: string; // 簡潔明確的任務名稱
  description: string; // 詳細的任務描述，包含實施要點和驗收標準
  notes?: string; // 補充說明、特殊處理要求或實施建議（選填）
  status: TaskStatus; // 任務當前的執行狀態
  dependencies: TaskDependency[]; // 任務的前置依賴關係列表
  createdAt: Date; // 任務創建的時間戳
  updatedAt: Date; // 任務最後更新的時間戳
  completedAt?: Date; // 任務完成的時間戳（僅適用於已完成的任務）
  summary?: string; // 任務完成摘要，簡潔描述實施結果和重要決策（僅適用於已完成的任務）
  relatedFiles?: RelatedFile[]; // 與任務相關的文件列表（選填）

  // 新增欄位：保存完整的技術分析結果
  analysisResult?: string; // 來自 analyze_task 和 reflect_task 階段的完整分析結果

  // 新增欄位：保存具體的實現指南
  implementationGuide?: string; // 具體的實現方法、步驟和建議

  // 新增欄位：保存驗證標準和檢驗方法
  verificationCriteria?: string; // 明確的驗證標準、測試要點和驗收條件
  
  // 任務完成元數據：保存辯論協議分析結果和完成詳情
  completionMetadata?: TaskCompletionMetadata; // 完成元數據（辯論分析結果）
  
  // 認知路由：System 1/System 2 cognitive architecture 路由信息
  cognitiveRouting?: CognitiveRoutingAssessment; // 認知路由評估結果（任務創建時自動評估）
}

// 任務複雜度級別：定義任務的複雜程度分類
export enum TaskComplexityLevel {
  LOW = "低複雜度", // 簡單且直接的任務，通常不需要特殊處理
  MEDIUM = "中等複雜度", // 具有一定複雜性但仍可管理的任務
  HIGH = "高複雜度", // 複雜且耗時的任務，需要特別關注
  VERY_HIGH = "極高複雜度", // 極其複雜的任務，建議拆分處理
}

// 任務複雜度閾值：定義任務複雜度評估的參考標準
export const TaskComplexityThresholds = {
  DESCRIPTION_LENGTH: {
    MEDIUM: 500, // 超過此字數判定為中等複雜度
    HIGH: 1000, // 超過此字數判定為高複雜度
    VERY_HIGH: 2000, // 超過此字數判定為極高複雜度
  },
  DEPENDENCIES_COUNT: {
    MEDIUM: 2, // 超過此依賴數量判定為中等複雜度
    HIGH: 5, // 超過此依賴數量判定為高複雜度
    VERY_HIGH: 10, // 超過此依賴數量判定為極高複雜度
  },
  NOTES_LENGTH: {
    MEDIUM: 200, // 超過此字數判定為中等複雜度
    HIGH: 500, // 超過此字數判定為高複雜度
    VERY_HIGH: 1000, // 超過此字數判定為極高複雜度
  },
};

// 任務複雜度評估結果：記錄任務複雜度分析的詳細結果
export interface TaskComplexityAssessment {
  level: TaskComplexityLevel; // 整體複雜度級別
  metrics: {
    // 各項評估指標的詳細數據
    descriptionLength: number; // 描述長度
    dependenciesCount: number; // 依賴數量
    notesLength: number; // 注記長度
    hasNotes: boolean; // 是否有注記
  };
  recommendations: string[]; // 處理建議列表
}

// 認知路由評估結果：擴展任務複雜度評估以支持 System 1/System 2 認知架構路由
export interface CognitiveRoutingAssessment extends TaskComplexityAssessment {
  systemRecommendation: 'SYSTEM_1' | 'SYSTEM_2' | 'HYBRID'; // 系統推薦：System 1 (快速)、System 2 (深思)、混合模式
  mcpServerTarget: 'supabase' | 'graphiti' | 'hybrid'; // MCP 服務器目標：Supabase (高吞吐量)、Graphiti (記憶圖譜)、混合模式
  routingJustification: string[]; // 路由決策理由列表
  episodicMemoryRequired: boolean; // 是否需要情節記憶存儲 (Graphiti MCP)
  temporalContextRequired: boolean; // 是否需要時間上下文處理
  complexityScore: number; // 複雜度評分 (0-100)，用於精確路由決策
}

// MCP 操作介面：定義 MCP 服務器操作的類型安全結構
export interface MCPOperation {
  type: 'supabase' | 'graphiti'; // MCP 服務器類型
  operation: string; // 操作名稱 (例如: 'read_table_rows', 'add_memory')
  parameters: Record<string, any>; // 操作參數
  metadata?: {
    taskId?: string; // 關聯的任務 ID
    timestamp?: string; // 操作時間戳
    complexity?: TaskComplexityLevel; // 任務複雜度級別
  };
}

// MCP 操作結果介面：標準化 MCP 服務器響應格式
export interface MCPResult {
  success: boolean; // 操作是否成功
  data?: any; // 返回的數據
  error?: string; // 錯誤信息 (如果操作失敗)
  responseTime: number; // 響應時間 (毫秒)
  serverType: 'supabase' | 'graphiti'; // 執行操作的服務器類型
  metadata?: {
    operationId?: string; // 操作唯一標識符
    cacheHit?: boolean; // 是否命中緩存
    routingDecision?: string; // 路由決策記錄
  };
}

// 認知路由決策類型：System 1/System 2 cognitive architecture 的路由選項
export type CognitiveSystemType = 'SYSTEM_1' | 'SYSTEM_2' | 'HYBRID';

// MCP 服務器目標類型：可用的 MCP 服務器選項
export type MCPServerType = 'supabase' | 'graphiti' | 'hybrid';

// 路由複雜度閾值配置：用於認知路由決策的配置參數
export interface CognitiveRoutingThresholds {
  system1MaxComplexity: number; // System 1 處理的最大複雜度評分
  system2MinComplexity: number; // System 2 處理的最小複雜度評分
  hybridComplexityRange: [number, number]; // 混合模式的複雜度範圍
  episodicMemoryThreshold: number; // 啟用情節記憶的複雜度閾值
  temporalContextKeywords: string[]; // 檢測時間上下文的關鍵詞列表
}

// 預設認知路由閾值：基於 DoTA-RAG framework 和學術研究的建議值
export const DefaultCognitiveRoutingThresholds: CognitiveRoutingThresholds = {
  system1MaxComplexity: 25, // 低複雜度任務 → Supabase (System 1)
  system2MinComplexity: 50, // 高複雜度任務 → Graphiti (System 2)
  hybridComplexityRange: [25, 50], // 中等複雜度 → 混合模式
  episodicMemoryThreshold: 60, // 複雜度 > 60 時啟用情節記憶
  temporalContextKeywords: [
    'temporal', 'time', 'sequence', 'history', 'memory', 'context', 
    'knowledge', 'learning', 'experience', 'past', 'future', 'timeline'
  ],
};

// Prover-Estimator 辯論評分介面
export interface DebateScoreBreakdown {
  proverScore: number; // 支持方評分 (0-100)
  estimatorScore: number; // 評估方評分 (0-100)
  consensusPoints: string[]; // 雙方共識點
  conflicts: string[]; // 爭議點
  resolutionJustification: string; // 解決方案說明
  honestEquilibriumScore: number; // 誠實均衡評分 (0-100)
}

// 防混淆驗證結果
export interface AntiObfuscationResult {
  evidenceConsistency: number; // 證據一致性分數 (0-100)
  manipulationRisk: 'LOW' | 'MEDIUM' | 'HIGH'; // 操縱風險等級
  truthfulnessIndicators: string[]; // 真實性指標
  suspiciousPatterns: string[]; // 可疑模式
}

// 辯論協議驗證參數
export interface DebateVerificationParams {
  enableDebateProtocol: boolean; // 是否啟用辯論協議
  debateIntensity: 'LIGHT' | 'MODERATE' | 'RIGOROUS'; // 辯論強度
  antiObfuscationEnabled: boolean; // 是否啟用防混淆檢查
  debateScoreBreakdown?: DebateScoreBreakdown; // 辯論評分詳情
  antiObfuscationResult?: AntiObfuscationResult; // 防混淆驗證結果
}

// 任務完成元數據
export interface TaskCompletionMetadata {
  completionTimestamp: number; // 完成時間戳
  verificationMethod: 'STANDARD' | 'DEBATE_PROTOCOL'; // 驗證方法
  finalScore: number; // 最終分數
  originalScore: number; // 原始分數
  debateAnalysis?: {
    proverScore: number;
    estimatorScore: number;
    consensusPoints: string[];
    conflicts: string[];
    honestEquilibriumScore: number;
  };
  antiObfuscationAnalysis?: {
    evidenceConsistency: number;
    manipulationRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    suspiciousPatterns: string[];
    truthfulnessIndicators: string[];
  };
  completionConfidence: 'LOW' | 'MEDIUM' | 'HIGH'; // 完成信心度
  recommendations: string[]; // 建議和洞察
}

// Parallel Task Orchestration Types

// Wave Configuration: Defines parameters for parallel task execution waves
export interface WaveConfiguration {
  size: number; // Number of agents in the wave (1-5 for small, 6-20 for large, 3-5 for infinite)
  timing: 'SIMULTANEOUS' | 'BATCH' | 'PROGRESSIVE'; // Execution timing strategy
  sophisticationLevel: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'REVOLUTIONARY'; // Innovation complexity level
  maxConcurrency: number; // Maximum concurrent agents allowed
  contextThreshold: number; // Context usage threshold for wave management
}

// Agent Assignment: Defines task assignment for individual sub-agents
export interface AgentAssignment {
  agentId: string; // Unique identifier for the sub-agent
  taskId: string; // ID of the task being assigned
  iterationNumber: number; // Iteration sequence number for uniqueness
  taskContext: {
    specAnalysis: string; // Complete specification analysis
    directorySnapshot: string; // Current state of output directory
    existingIterations: string[]; // Summary of existing task completions
  };
  uniquenessDirective: {
    assignedInnovationDimension: string; // Specific innovation focus area
    conflictAvoidanceStrategy: string; // Strategy to prevent duplication
    creativeFocus: string; // Unique creative direction for this agent
  };
  qualityStandards: {
    specCompliance: string[]; // Requirements from specification
    valueAddRequirements: string[]; // Expected value-add criteria
    completionCriteria: string[]; // Specific completion requirements
  };
}

// Parallel Execution Manager: Manages concurrent agent execution
export interface ParallelExecutionManager {
  waveId: string; // Unique identifier for the execution wave
  activeAgents: Map<string, AgentStatus>; // Currently executing agents and their status
  completedAgents: string[]; // Successfully completed agent IDs
  failedAgents: string[]; // Failed agent IDs for reassignment
  progressMetrics: {
    totalAgents: number;
    completedCount: number;
    failedCount: number;
    averageCompletionTime: number;
  };
}

// Agent Status: Current status of a sub-agent
export interface AgentStatus {
  agentId: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  startTime: number;
  endTime?: number;
  lastUpdate: number;
  progressNotes: string[];
}

// Progressive Wave Strategy: Defines evolution across waves
export interface ProgressiveWaveStrategy {
  currentWave: number;
  totalWaves: number | 'INFINITE';
  waveProgression: {
    wave: number;
    sophisticationLevel: string;
    innovationDimensions: string[];
    complexityTargets: string[];
  }[];
  evolutionPattern: 'LINEAR' | 'EXPONENTIAL' | 'ADAPTIVE';
}

// Context Capacity Monitor: Tracks context usage across agents
export interface ContextCapacityMonitor {
  totalCapacity: number;
  usedCapacity: number;
  reservedCapacity: number;
  agentUsage: Map<string, number>;
  waveUsage: Map<string, number>;
  remainingCapacity: number;
  utilizationPercentage: number;
}

// Task Orchestration Configuration: Main configuration for parallel execution
export interface TaskOrchestrationConfig {
  mode: 'SINGLE' | 'BATCH' | 'INFINITE';
  waveConfiguration: WaveConfiguration;
  progressiveStrategy: ProgressiveWaveStrategy;
  contextMonitoring: {
    enabled: boolean;
    threshold: number;
    gracefulShutdown: boolean;
  };
  failureHandling: {
    maxRetries: number;
    reassignmentStrategy: 'IMMEDIATE' | 'NEXT_WAVE' | 'DEFER';
    failureThreshold: number;
  };
}
