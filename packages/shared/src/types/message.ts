/**
 * 消息相关类型定义
 *
 * 消息是 Thread 中的基本交互单元，
 * 支持文本、工具调用等多种内容类型。
 */

/** 消息角色 */
export type MessageRole = "user" | "assistant" | "tool";

/** 文本内容块 */
export interface TextContent {
  type: "text";
  text: string;
}

/** 工具调用内容块 */
export interface ToolCallContent {
  type: "tool_call";
  toolCallId: string;
  toolName: string;
  /** 工具调用参数 (JSON) */
  args: Record<string, unknown>;
}

/** 工具执行结果内容块 */
export interface ToolResultContent {
  type: "tool_result";
  toolCallId: string;
  /** 工具执行输出 */
  output: string;
  /** 是否执行出错 */
  isError?: boolean;
}

export type MessageContent = TextContent | ToolCallContent | ToolResultContent;

/** 消息完整数据结构 */
export interface Message {
  id: string;
  threadId: string;
  role: MessageRole;
  content: MessageContent[];
  createdAt: string;
}
