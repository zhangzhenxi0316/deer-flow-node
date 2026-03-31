/**
 * 聊天窗口主组件
 *
 * 整合消息列表和输入框，构成完整的对话界面。
 * 当没有选中线程时，显示欢迎引导页面。
 */

import React from "react";
import { MessageList } from "./MessageList.js";
import { ChatInput } from "./ChatInput.js";
import { useAppStore } from "../../store/appStore.js";
import { useCreateThread } from "../../hooks/useThreads.js";

export function ChatWindow() {
  const activeThreadId = useAppStore((s) => s.activeThreadId);
  const createThread = useCreateThread();

  // 没有选中线程时，显示引导页
  if (!activeThreadId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white gap-6">
        <div className="text-center">
          <div className="text-7xl mb-4">🦌</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome to DeerFlow
          </h1>
          <p className="text-gray-500 max-w-md">
            An AI agent platform powered by LangGraph.js.
            Start a new conversation or select an existing one from the sidebar.
          </p>
        </div>
        <button
          onClick={() => createThread.mutate()}
          disabled={createThread.isPending}
          className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white
                     rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {createThread.isPending ? "Creating..." : "Start New Chat →"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      {/* 消息列表 - flex-1 自动填充剩余空间 */}
      <MessageList threadId={activeThreadId} />

      {/* 输入框固定在底部 */}
      <ChatInput threadId={activeThreadId} />
    </div>
  );
}
