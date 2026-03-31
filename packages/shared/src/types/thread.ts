/**
 * 会话线程相关类型定义
 *
 * Thread 是用户与 AI Agent 交互的基本单元，
 * 每个 Thread 维护独立的对话历史和状态。
 */

/** 线程状态 */
export type ThreadStatus = "idle" | "busy" | "interrupted" | "error";

/** 线程元数据 */
export interface ThreadMetadata {
  /** 对话标题，由 Agent 自动生成 */
  title?: string;
  /** 创建时使用的模型 */
  model?: string;
  /** 额外扩展字段 */
  [key: string]: unknown;
}

/** 线程完整数据结构 */
export interface Thread {
  id: string;
  status: ThreadStatus;
  metadata: ThreadMetadata;
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
}

/** 创建线程的请求体 */
export interface CreateThreadRequest {
  /** 可选，若不提供则自动生成 UUID */
  id?: string;
  metadata?: ThreadMetadata;
}

/** 更新线程的请求体 */
export interface UpdateThreadRequest {
  metadata: Partial<ThreadMetadata>;
}
