/**
 * 消息列表项组件
 *
 * 渲染单条消息，支持：
 * - 用户消息 (右对齐，蓝色背景)
 * - Assistant 消息 (左对齐，Markdown 渲染)
 * - 工具调用展示 (可折叠详情)
 * - 流式输出动画 (光标闪烁)
 */

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { AppMessage } from "../../store/appStore.js";

interface MessageItemProps {
  message: AppMessage;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* 头像 */}
      <Avatar role={message.role} />

      {/* 消息内容 */}
      <div className={`flex flex-col gap-2 max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        {/* 工具调用列表 (assistant 消息才有) */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="w-full space-y-1">
            {message.toolCalls.map((tc) => (
              <ToolCallBadge
                key={tc.id}
                name={tc.name}
                args={tc.args}
                result={tc.result}
              />
            ))}
          </div>
        )}

        {/* 消息气泡 */}
        {(message.content || message.isStreaming) && (
          <div
            className={`
              px-4 py-3 rounded-2xl text-sm leading-relaxed
              ${isUser
                ? "bg-blue-600 text-white rounded-tr-sm"
                : "bg-gray-100 text-gray-900 rounded-tl-sm"
              }
            `}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
                {/* 流式输出光标 */}
                {message.isStreaming && (
                  <span className="inline-block w-0.5 h-4 bg-gray-600 animate-pulse ml-0.5" />
                )}
              </div>
            )}
          </div>
        )}

        {/* 纯 loading 状态 (还没有任何内容时) */}
        {!isUser && message.isStreaming && !message.content && message.toolCalls?.length === 0 && (
          <div className="px-4 py-3 rounded-2xl bg-gray-100 rounded-tl-sm">
            <ThinkingDots />
          </div>
        )}
      </div>
    </div>
  );
}

// ---- 子组件 ----

function Avatar({ role }: { role: "user" | "assistant" }) {
  return (
    <div
      className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0
        ${role === "user"
          ? "bg-blue-600 text-white"
          : "bg-brand-600 text-white"
        }
      `}
    >
      {role === "user" ? "U" : "🦌"}
    </div>
  );
}

/** 工具调用徽章，可展开查看详情 */
function ToolCallBadge({
  name,
  args,
  result,
}: {
  name: string;
  args: Record<string, unknown>;
  result?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
      {/* 工具名称行 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 bg-gray-50
                   hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-purple-600">⚙</span>
        <span className="font-medium text-gray-700">{name}</span>
        {result ? (
          <span className="ml-auto text-green-600 text-xs">✓ Done</span>
        ) : (
          <span className="ml-auto text-yellow-500 text-xs animate-pulse">Running...</span>
        )}
        <span className="text-gray-400">{expanded ? "▲" : "▼"}</span>
      </button>

      {/* 展开详情 */}
      {expanded && (
        <div className="px-3 py-2 border-t border-gray-200 space-y-2 bg-white">
          <div>
            <div className="text-gray-500 font-medium mb-1">Input:</div>
            <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>
          {result && (
            <div>
              <div className="text-gray-500 font-medium mb-1">Output:</div>
              <pre className="bg-green-50 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                {result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** 思考中动画 */
function ThinkingDots() {
  return (
    <div className="flex gap-1 items-center h-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
