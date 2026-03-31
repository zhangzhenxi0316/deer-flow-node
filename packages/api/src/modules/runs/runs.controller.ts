/**
 * Runs 控制器
 *
 * 处理 Agent Run 的创建和流式响应。
 * 使用 @Res() 获取原始 Express Response 对象以控制 SSE 流。
 *
 * 路由: POST /api/threads/:threadId/runs
 */

import { Controller, Post, Param, Body, Res } from "@nestjs/common";
import type { Response } from "express";
import { RunsService } from "./runs.service";

/** 创建 Run 的请求体 */
interface CreateRunDto {
  /** 用户消息 */
  message: string;
  /** 可选的模型名称 */
  model?: string;
}

@Controller("threads/:threadId/runs")
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  /**
   * POST /api/threads/:threadId/runs
   *
   * 创建并流式执行 Agent Run。
   * 响应为 SSE 流，客户端需要使用 EventSource 或 fetch + ReadableStream 接收。
   */
  @Post()
  async createRun(
    @Param("threadId") threadId: string,
    @Body() dto: CreateRunDto,
    @Res() res: Response
  ): Promise<void> {
    await this.runsService.streamRun(
      threadId,
      dto.message,
      dto.model,
      res
    );
  }
}
