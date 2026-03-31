/**
 * OpenAI 模型提供商
 *
 * 封装 @langchain/openai，支持 GPT-4o、GPT-4o-mini 等模型，
 * 也可通过 baseUrl 接入任何 OpenAI 兼容接口。
 */

import { ChatOpenAI } from "@langchain/openai";
import type { IModelProvider, ModelProviderConfig } from "./provider.js";

export class OpenAIProvider implements IModelProvider {
  createModel(config: ModelProviderConfig) {
    return new ChatOpenAI({
      openAIApiKey: config.apiKey,
      modelName: config.modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens,
      // 支持自定义 Base URL (代理或兼容接口)
      configuration: config.baseUrl
        ? { baseURL: config.baseUrl }
        : undefined,
      streaming: true, // 始终开启流式，由调用方决定是否使用
    });
  }
}
