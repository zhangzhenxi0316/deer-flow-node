/**
 * 模型工厂
 *
 * 根据提供商名称和环境配置，统一创建 LangChain Chat Model。
 * 新增提供商只需：
 *   1. 实现 IModelProvider 接口
 *   2. 在 PROVIDER_REGISTRY 中添加一条记录
 */

import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { IModelProvider } from "./provider.js";
import { OpenAIProvider } from "./openai.js";
import { AnthropicProvider } from "./anthropic.js";
import { MiniMaxProvider } from "./minimax.js";

// ==================== 提供商注册表 ====================

/**
 * 提供商静态配置
 * envKey:     读取 API Key 的环境变量名
 * baseUrlKey: 读取自定义 Base URL 的环境变量名 (可选)
 * models:     该提供商的可选模型列表
 */
interface ProviderMeta {
  instance: IModelProvider;
  envKey: string;
  baseUrlKey?: string;
  models: Array<{ name: string; displayName: string }>;
}

const PROVIDER_REGISTRY: Record<string, ProviderMeta> = {
  openai: {
    instance: new OpenAIProvider(),
    envKey: "OPENAI_API_KEY",
    baseUrlKey: "OPENAI_BASE_URL",
    models: [
      { name: "gpt-4o", displayName: "GPT-4o" },
      { name: "gpt-4o-mini", displayName: "GPT-4o mini" },
    ],
  },
  anthropic: {
    instance: new AnthropicProvider(),
    envKey: "ANTHROPIC_API_KEY",
    models: [
      { name: "claude-3-5-sonnet-20241022", displayName: "Claude 3.5 Sonnet" },
      { name: "claude-3-5-haiku-20241022", displayName: "Claude 3.5 Haiku" },
    ],
  },
  minimax: {
    instance: new MiniMaxProvider(),
    envKey: "MINIMAX_API_KEY",
    baseUrlKey: "MINIMAX_BASE_URL", // 可覆盖默认地址
    models: [
      { name: "MiniMax-Text-01", displayName: "MiniMax Text-01" },
      { name: "MiniMax-M1", displayName: "MiniMax M1 (Reasoning)" },
      { name: "abab6.5s-chat", displayName: "MiniMax ABAB 6.5s" },
    ],
  },
};

// ==================== 内部工具函数 ====================

/** 读取提供商的 API Key */
function getApiKey(providerKey: string): string | undefined {
  const meta = PROVIDER_REGISTRY[providerKey];
  if (!meta) return undefined;
  return process.env[meta.envKey];
}

/** 读取提供商的自定义 Base URL */
function getBaseUrl(providerKey: string): string | undefined {
  const meta = PROVIDER_REGISTRY[providerKey];
  if (!meta?.baseUrlKey) return undefined;
  return process.env[meta.baseUrlKey];
}

/**
 * 默认提供商配置 (读取环境变量)
 * 按注册顺序选第一个配置了 API Key 的提供商作为默认值
 */
function getDefaultConfig() {
  // 优先读取显式配置
  const explicitProvider = process.env["DEFAULT_PROVIDER"];
  const explicitModel = process.env["DEFAULT_MODEL"];

  if (explicitProvider) {
    const apiKey = getApiKey(explicitProvider);
    if (!apiKey) {
      throw new Error(
        `DEFAULT_PROVIDER="${explicitProvider}" but ${PROVIDER_REGISTRY[explicitProvider]?.envKey} is not set.`
      );
    }
    return {
      provider: explicitProvider,
      model: explicitModel ?? PROVIDER_REGISTRY[explicitProvider]!.models[0]!.name,
      apiKey,
    };
  }

  // 未显式配置时，自动选第一个有 API Key 的提供商
  for (const [key, meta] of Object.entries(PROVIDER_REGISTRY)) {
    const apiKey = process.env[meta.envKey];
    if (apiKey) {
      return {
        provider: key,
        model: explicitModel ?? meta.models[0]!.name,
        apiKey,
      };
    }
  }

  throw new Error(
    "No LLM API key configured. Please set at least one of: " +
      Object.values(PROVIDER_REGISTRY)
        .map((m) => m.envKey)
        .join(", ")
  );
}

// ==================== 公开 API ====================

/**
 * 创建 Chat Model 实例
 *
 * @param modelName 模型名称，格式为 "provider/model" 或仅 "model"
 *   例如:
 *   - "minimax/MiniMax-Text-01"
 *   - "openai/gpt-4o"
 *   - "anthropic/claude-3-5-sonnet-20241022"
 *   - "MiniMax-Text-01"  (使用默认提供商时，若 DEFAULT_PROVIDER=minimax)
 */
export function createModel(modelName?: string): BaseChatModel {
  const defaults = getDefaultConfig();

  let providerKey: string;
  let model: string;

  if (modelName?.includes("/")) {
    // 格式: "provider/model"
    const slashIdx = modelName.indexOf("/");
    providerKey = modelName.slice(0, slashIdx);
    model = modelName.slice(slashIdx + 1);
  } else {
    providerKey = defaults.provider;
    model = modelName ?? defaults.model;
  }

  const meta = PROVIDER_REGISTRY[providerKey];
  if (!meta) {
    throw new Error(
      `Unknown model provider "${providerKey}". ` +
        `Available: ${Object.keys(PROVIDER_REGISTRY).join(", ")}`
    );
  }

  const apiKey = getApiKey(providerKey) ?? defaults.apiKey;

  return meta.instance.createModel({
    apiKey,
    modelName: model,
    baseUrl: getBaseUrl(providerKey),
  });
}

/**
 * 获取所有可用模型列表
 * 只返回已配置 API Key 的提供商的模型
 */
export function getAvailableModels() {
  const result = [];

  for (const [providerKey, meta] of Object.entries(PROVIDER_REGISTRY)) {
    if (!getApiKey(providerKey)) continue; // 未配置 API Key，跳过

    for (const m of meta.models) {
      result.push({
        name: `${providerKey}/${m.name}`,
        displayName: m.displayName,
        provider: providerKey,
      });
    }
  }

  return result;
}
