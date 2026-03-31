/**
 * 工具注册表
 *
 * 统一管理所有 Agent 可用的工具。
 * 新增工具只需实现并在此处导出。
 */

import type { StructuredToolInterface } from "@langchain/core/tools";
import { webSearchTool } from "./web-search.js";
import { calculatorTool } from "./calculator.js";

/**
 * 所有可用工具列表
 *
 * 根据环境配置过滤不可用的工具
 * (例如: 未配置 TAVILY_API_KEY 时禁用 web_search)
 */
export function getAvailableTools(): StructuredToolInterface[] {
  const tools: StructuredToolInterface[] = [];

  // 计算器不需要外部 API，始终可用
  tools.push(calculatorTool);

  // Web 搜索需要 Tavily API Key
  if (process.env["TAVILY_API_KEY"]) {
    console.log('webSearchTool====',webSearchTool)
    tools.push(webSearchTool);
  }

  return tools;
}

export { webSearchTool, calculatorTool };
