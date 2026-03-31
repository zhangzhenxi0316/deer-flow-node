/**
 * SSE 流桥接器
 *
 * 将 LangGraph 图的执行事件转换为 Server-Sent Events (SSE) 格式，
 * 实现 Agent 输出的实时流式推送。
 *
 * SSE 协议格式:
 * ```
 * event: <event-type>\n
 * data: <JSON payload>\n
 * \n
 * ```
 */

import { HumanMessage } from "@langchain/core/messages";
import type { AIMessageChunk } from "@langchain/core/messages";
import type { StreamEvent as AppStreamEvent } from "@deer-flow/shared";
import { buildAgentGraph } from "../graph/graph.js";

/**
 * 格式化单个 SSE 帧
 * @param eventType SSE 事件类型
 * @param data 事件数据 (会被 JSON 序列化)
 */
export function formatSSEFrame(eventType: string, data: unknown): string {
  return `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * 将 Agent 执行过程流式转换为 SSE 事件序列
 *
 * 使用 LangGraph 的 streamEvents API，获得细粒度的执行事件：
 * - on_chat_model_stream: LLM 输出 token
 * - on_tool_start: 工具开始执行
 * - on_tool_end: 工具执行完成
 *
 * @param userMessage 用户消息内容
 * @param modelName 可选的模型名称
 * @returns AsyncGenerator，每次 yield 一个 SSE 帧字符串
 */
export async function* streamAgentRun(
  userMessage: string,
  modelName?: string
): AsyncGenerator<string> {
  // 每次 Run 构建新的图实例 (支持不同模型配置)
  const graph = buildAgentGraph(modelName);

  let finalMessage = "";

  try {
    /**
     * streamEvents 返回细粒度事件流
     * version: "v2" 使用最新事件格式
     */
    const eventStream = graph.streamEvents(
      { messages: [new HumanMessage(userMessage)] },
      { version: "v2" }
    );

    for await (const event of eventStream) {
      const { event: eventName, name, data } = event;

      // ---- LLM 流式输出 token ----
      if (eventName === "on_chat_model_stream") {
        const chunk = data?.chunk as AIMessageChunk | undefined;
        const text = typeof chunk?.content === "string" ? chunk.content : "";

        if (text) {
          finalMessage += text;
          const sseEvent: AppStreamEvent = { type: "text_delta", delta: text };
          yield formatSSEFrame("message", sseEvent);
        }
      }

      // ---- 工具调用开始 ----
      if (eventName === "on_tool_start" && name !== "__start__") {
        const toolEvent: AppStreamEvent = {
          type: "tool_call",
          toolCallId: event.run_id ?? "",
          toolName: name,
          args: (data?.input as Record<string, unknown>) ?? {},
        };
        yield formatSSEFrame("message", toolEvent);
      }

      // ---- 工具调用完成 ----
      if (eventName === "on_tool_end" && name !== "__end__") {
        const output = data?.output;
        const outputStr =
          typeof output === "string"
            ? output
            : JSON.stringify(output);

        const resultEvent: AppStreamEvent = {
          type: "tool_result",
          toolCallId: event.run_id ?? "",
          output: outputStr,
          isError: false,
        };
        yield formatSSEFrame("message", resultEvent);
      }
    }

    // ---- Run 成功完成 ----
    const completeEvent: AppStreamEvent = {
      type: "run_complete",
      runId: "",
      finalMessage,
    };
    yield formatSSEFrame("message", completeEvent);
  } catch (error) {
    // ---- Run 执行出错 ----
    const errorEvent: AppStreamEvent = {
      type: "run_error",
      message: error instanceof Error ? error.message : String(error),
    };
    yield formatSSEFrame("message", errorEvent);
  }
}
