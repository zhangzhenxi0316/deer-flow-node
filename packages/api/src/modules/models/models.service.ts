/**
 * 模型服务
 *
 * 策略：优先从 Agent Server 获取（agent server 运行时最准确），
 * 若 Agent Server 不可达则直接读当前进程的环境变量构建列表。
 * 这样 /api/models 在 agent server 未启动时也能正常返回数据。
 */

import { Injectable, Logger } from "@nestjs/common";
import { AppConfigService } from "../../common/config/config.service";

export interface ModelInfo {
  name: string;
  displayName: string;
  provider: string;
}

/**
 * 与 agent/src/models/factory.ts 中的 PROVIDER_REGISTRY 保持同步。
 * 这里只做展示用，不需要 SDK 依赖，仅读 env 判断哪些 key 已配置。
 */
const PROVIDER_CATALOG: Array<{
  key: string;
  envKey: string;
  models: Array<{ name: string; displayName: string }>;
}> = [
  {
    key: "openai",
    envKey: "OPENAI_API_KEY",
    models: [
      { name: "gpt-4o", displayName: "GPT-4o" },
      { name: "gpt-4o-mini", displayName: "GPT-4o mini" },
    ],
  },
  {
    key: "anthropic",
    envKey: "ANTHROPIC_API_KEY",
    models: [
      { name: "claude-3-5-sonnet-20241022", displayName: "Claude 3.5 Sonnet" },
      { name: "claude-3-5-haiku-20241022", displayName: "Claude 3.5 Haiku" },
    ],
  },
  {
    key: "minimax",
    envKey: "MINIMAX_API_KEY",
    models: [
      { name: "MiniMax-Text-01", displayName: "MiniMax Text-01" },
      { name: "MiniMax-M1", displayName: "MiniMax M1 (Reasoning)" },
      { name: "abab6.5s-chat", displayName: "MiniMax ABAB 6.5s" },
    ],
  },
];

@Injectable()
export class ModelsService {
  private readonly logger = new Logger(ModelsService.name);

  constructor(private readonly config: AppConfigService) {}

  /**
   * 获取可用模型列表
   *
   * 优先从 Agent Server 获取（保证与运行时配置一致），
   * 失败时降级为读 API Server 自身的环境变量。
   */
  async getModels(): Promise<ModelInfo[]> {
    // 1. 尝试从 Agent Server 获取
    try {
      const response = await fetch(`${this.config.agentServerUrl}/models`, {
        signal: AbortSignal.timeout(2000), // 2s 超时，避免长时间等待
      });
      if (response.ok) {
        const data = (await response.json()) as { models: ModelInfo[] };
        if (data.models.length > 0) {
          return data.models;
        }
      }
    } catch {
      this.logger.debug("Agent server unreachable, falling back to env vars");
    }

    // 2. 降级：直接读环境变量
    return this.getModelsFromEnv();
  }

  /**
   * 根据环境变量判断哪些提供商已配置，返回对应模型列表
   */
  private getModelsFromEnv(): ModelInfo[] {
    const result: ModelInfo[] = [];
    for (const provider of PROVIDER_CATALOG) {
      if (!process.env[provider.envKey]) continue;
      for (const m of provider.models) {
        result.push({
          name: `${provider.key}/${m.name}`,
          displayName: m.displayName,
          provider: provider.key,
        });
      }
    }
    return result;
  }
}
