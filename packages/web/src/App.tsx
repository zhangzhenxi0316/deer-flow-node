/**
 * 根应用组件
 *
 * 布局结构:
 * ```
 * ┌──────────┬──────────────────────────┐
 * │          │                          │
 * │  Sidebar │      Chat Window         │
 * │ (Thread  │   (Messages + Input)     │
 * │   List)  │                          │
 * │          │                          │
 * └──────────┴──────────────────────────┘
 * ```
 */

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThreadList } from "./components/sidebar/ThreadList.js";
import { ChatWindow } from "./components/chat/ChatWindow.js";

/** TanStack Query 客户端实例 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // 失败后重试 1 次
      refetchOnWindowFocus: false, // 切换窗口不自动刷新
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* 左侧：线程列表侧边栏 */}
        <ThreadList />

        {/* 右侧：聊天窗口 */}
        <main className="flex-1 flex flex-col min-w-0">
          <ChatWindow />
        </main>
      </div>
    </QueryClientProvider>
  );
}
