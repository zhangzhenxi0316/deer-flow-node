/**
 * Runs 服务
 *
 * 负责将用户的消息请求转发给 Agent Server，
 * 并将 Agent Server 返回的 SSE 流桥接给前端客户端。
 *
 * 架构流程:
 * 前端 → API Server (NestJS) → Agent Server (Fastify/LangGraph)
 *              ↑ SSE proxy                     ↑ SSE source
 */

import { Injectable, Logger } from "@nestjs/common";
import type { Response } from "express";
import { AppConfigService } from "../../common/config/config.service";
import { ThreadsService } from "../threads/threads.service";

@Injectable()
export class RunsService {
  private readonly logger = new Logger(RunsService.name);

  constructor(
    /** 注入配置服务，获取 Agent Server URL */
    private readonly config: AppConfigService,
    /** 注入线程服务，更新线程状态 */
    private readonly threadsService: ThreadsService
  ) {}

  /**
   * 创建并流式执行 Agent Run
   *
   * 1. 将线程状态设为 busy
   * 2. 转发请求到 Agent Server
   * 3. 代理 SSE 流回前端
   * 4. 完成后将线程状态恢复为 idle
   *
   * @param threadId 所属线程 ID
   * @param message  用户消息内容
   * @param model    可选的模型名称
   * @param res      Express Response 对象 (用于写入 SSE)
   */
  async streamRun(
    threadId: string,
    message: string,
    model: string | undefined,
    res: Response
  ): Promise<void> {
    // 设置 SSE 响应头
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // 禁用 Nginx 缓冲
    res.flushHeaders();

    // 标记线程为忙碌状态
    this.threadsService.updateStatus(threadId, "busy");

    try {
      // 调用 Agent Server
      const agentResponse = await fetch(`${this.config.agentServerUrl}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, model }),
      });

      if (!agentResponse.ok || !agentResponse.body) {
        throw new Error(
          `Agent server responded with ${agentResponse.status}`
        );
      }

      // 代理 SSE 流：将 Agent Server 的 SSE 事件转发给前端
      const reader = agentResponse.body.getReader();
      const decoder = new TextDecoder();

      // 客户端断开连接时中止读取
      res.on("close", () => {
        reader.cancel().catch(() => {});
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }

      // Agent 执行完成，更新线程标题 (若事件中包含 title_update)
      this.threadsService.updateStatus(threadId, "idle");
    } catch (error) {
      this.logger.error({ error, threadId }, "Agent run failed");
      this.threadsService.updateStatus(threadId, "error");

      // 向前端发送错误事件
      res.write(
        `event: message\ndata: ${JSON.stringify({
          type: "run_error",
          message: error instanceof Error ? error.message : "Unknown error",
        })}\n\n`
      );
    } finally {
      res.end();
    }
  }
}
