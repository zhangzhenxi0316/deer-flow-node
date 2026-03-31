/**
 * 消息输入框组件
 *
 * 功能：
 * - 多行文本输入，自动扩展高度
 * - Enter 发送，Shift+Enter 换行
 * - 流式响应期间禁用输入
 * - 输入框左下角模型选择下拉
 * - 监听示例问题点击事件
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "../../store/appStore.js";
import { useStreaming } from "../../hooks/useStreaming.js";
import { useModels } from "../../hooks/useModels.js";

interface ChatInputProps {
  threadId: string;
}

export function ChatInput({ threadId }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = useAppStore((s) => s.isStreaming);
  const { sendMessage } = useStreaming();
  const { models, selectedModel, setSelectedModel } = useModels();

  /** 发送消息 */
  const handleSend = useCallback(async () => {
    const message = input.trim();
    if (!message || isStreaming) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await sendMessage(threadId, message);
  }, [input, isStreaming, sendMessage, threadId]);

  /** 监听示例问题点击事件 */
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ text: string; threadId: string }>;
      if (custom.detail.threadId === threadId) {
        setInput(custom.detail.text);
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("deer:example-question", handler);
    return () => window.removeEventListener("deer:example-question", handler);
  }, [threadId]);

  /** 键盘事件：Enter 发送，Shift+Enter 换行 */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /** 自动调整 textarea 高度 */
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const canSend = input.trim().length > 0 && !isStreaming;

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      {/* 输入区主体 */}
      <div
        className={`
          flex items-end gap-3 border rounded-2xl px-4 py-3 transition-colors
          ${isStreaming
            ? "border-gray-200 bg-gray-50"
            : "border-gray-300 focus-within:border-brand-500"
          }
        `}
      >
        {/* 文本输入区 */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={
            isStreaming
              ? "Agent is thinking..."
              : "Message DeerFlow... (Enter to send, Shift+Enter for new line)"
          }
          disabled={isStreaming}
          rows={1}
          className={`
            flex-1 resize-none outline-none text-sm bg-transparent
            placeholder:text-gray-400 max-h-48 overflow-y-auto
            ${isStreaming ? "text-gray-400" : "text-gray-900"}
          `}
          style={{ lineHeight: "1.5" }}
        />

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`
            w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
            transition-all text-white text-sm font-bold
            ${canSend
              ? "bg-brand-600 hover:bg-brand-700 cursor-pointer"
              : "bg-gray-200 cursor-not-allowed"
            }
          `}
          title="Send message"
        >
          {isStreaming ? (
            <span className="w-3 h-3 bg-white rounded-sm" />
          ) : (
            "↑"
          )}
        </button>
      </div>

      {/* 底部工具栏：模型选择 + 提示文字 */}
      <div className="flex items-center justify-between mt-2 px-1">
        {/* 模型选择器 */}
        <ModelSelector
          models={models}
          selected={selectedModel}
          onChange={setSelectedModel}
          disabled={isStreaming}
        />
        <p className="text-xs text-gray-400">
          DeerFlow can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

// ---- 模型选择下拉组件 ----

interface ModelSelectorProps {
  models: Array<{ name: string; displayName: string; provider: string }>;
  selected: string | null;
  onChange: (model: string) => void;
  disabled: boolean;
}

function ModelSelector({ models, selected, onChange, disabled }: ModelSelectorProps) {
  if (models.length === 0) {
    return <span className="text-xs text-gray-400">No models available</span>;
  }

  /** 将 "minimax/MiniMax-Text-01" 格式转为展示名 */
  const getDisplayName = (modelName: string) => {
    const found = models.find((m) => m.name === modelName);
    return found?.displayName ?? modelName.split("/").pop() ?? modelName;
  };

  /** 按 provider 分组，生成 <optgroup> */
  const grouped = models.reduce<Record<string, typeof models>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400">Model:</span>
      <select
        value={selected ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          text-xs border border-gray-200 rounded-lg px-2 py-1
          bg-white outline-none cursor-pointer
          hover:border-gray-300 focus:border-brand-500
          transition-colors
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        title="Select model"
      >
        {!selected && (
          <option value="" disabled>
            Select model...
          </option>
        )}
        {Object.entries(grouped).map(([provider, providerModels]) => (
          <optgroup key={provider} label={provider}>
            {providerModels.map((m) => (
              <option key={m.name} value={m.name}>
                {m.displayName}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {/* 当前选中的模型标签，显示 provider 来源 */}
      {selected && (
        <span className="text-xs text-gray-400">
          ({selected.split("/")[0]})
        </span>
      )}
    </div>
  );
}
