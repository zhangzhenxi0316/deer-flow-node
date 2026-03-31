/**
 * 全局应用状态 (Zustand Store)
 *
 * 管理跨组件共享的 UI 状态：
 * - 当前选中的线程
 * - 消息列表
 * - 流式响应状态
 *
 * 使用 Zustand 而非 Redux 是因为 API 更简洁，
 * 适合中小型应用，无需大量模板代码。
 */

import { create } from "zustand";
import type { StreamEvent } from "@deer-flow/shared";

/**
 * 模块级稳定空数组
 * Zustand 用 Object.is 比较 selector 返回值，
 * 若每次返回 [] 新引用会触发无限重渲染。
 * 所有 "无消息" 场景统一返回此引用。
 */
const EMPTY_MESSAGES: AppMessage[] = [];

/** 消息角色 */
type Role = "user" | "assistant";

/** 工具调用记录 */
interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
}

/** 应用内消息类型 (比 API 类型更丰富) */
export interface AppMessage {
  id: string;
  role: Role;
  /** 消息文本内容 */
  content: string;
  /** 工具调用列表 (仅 assistant 消息) */
  toolCalls?: ToolCall[];
  /** 是否正在流式输出 */
  isStreaming?: boolean;
  createdAt: Date;
}

interface AppState {
  // ---- 线程状态 ----
  /** 当前选中的线程 ID */
  activeThreadId: string | null;

  // ---- 消息状态 ----
  /** 按线程 ID 分组的消息列表 */
  messagesByThread: Record<string, AppMessage[]>;

  // ---- 流式状态 ----
  /** 是否正在等待 Agent 响应 */
  isStreaming: boolean;

  // ---- 模型选择 ----
  /** 当前选中的模型，格式如 "minimax/MiniMax-Text-01" */
  selectedModel: string | null;

  // ---- 动作 ----
  setActiveThread: (threadId: string | null) => void;
  setSelectedModel: (model: string) => void;

  /** 添加用户消息 */
  addUserMessage: (threadId: string, content: string) => void;

  /**
   * 处理 SSE 流事件，更新消息状态
   * 根据事件类型追加文本、记录工具调用等
   */
  handleStreamEvent: (threadId: string, event: StreamEvent) => void;

  /** 清空线程的消息 */
  clearMessages: (threadId: string) => void;
}

/** 生成简单 ID */
const genId = () => Math.random().toString(36).slice(2);

export const useAppStore = create<AppState>((set, get) => ({
  activeThreadId: null,
  messagesByThread: {},
  isStreaming: false,
  selectedModel: null,

  setActiveThread: (threadId) => {
    set({ activeThreadId: threadId });
  },

  setSelectedModel: (model) => {
    set({ selectedModel: model });
  },

  addUserMessage: (threadId, content) => {
    const message: AppMessage = {
      id: genId(),
      role: "user",
      content,
      createdAt: new Date(),
    };

    set((state) => ({
      isStreaming: true,
      messagesByThread: {
        ...state.messagesByThread,
        [threadId]: [
          ...(state.messagesByThread[threadId] ?? EMPTY_MESSAGES),
          message,
          // 同时添加一个空的 assistant 消息占位，等待流式填充
          {
            id: "streaming-" + genId(),
            role: "assistant" as Role,
            content: "",
            toolCalls: [],
            isStreaming: true,
            createdAt: new Date(),
          },
        ],
      },
    }));
  },

  handleStreamEvent: (threadId, event) => {
    set((state) => {
      const messages = [...(state.messagesByThread[threadId] ?? EMPTY_MESSAGES)];
      // 找到正在流式输出的 assistant 消息
      const streamingIdx = messages.findLastIndex(
        (m) => m.role === "assistant" && m.isStreaming
      );

      if (streamingIdx === -1) return state;

      const streaming = { ...messages[streamingIdx]! };

      switch (event.type) {
        case "text_delta":
          // 追加文本片段
          streaming.content += event.delta;
          break;

        case "tool_call":
          // 记录工具调用
          streaming.toolCalls = [
            ...(streaming.toolCalls ?? []),
            {
              id: event.toolCallId,
              name: event.toolName,
              args: event.args,
            },
          ];
          break;

        case "tool_result":
          // 更新对应工具调用的结果
          streaming.toolCalls = (streaming.toolCalls ?? []).map((tc) =>
            tc.id === event.toolCallId
              ? { ...tc, result: event.output }
              : tc
          );
          break;

        case "run_complete":
          // 流式完成，标记为非流式状态
          streaming.isStreaming = false;
          if (event.finalMessage) {
            streaming.content = event.finalMessage;
          }
          break;

        case "run_error":
          streaming.isStreaming = false;
          streaming.content =
            streaming.content || `Error: ${event.message}`;
          break;
      }

      messages[streamingIdx] = streaming;

      return {
        isStreaming:
          event.type !== "run_complete" && event.type !== "run_error",
        messagesByThread: {
          ...state.messagesByThread,
          [threadId]: messages,
        },
      };
    });
  },

  clearMessages: (threadId) => {
    set((state) => ({
      messagesByThread: {
        ...state.messagesByThread,
        [threadId]: EMPTY_MESSAGES,
      },
    }));
  },
}));

/** 获取指定线程的消息列表 */
export const selectMessages = (threadId: string | null) => (state: AppState) =>
  threadId ? (state.messagesByThread[threadId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES;
