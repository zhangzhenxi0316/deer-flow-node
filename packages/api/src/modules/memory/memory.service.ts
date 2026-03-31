/**
 * 记忆服务 (Memory Service)
 *
 * 管理 Agent 的持久化记忆条目。
 * Agent 从对话中提取重要信息存储为记忆，
 * 后续对话时自动注入相关记忆提升个性化体验。
 *
 * 当前实现: 内存存储 (重启后丢失)
 * 生产建议: 替换为向量数据库 (如 pgvector, Chroma) 支持语义搜索
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import type { MemoryFact, CreateMemoryFactRequest } from "@deer-flow/shared";
import { StoreService } from "../../common/store/store.service";

const MEMORY_PREFIX = "memory:";

@Injectable()
export class MemoryService {
  constructor(private readonly store: StoreService) {}

  /** 获取所有记忆条目 */
  findAll(): MemoryFact[] {
    return this.store
      .getByPrefix<MemoryFact>(MEMORY_PREFIX)
      .map(([, fact]) => fact)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  /** 创建新记忆条目 */
  create(dto: CreateMemoryFactRequest): MemoryFact {
    const now = new Date().toISOString();
    const fact: MemoryFact = {
      id: uuidv4(),
      key: dto.key,
      value: dto.value,
      tags: dto.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(`${MEMORY_PREFIX}${fact.id}`, fact);
    return fact;
  }

  /** 更新记忆条目 */
  update(
    id: string,
    dto: Partial<CreateMemoryFactRequest>
  ): MemoryFact {
    const existing = this.store.get<MemoryFact>(`${MEMORY_PREFIX}${id}`);
    if (!existing) throw new NotFoundException(`Memory fact "${id}" not found`);

    const updated: MemoryFact = {
      ...existing,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    this.store.set(`${MEMORY_PREFIX}${id}`, updated);
    return updated;
  }

  /** 删除记忆条目 */
  remove(id: string): void {
    if (!this.store.has(`${MEMORY_PREFIX}${id}`)) {
      throw new NotFoundException(`Memory fact "${id}" not found`);
    }
    this.store.delete(`${MEMORY_PREFIX}${id}`);
  }

  /** 清空所有记忆 */
  clear(): void {
    const keys = this.store
      .getByPrefix(MEMORY_PREFIX)
      .map(([key]) => key);
    for (const key of keys) {
      this.store.delete(key);
    }
  }
}
