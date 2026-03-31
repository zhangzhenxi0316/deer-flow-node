/**
 * MiniMax 模型提供商
 *
 * MiniMax 提供 OpenAI 兼容的 Chat Completions API，
 * 因此直接复用 ChatOpenAI，仅替换 baseURL 和 API Key。
 *
 * 支持的模型:
 * - MiniMax-Text-01   通用对话，支持 function calling
 * - MiniMax-M1        推理模型 (类似 o1)，支持 function calling
 * - abab6.5s-chat     轻量快速版本
 *
 * 配置: 需设置环境变量 MINIMAX_API_KEY
 * 官网: https://www.minimaxi.com
 * API 文档: https://platform.minimaxi.com/document/ChatCompletion
 */

import { ChatOpenAI } from "@langchain/openai";
import type { IModelProvider, ModelProviderConfig } from "./provider.js";

/** MiniMax OpenAI 兼容接口地址 */
const MINIMAX_BASE_URL = "https://api.minimaxi.chat/v1";

export class MiniMaxProvider implements IModelProvider {
  createModel(config: ModelProviderConfig) {
    return new ChatOpenAI({
      openAIApiKey: config.apiKey,
      modelName: config.modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens,
      streaming: true,
      configuration: {
        // 指向 MiniMax 的 OpenAI 兼容端点
        baseURL: config.baseUrl ?? MINIMAX_BASE_URL,
      },
    });
  }
}
