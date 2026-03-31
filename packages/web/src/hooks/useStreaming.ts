/**
 * useStreaming Hook
 *
 * 封装 SSE 流式接收逻辑。
 * 使用 fetch + ReadableStream 读取 SSE 响应，
 * 解析事件并通过 Zustand store 更新 UI 状态。
 *
 * 使用示例:
 * ```tsx
 * const { sendMessage } = useStreaming()
 * await sendMessage(threadId, "你好，帮我搜索一下...")
 * ```
 */

import { useCallback } from "react";
import type { StreamEvent } from "@deer-flow/shared";
import { api } from "../api/client.js";
import { useAppStore } from "../store/appStore.js";

/**
 * 解析单个 SSE 帧，提取数据 JSON
 *
 * SSE 格式:
 * ```
 * event: message
 * data: {"type":"text_delta","delta":"Hello"}
 * ```
 *
 * @param frame 原始 SSE 帧字符串
 * @returns 解析后的事件对象，解析失败返回 null
 */
function parseSSEFrame(frame: string): StreamEvent | null {
  const lines = frame.split("\n");
  let dataLine = "";

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      dataLine = line.slice(6); // 去掉 "data: " 前缀
    }
  }

  if (!dataLine) return null;

  try {
    return JSON.parse(dataLine) as StreamEvent;
  } catch {
    return null;
  }
}

export function useStreaming() {
  const { addUserMessage, handleStreamEvent, selectedModel } = useAppStore();

  /**
   * 发送消息并接收 Agent 流式响应
   *
   * 模型优先级: 参数 model > store.selectedModel > 服务端 DEFAULT_MODEL
   *
   * @param threadId 线程 ID
   * @param message  用户消息内容
   * @param model    可选，临时覆盖当前选中模型
   */
  const sendMessage = useCallback(
    async (threadId: string, message: string, model?: string) => {
      // 使用传入的 model，否则取 store 里用户选择的，最终由服务端兜底
      const resolvedModel = model ?? selectedModel ?? undefined;

      // 1. 立即更新 UI，显示用户消息和空的 assistant 占位
      addUserMessage(threadId, message);

      try {
        // 2. 发起请求，获取 SSE 流
        const response = await api.createRun(threadId, message, resolvedModel);

        if (!response.body) {
          throw new Error("No response body");
        }

        // 3. 读取 SSE 流
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = ""; // 用于缓冲不完整的帧

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // 将新数据追加到缓冲区
          buffer += decoder.decode(value, { stream: true });

          // SSE 帧以双换行符 (\n\n) 分隔
          const frames = buffer.split("\n\n");

          // 最后一个元素可能是不完整的帧，保留在缓冲区
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            if (!frame.trim()) continue;
            const event = parseSSEFrame(frame);
            if (event) {
              handleStreamEvent(threadId, event);
            }
          }
        }
      } catch (error) {
        // 网络错误时也要更新状态，避免 UI 卡在 streaming 状态
        handleStreamEvent(threadId, {
          type: "run_error",
          message: error instanceof Error ? error.message : "Network error",
        });
      }
    },
    [addUserMessage, handleStreamEvent, selectedModel]
  );

  return { sendMessage };
}
