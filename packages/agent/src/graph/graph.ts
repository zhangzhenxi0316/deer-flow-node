/**
 * Agent 图构建
 *
 * 使用 LangGraph StateGraph 构建 ReAct 风格的 Agent 图：
 *
 * ```
 * START → agent_node ─(有工具调用)→ tool_node → agent_node → ...
 *                    └─(无工具调用)→ END
 * ```
 *
 * 这是经典的 ReAct (Reasoning + Acting) 循环模式：
 * LLM 思考并决策 → 执行工具 → 观察结果 → 继续思考 → ...
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import {
  createAgentNode,
  createToolNode,
  routeAfterAgent,
} from "./nodes.js";
import { createModel } from "../models/factory.js";
import { getAvailableTools } from "../tools/index.js";

/**
 * 构建并编译 Agent 图
 *
 * @param modelName 可选，指定使用的模型
 * @returns 编译后的可执行图
 */
export function buildAgentGraph(modelName?: string) {
  const model = createModel(modelName);
  const tools = getAvailableTools();

  // 创建节点
  const agentNode = createAgentNode(model, tools);
  const toolNode = createToolNode(tools);

  // 构建状态图
  const graph = new StateGraph(AgentState)
    // 注册节点
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)

    // 定义边：START → agent (入口)
    .addEdge(START, "agent")

    // 条件边：agent 执行后根据结果路由
    .addConditionalEdges("agent", routeAfterAgent, {
      tools: "tools", // 有工具调用 → tools 节点
      __end__: END,   // 无工具调用 → 结束
    })

    // tools 执行完毕后回到 agent 继续推理
    .addEdge("tools", "agent");

  // 编译图 (生成可执行的 Runnable)
  return graph.compile();
}
