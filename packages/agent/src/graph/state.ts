/**
 * LangGraph Agent 状态定义
 *
 * 使用 LangGraph 的 Annotation 系统定义 Agent 图的状态结构。
 * 状态在每个节点执行后自动合并更新 (Reducer 模式)。
 */

import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

/**
 * Agent Graph 状态
 *
 * - messages: 对话历史，使用 LangGraph 内置的 messagesStateReducer
 *   自动合并消息 (追加新消息而不是替换整个数组)
 */
export const AgentState = Annotation.Root({
  /**
   * 对话消息列表
   * messagesStateReducer 实现智能合并：
   * - 新 HumanMessage/AIMessage 直接追加
   * - 已有 id 的消息则更新 (用于流式更新)
   */
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});

/** Agent 状态类型 */
export type AgentStateType = typeof AgentState.State;
