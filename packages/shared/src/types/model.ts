/**
 * 模型相关类型定义
 *
 * 抽象不同 LLM 提供商的模型信息，
 * 支持 OpenAI、Anthropic 等多家供应商。
 */

/** 模型提供商标识 */
export type ModelProvider = "openai" | "anthropic";

/** 模型能力标签 */
export type ModelCapability = "vision" | "thinking" | "function_calling";

/** 模型定义 */
export interface ModelDefinition {
  /** 模型唯一名称 (用于 API 请求) */
  name: string;
  /** 展示名称 */
  displayName: string;
  provider: ModelProvider;
  capabilities: ModelCapability[];
}
