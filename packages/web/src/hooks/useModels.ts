/**
 * useModels Hook
 *
 * 从 API Server 获取可用模型列表，
 * 并管理当前选中的模型。
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client.js";
import { useAppStore } from "../store/appStore.js";

export function useModels() {
  const { selectedModel, setSelectedModel } = useAppStore();

  const { data, isLoading } = useQuery({
    queryKey: ["models"],
    queryFn: () => api.models.list(),
    staleTime: 60_000,
    // 获取到列表后，若还没有选中的模型则自动选第一个
    select: (models) => {
      if (!selectedModel && models.length > 0) {
        // 异步更新，避免在 select 里直接调 set
        setTimeout(() => setSelectedModel(models[0]!.name), 0);
      }
      return models;
    },
  });

  return {
    models: data ?? [],
    isLoading,
    selectedModel,
    setSelectedModel,
  };
}
