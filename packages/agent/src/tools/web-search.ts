/**
 * Web 搜索工具
 *
 * 使用 Tavily Search API 执行网络搜索。
 * Tavily 专为 AI Agent 设计，返回结构化搜索结果。
 *
 * 配置: 需设置环境变量 TAVILY_API_KEY
 * 官网: https://tavily.com
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";

/** Tavily API 返回的单条搜索结果 */
interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

/** Tavily API 响应结构 */
interface TavilyResponse {
  results: TavilyResult[];
  answer?: string; // Tavily 生成的摘要答案 (可选)
}

/**
 * 调用 Tavily Search API
 */
async function tavilySearch(
  query: string,
  maxResults = 5
): Promise<TavilyResponse> {
  const apiKey = process.env["TAVILY_API_KEY"];
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not configured");
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      include_answer: true, // 让 Tavily 生成摘要
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tavily API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<TavilyResponse>;
}

/**
 * 将搜索结果格式化为文本，方便 LLM 处理
 */
function formatResults(data: TavilyResponse): string {
  const lines: string[] = [];

  if (data.answer) {
    lines.push(`**Summary**: ${data.answer}\n`);
  }

  lines.push("**Search Results**:\n");

  for (const [i, result] of data.results.entries()) {
    lines.push(`${i + 1}. **${result.title}**`);
    lines.push(`   URL: ${result.url}`);
    lines.push(`   ${result.content}\n`);
  }

  return lines.join("\n");
}

/**
 * Web 搜索工具定义
 * 使用 LangChain tool() 装饰器创建，自动生成 JSON Schema
 */
export const webSearchTool = tool(
  async ({ query, maxResults }) => {
    try {
      const data = await tavilySearch(query, maxResults);
      return formatResults(data);
    } catch (error) {
      // 返回错误信息而不是抛出，让 Agent 可以处理搜索失败的情况
      return `Search failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
  {
    name: "web_search",
    description:
      "Search the web for current information. Use this when you need up-to-date information " +
      "or facts that might not be in your training data. Returns relevant web pages with summaries.",
    schema: z.object({
      query: z.string().describe("The search query to look up"),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(10)
        .default(5)
        .describe("Maximum number of results to return (1-10)"),
    }),
  }
);
