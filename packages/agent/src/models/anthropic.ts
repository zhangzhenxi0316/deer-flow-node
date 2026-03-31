/**
 * Anthropic 模型提供商
 *
 * 封装 @langchain/anthropic，支持 Claude 3.5 Sonnet 等模型。
 * Claude 支持扩展思考 (extended thinking) 模式。
 */

import { ChatAnthropic } from "@langchain/anthropic";
import type { IModelProvider, ModelProviderConfig } from "./provider.js";

export class AnthropicProvider implements IModelProvider {
  createModel(config: ModelProviderConfig) {
    return new ChatAnthropic({
      anthropicApiKey: config.apiKey,
      model: config.modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 8096,
      streaming: true,
    });
  }
}
