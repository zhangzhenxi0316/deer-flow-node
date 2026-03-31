/**
 * Agent Server 入口
 *
 * 基于 Fastify 构建的轻量级 Agent 执行服务器。
 * 负责接收 API 服务器的请求，执行 LangGraph Agent，
 * 并通过 SSE 流式返回执行结果。
 *
 * 端口: 3002 (由 AGENT_SERVER_PORT 环境变量控制)
 *
 * API 端点:
 * - POST /runs          创建并流式执行 Agent Run
 * - GET  /models        获取可用模型列表
 * - GET  /health        健康检查
 */

// 显式指定 .env 路径：monorepo 根目录（src → agent → packages → root）
// ESM 没有 __dirname，用 import.meta.url 计算文件所在目录
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { config as loadEnv } from "dotenv";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: resolve(__dirname, "../../../.env") });
import Fastify from "fastify";
import cors from "@fastify/cors";
import { streamAgentRun } from "./streaming/bridge.js";
import { getAvailableModels } from "./models/factory.js";

// ==================== 初始化 Fastify ====================

const app = Fastify({
  logger: {
    level: process.env["LOG_LEVEL"] ?? "info",
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  },
});

// 注册 CORS 插件
await app.register(cors, {
  // 只允许 API 服务器访问 (内网通信)
  origin: process.env["API_SERVER_ORIGIN"] ?? "http://localhost:3001",
  methods: ["GET", "POST"],
});

// ==================== 路由定义 ====================

/**
 * 健康检查
 * API 服务器用此接口检测 Agent Server 是否可用
 */
app.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

/**
 * 获取可用模型列表
 */
app.get("/models", async () => {
  return { models: getAvailableModels() };
});

/**
 * 创建并执行 Agent Run (SSE 流式响应)
 *
 * 请求体:
 * - message: 用户消息
 * - model:   可选，指定模型 (如 "openai/gpt-4o")
 *
 * 响应: Server-Sent Events 流
 */
app.post<{
  Body: { message: string; model?: string };
}>("/runs", async (request, reply) => {
  const { message, model } = request.body;

  if (!message?.trim()) {
    return reply.status(400).send({ error: "message is required" });
  }

  // 设置 SSE 响应头
  reply.raw.setHeader("Content-Type", "text/event-stream");
  reply.raw.setHeader("Cache-Control", "no-cache");
  reply.raw.setHeader("Connection", "keep-alive");
  reply.raw.setHeader("X-Accel-Buffering", "no"); // 禁用 Nginx 缓冲
  reply.raw.flushHeaders();

  // 流式写入 SSE 事件
  try {
    for await (const frame of streamAgentRun(message, model)) {
      reply.raw.write(frame);
    }
  } catch (error) {
    app.log.error({ error }, "Agent run failed");
    reply.raw.write(
      `event: error\ndata: ${JSON.stringify({ message: "Internal error" })}\n\n`
    );
  } finally {
    reply.raw.end();
  }

  // Fastify 需要返回 reply 表示已处理响应
  return reply;
});

// ==================== 启动服务器 ====================

const port = parseInt(process.env["AGENT_SERVER_PORT"] ?? "3002", 10);
const host = process.env["AGENT_SERVER_HOST"] ?? "0.0.0.0";

try {
  await app.listen({ port, host });
  console.log(`\n🦌 DeerFlow Agent Server running at http://${host}:${port}\n`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
