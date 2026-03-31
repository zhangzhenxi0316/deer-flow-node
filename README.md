# 🦌 DeerFlow Node.js

DeerFlow 的 Node.js 实现，基于 pnpm workspace 的全栈 AI Agent 平台。

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                     pnpm workspace                          │
│                                                             │
│  packages/web        packages/api         packages/agent    │
│  ─────────────       ────────────         ───────────────   │
│  React + Vite        NestJS (DI)          Fastify +         │
│  Port: 5173    ───►  Port: 3001    ───►   LangGraph.js      │
│                      REST API             Port: 3002        │
│                      SSE Proxy            SSE Source        │
│                                                             │
│  packages/shared  ─── 共享 TypeScript 类型                   │
└─────────────────────────────────────────────────────────────┘
```

## 包说明

| 包 | 描述 | 技术栈 |
|---|---|---|
| `@deer-flow/shared` | 共享类型定义 | TypeScript |
| `@deer-flow/agent` | Agent 执行服务器 | Fastify + LangGraph.js |
| `@deer-flow/api` | REST API 服务器 | NestJS (依赖注入) |
| `@deer-flow/web` | Web 前端 | React + Vite + TailwindCSS |

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，至少配置一个 LLM API Key
```

最简配置（仅需 OpenAI）:
```env
OPENAI_API_KEY=sk-...
DEFAULT_PROVIDER=openai
DEFAULT_MODEL=gpt-4o-mini
```

可选配置:
```env
TAVILY_API_KEY=tvly-...    # 开启 Web 搜索工具
ANTHROPIC_API_KEY=sk-ant-... # 使用 Claude 模型
```

### 3. 启动所有服务

需要 3 个终端窗口:

```bash
# 终端 1: Agent Server (LangGraph)
pnpm --filter @deer-flow/agent dev

# 终端 2: API Server (NestJS)
pnpm --filter @deer-flow/api dev

# 终端 3: Web 前端 (Vite)
pnpm --filter @deer-flow/web dev
```

访问 http://localhost:5173

## 项目结构

```
deer-flow-node/
├── packages/
│   ├── shared/              # 共享 TypeScript 类型
│   │   └── src/types/
│   │       ├── thread.ts    # 线程类型
│   │       ├── message.ts   # 消息类型
│   │       ├── run.ts       # Run + SSE 事件类型
│   │       ├── model.ts     # 模型类型
│   │       └── memory.ts    # 记忆类型
│   │
│   ├── agent/               # Agent 服务器
│   │   └── src/
│   │       ├── graph/       # LangGraph 图定义
│   │       │   ├── state.ts     # 图状态 (MessagesAnnotation)
│   │       │   ├── nodes.ts     # 图节点 (agent, tool)
│   │       │   └── graph.ts     # 图编译 (ReAct 循环)
│   │       ├── tools/       # Agent 工具
│   │       │   ├── web-search.ts  # Tavily 网络搜索
│   │       │   ├── calculator.ts  # 安全计算器
│   │       │   └── index.ts       # 工具注册
│   │       ├── models/      # LLM 提供商
│   │       │   ├── provider.ts    # 接口定义
│   │       │   ├── openai.ts      # OpenAI 实现
│   │       │   ├── anthropic.ts   # Anthropic 实现
│   │       │   └── factory.ts     # 工厂函数
│   │       ├── streaming/   # SSE 流桥接
│   │       │   └── bridge.ts      # LangGraph → SSE
│   │       └── server.ts    # Fastify 服务入口
│   │
│   ├── api/                 # NestJS API 服务器
│   │   └── src/
│   │       ├── common/
│   │       │   ├── config/  # 配置模块 (@Global)
│   │       │   └── store/   # 内存存储模块 (@Global)
│   │       ├── modules/
│   │       │   ├── threads/ # 线程 CRUD
│   │       │   ├── runs/    # Agent Run + SSE 代理
│   │       │   ├── models/  # 模型列表
│   │       │   └── memory/  # 记忆 CRUD
│   │       ├── app.module.ts
│   │       └── main.ts
│   │
│   └── web/                 # React 前端
│       └── src/
│           ├── api/         # API 客户端
│           ├── store/       # Zustand 全局状态
│           ├── hooks/       # useStreaming, useThreads
│           └── components/
│               ├── chat/    # ChatWindow, MessageList, ChatInput
│               └── sidebar/ # ThreadList
│
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .env.example
```

## API 端点

### API Server (NestJS, :3001)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/threads` | 获取线程列表 |
| POST | `/api/threads` | 创建线程 |
| GET | `/api/threads/:id` | 获取线程详情 |
| PATCH | `/api/threads/:id` | 更新线程元数据 |
| DELETE | `/api/threads/:id` | 删除线程 |
| POST | `/api/threads/:id/runs` | 创建 Run (SSE 流式响应) |
| GET | `/api/models` | 获取可用模型列表 |
| GET | `/api/memory` | 获取记忆列表 |
| POST | `/api/memory/facts` | 创建记忆 |
| PUT | `/api/memory/facts/:id` | 更新记忆 |
| DELETE | `/api/memory/facts/:id` | 删除记忆 |

### Agent Server (Fastify, :3002)

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/runs` | 执行 Agent Run (SSE 流) |
| GET | `/models` | 获取可用模型 |
| GET | `/health` | 健康检查 |

## SSE 事件格式

```
event: message
data: {"type":"text_delta","delta":"Hello"}

event: message
data: {"type":"tool_call","toolCallId":"...","toolName":"web_search","args":{...}}

event: message
data: {"type":"tool_result","toolCallId":"...","output":"...","isError":false}

event: message
data: {"type":"run_complete","runId":"...","finalMessage":"..."}
```

## 扩展指南

### 添加新 LLM 提供商

1. 在 `packages/agent/src/models/` 创建实现 `IModelProvider` 接口的类
2. 在 `packages/agent/src/models/factory.ts` 的 `PROVIDERS` 中注册

### 添加新工具

1. 在 `packages/agent/src/tools/` 使用 LangChain `tool()` 创建工具
2. 在 `packages/agent/src/tools/index.ts` 的 `getAvailableTools()` 中注册

### 替换存储后端

`StoreService` 是纯接口封装，替换实现并通过 NestJS DI 注入即可：
- 开发: 内存存储 (当前实现)
- 生产: PostgreSQL / Redis / MongoDB
