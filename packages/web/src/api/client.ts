/**
 * API 客户端
 *
 * 封装与 API Server 的所有 HTTP 通信。
 * 使用 fetch API，开发时通过 Vite proxy 转发到后端。
 *
 * 使用方式:
 * ```ts
 * import { api } from './api/client'
 * const threads = await api.threads.list()
 * ```
 */

import type {
  Thread,
  CreateThreadRequest,
  MemoryFact,
  CreateMemoryFactRequest,
} from "@deer-flow/shared";

/** API Base URL，通过 Vite proxy 透明转发 */
const BASE_URL = "/api";

/**
 * 通用请求函数
 * @param path API 路径 (相对于 /api)
 * @param init fetch 初始化选项
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error ${response.status}: ${error}`);
  }

  // 204 No Content 无响应体
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ==================== 线程 API ====================

const threads = {
  /** 获取所有线程 */
  list: () => request<Thread[]>("/threads"),

  /** 创建线程 */
  create: (data?: CreateThreadRequest) =>
    request<Thread>("/threads", {
      method: "POST",
      body: JSON.stringify(data ?? {}),
    }),

  /** 获取线程详情 */
  get: (id: string) => request<Thread>(`/threads/${id}`),

  /** 更新线程元数据 */
  update: (id: string, metadata: Record<string, unknown>) =>
    request<Thread>(`/threads/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ metadata }),
    }),

  /** 删除线程 */
  delete: (id: string) =>
    request<void>(`/threads/${id}`, { method: "DELETE" }),
};

// ==================== 记忆 API ====================

const memory = {
  /** 获取所有记忆 */
  list: () =>
    request<{ facts: MemoryFact[] }>("/memory").then((r) => r.facts),

  /** 创建记忆 */
  create: (data: CreateMemoryFactRequest) =>
    request<MemoryFact>("/memory/facts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** 删除记忆 */
  delete: (id: string) =>
    request<void>(`/memory/facts/${id}`, { method: "DELETE" }),
};

// ==================== 模型 API ====================

const models = {
  /** 获取可用模型 */
  list: () =>
    request<{ models: Array<{ name: string; displayName: string; provider: string }> }>(
      "/models"
    ).then((r) => r.models),
};

// ==================== SSE 流式 API ====================

/**
 * 创建 Agent Run 并返回 SSE 事件流
 *
 * 使用 fetch + ReadableStream 接收 SSE，
 * 相比 EventSource 更灵活，支持 POST 请求和自定义 headers。
 *
 * @param threadId 线程 ID
 * @param message  用户消息
 * @param model    可选模型名称
 * @returns        fetch Response 对象 (body 是 SSE 流)
 */
async function createRun(
  threadId: string,
  message: string,
  model?: string
): Promise<Response> {
  const response = await fetch(`${BASE_URL}/threads/${threadId}/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, model }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create run: ${response.status}`);
  }

  return response;
}

export const api = { threads, memory, models, createRun };
