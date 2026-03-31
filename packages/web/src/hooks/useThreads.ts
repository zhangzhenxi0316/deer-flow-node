/**
 * useThreads Hook
 *
 * 使用 TanStack Query 管理线程数据的获取、缓存和更新。
 * Query 自动处理加载状态、错误状态和缓存失效。
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "../api/client.js";
import { useAppStore } from "../store/appStore.js";

/** Query Key 常量，避免字符串拼写错误 */
const THREADS_KEY = ["threads"] as const;

/**
 * 线程列表 Hook
 * 自动获取并缓存线程列表，每 30 秒重新验证一次
 */
export function useThreadList() {
  return useQuery({
    queryKey: THREADS_KEY,
    queryFn: () => api.threads.list(),
    staleTime: 30_000, // 30 秒内认为数据是新鲜的
  });
}

/**
 * 创建线程 Mutation Hook
 */
export function useCreateThread() {
  const queryClient = useQueryClient();
  const setActiveThread = useAppStore((s) => s.setActiveThread);

  return useMutation({
    mutationFn: () => api.threads.create(),
    onSuccess: (thread) => {
      // 创建成功后：刷新列表并切换到新线程
      queryClient.invalidateQueries({ queryKey: THREADS_KEY });
      setActiveThread(thread.id);
    },
  });
}

/**
 * 删除线程 Mutation Hook
 */
export function useDeleteThread() {
  const queryClient = useQueryClient();
  const { activeThreadId, setActiveThread } = useAppStore();

  return useMutation({
    mutationFn: (threadId: string) => api.threads.delete(threadId),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: THREADS_KEY });
      // 若删除的是当前线程，清除选中状态
      if (activeThreadId === deletedId) {
        setActiveThread(null);
      }
    },
  });
}
