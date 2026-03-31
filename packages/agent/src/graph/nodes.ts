/**
 * LangGraph 图节点定义
 *
 * 图由两类节点组成:
 * 1. agent_node: 调用 LLM 决策 (思考 + 工具调用)
 * 2. tool_node: 执行工具调用并返回结果
 *
 * 数据流: agent_node → (有工具调用) → tool_node → agent_node → ... → END
 */

import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage } from "@langchain/core/messages";
import type { BaseChatModelCallOptions, BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { StructuredToolInterface } from "@langchain/core/tools";
import type { AgentStateType } from "./state.js";

/**
 * 创建 Agent 节点
 *
 * Agent 节点使用绑定了工具的 LLM 处理消息，
 * LLM 可以决定调用工具或直接返回答案。
 *
 * @param model 已绑定工具的 Chat Model
 */
export function createAgentNode(
  model: BaseChatModel,
  tools: StructuredToolInterface[]
) {
  // 将工具绑定到模型，让 LLM 知道可用工具的 Schema
  // bindTools 在所有支持 function calling 的模型上可用
  const modelWithTools = (model as BaseChatModel<BaseChatModelCallOptions> & {
    bindTools: (tools: StructuredToolInterface[]) => typeof model;
  }).bindTools(tools);

  return async function agentNode(state: AgentStateType) {
    const response = await modelWithTools.invoke(state.messages);

    // 返回新消息，LangGraph 会通过 messagesStateReducer 自动追加
    return { messages: [response as AIMessage] };
  };
}

/**
 * 创建工具执行节点
 *
 * ToolNode 是 LangGraph prebuilt 组件，
 * 自动处理 AIMessage 中的 tool_calls，执行对应工具，
 * 并将结果作为 ToolMessage 追加到状态。
 *
 * @param tools 工具列表
 */
export function createToolNode(tools: StructuredToolInterface[]) {
  return new ToolNode(tools);
}

/**
 * 路由函数 - 决定下一步执行哪个节点
 *
 * 检查最新的 AIMessage 是否包含工具调用:
 * - 有工具调用 → 执行工具 (tools)
 * - 无工具调用 → 结束 (END)
 *
 * @param state 当前图状态
 */
export function routeAfterAgent(
  state: AgentStateType
): "tools" | "__end__" {
  const lastMessage = state.messages[state.messages.length - 1];

  // 类型收窄：检查是否为 AIMessage 且包含工具调用
  if (
    lastMessage &&
    "tool_calls" in lastMessage &&
    Array.isArray((lastMessage as AIMessage).tool_calls) &&
    (lastMessage as AIMessage).tool_calls!.length > 0
  ) {
    return "tools"; // 转到工具执行节点
  }

  return "__end__"; // 结束图执行
}
