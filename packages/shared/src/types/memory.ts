/**
 * 记忆 (Memory) 系统类型定义
 *
 * Agent 可以从对话中提取关键信息持久化存储，
 * 并在后续对话中自动注入相关记忆以提升个性化体验。
 */

/** 记忆条目 */
export interface MemoryFact {
  id: string;
  /** 记忆标题/键 */
  key: string;
  /** 记忆内容 */
  value: string;
  /** 分类标签 */
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/** 创建记忆的请求体 */
export interface CreateMemoryFactRequest {
  key: string;
  value: string;
  tags?: string[];
}

/** 更新记忆的请求体 */
export interface UpdateMemoryFactRequest {
  key?: string;
  value?: string;
  tags?: string[];
}
