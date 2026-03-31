/**
 * LLM 提供商抽象接口
 *
 * 所有模型提供商必须实现此接口，
 * 使上层 Agent 代码与具体 LLM SDK 解耦。
 */

import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * 模型提供商配置
 */
export interface ModelProviderConfig {
  /** API Key */
  apiKey: string;
  /** 模型名称 (e.g. "gpt-4o", "claude-3-5-sonnet-20241022") */
  modelName: string;
  /** 自定义 API Base URL (用于代理等场景) */
  baseUrl?: string;
  /** 最大输出 token 数 */
  maxTokens?: number;
  /** 采样温度 0-1 */
  temperature?: number;
}

/**
 * 模型提供商工厂接口
 * 每个提供商实现此接口，返回 LangChain 兼容的 Chat Model
 */
export interface IModelProvider {
  /**
   * 创建 LangChain Chat Model 实例
   * @param config 提供商配置
   */
  createModel(config: ModelProviderConfig): BaseChatModel;
}
