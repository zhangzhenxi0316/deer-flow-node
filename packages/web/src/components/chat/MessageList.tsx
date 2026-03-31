/**
 * 消息列表组件
 *
 * 渲染线程中的所有消息，并在新消息到达时自动滚动到底部。
 */

import React, { useEffect, useRef, useMemo } from "react";

/** 模块级稳定空数组，避免每次渲染生成新引用触发 Zustand 无限重渲染 */
const STABLE_EMPTY: never[] = [];
import { useAppStore } from "../../store/appStore.js";
import { MessageItem } from "./MessageItem.js";

interface MessageListProps {
  threadId: string;
}

export function MessageList({ threadId }: MessageListProps) {
  /**
   * 用 useMemo 缓存 selector 函数引用，避免每次渲染生成新函数。
   * Zustand 使用 Object.is 比较 selector 返回值，
   * selector 函数本身若每次都是新引用，会在某些版本导致重复订阅。
   */
  /**
   * 用 useMemo 稳定 selector 函数引用，避免每次渲染生成新函数导致无限订阅。
   * 模块级 STABLE_EMPTY 确保无消息时返回同一引用，避免 Object.is 判定状态变化。
   */
  const selector = useMemo(
    () => (state: ReturnType<typeof useAppStore.getState>) =>
      state.messagesByThread[threadId] ?? STABLE_EMPTY,
    [threadId]
  );
  const messages = useAppStore(selector);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 新消息出现时，平滑滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
        <div className="text-6xl">🦌</div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-1">
            DeerFlow Agent
          </h2>
          <p className="text-sm">
            Ask me anything. I can search the web, calculate, and more.
          </p>
        </div>
        {/* 示例问题 */}
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {EXAMPLE_QUESTIONS.map((q) => (
            <ExampleChip key={q} text={q} threadId={threadId} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      {/* 滚动锚点 */}
      <div ref={bottomRef} />
    </div>
  );
}

// ---- 示例问题 ----

const EXAMPLE_QUESTIONS = [
  "What's the latest news about AI?",
  "Calculate 2^32 + sqrt(144)",
  "Explain quantum computing simply",
];

function ExampleChip({
  text,
  threadId,
}: {
  text: string;
  threadId: string;
}) {
  // 点击示例问题时触发发送（通过自定义事件）
  const handleClick = () => {
    window.dispatchEvent(
      new CustomEvent("deer:example-question", {
        detail: { text, threadId },
      })
    );
  };

  return (
    <button
      onClick={handleClick}
      className="px-3 py-1.5 border border-gray-200 rounded-full text-sm
                 text-gray-600 hover:border-brand-500 hover:text-brand-600
                 transition-colors"
    >
      {text}
    </button>
  );
}
