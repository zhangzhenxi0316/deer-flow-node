/**
 * 线程列表侧边栏
 *
 * 显示所有会话线程，支持选中和删除。
 * 点击 "New Chat" 按钮创建新线程。
 */

import React from "react";
import {
  useThreadList,
  useCreateThread,
  useDeleteThread,
} from "../../hooks/useThreads.js";
import { useAppStore } from "../../store/appStore.js";
import type { Thread } from "@deer-flow/shared";

export function ThreadList() {
  const { data: threads, isLoading } = useThreadList();
  const createThread = useCreateThread();
  const deleteThread = useDeleteThread();
  const { activeThreadId, setActiveThread } = useAppStore();

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64 border-r border-gray-700">
      {/* 顶部标题和新建按钮 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🦌</span>
          <h1 className="text-lg font-bold text-brand-500">DeerFlow</h1>
        </div>
        <button
          onClick={() => createThread.mutate()}
          disabled={createThread.isPending}
          className="w-full py-2 px-4 bg-brand-600 hover:bg-brand-700
                     text-white rounded-lg text-sm font-medium transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createThread.isPending ? "Creating..." : "+ New Chat"}
        </button>
      </div>

      {/* 线程列表 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="text-center text-gray-400 text-sm mt-4">
            Loading...
          </div>
        ) : threads?.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8 px-4">
            No conversations yet.
            <br />
            Click "New Chat" to start.
          </div>
        ) : (
          threads?.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              isActive={thread.id === activeThreadId}
              onSelect={() => setActiveThread(thread.id)}
              onDelete={() => deleteThread.mutate(thread.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---- 线程列表项 ----

interface ThreadItemProps {
  thread: Thread;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function ThreadItem({ thread, isActive, onSelect, onDelete }: ThreadItemProps) {
  const title = thread.metadata.title ?? "New Conversation";
  const date = new Date(thread.createdAt).toLocaleDateString();

  return (
    <div
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
        transition-colors relative
        ${isActive
          ? "bg-gray-700 text-white"
          : "text-gray-300 hover:bg-gray-800"
        }
      `}
      onClick={onSelect}
    >
      {/* 线程标题和日期 */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-gray-500">{date}</div>
      </div>

      {/* 状态指示器 */}
      {thread.status === "busy" && (
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse flex-shrink-0" />
      )}

      {/* 删除按钮 (hover 时显示) */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // 阻止触发 onSelect
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400
                   transition-opacity flex-shrink-0 text-gray-500"
        title="Delete conversation"
      >
        ✕
      </button>
    </div>
  );
}
