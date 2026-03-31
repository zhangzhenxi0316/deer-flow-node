/**
 * Run (执行任务) 相关类型定义
 *
 * 每次用户发送消息并触发 Agent 响应的过程称为一次 Run，
 * Run 通过 Server-Sent Events (SSE) 实时推送执行状态。
 */

/** Run 状态 */
export type RunStatus = "pending" | "running" | "completed" | "failed";

/** Run 元数据 */
export interface Run {
  id: string;
  threadId: string;
  status: RunStatus;
  createdAt: string;
}

/** 创建 Run 的请求体 */
export interface CreateRunRequest {
  /** 用户消息内容 */
  message: string;
  /** 使用的模型名称，不指定则使用默认 */
  model?: string;
  /** 是否开启深度思考模式 */
  thinking?: boolean;
}

// ====== SSE 事件类型 ======
// 所有 SSE 事件都有 type 字段用于区分

/** Agent 正在输出文本 (流式) */
export interface TextDeltaEvent {
  type: "text_delta";
  /** 增量文本片段 */
  delta: string;
}

/** Agent 发起工具调用 */
export interface ToolCallEvent {
  type: "tool_call";
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

/** 工具执行完成返回结果 */
export interface ToolResultEvent {
  type: "tool_result";
  toolCallId: string;
  output: string;
  isError: boolean;
}

/** Run 执行完成 */
export interface RunCompleteEvent {
  type: "run_complete";
  runId: string;
  /** 完整的 assistant 消息 */
  finalMessage: string;
}

/** Run 执行出错 */
export interface RunErrorEvent {
  type: "run_error";
  message: string;
}

/** 线程标题更新 */
export interface TitleUpdateEvent {
  type: "title_update";
  title: string;
}

export type StreamEvent =
  | TextDeltaEvent
  | ToolCallEvent
  | ToolResultEvent
  | RunCompleteEvent
  | RunErrorEvent
  | TitleUpdateEvent;
