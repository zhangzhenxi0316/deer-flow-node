/**
 * 线程服务 (Threads Service)
 *
 * 处理线程的生命周期管理：创建、查询、更新、删除。
 * 通过依赖注入使用 StoreService 存储数据，
 * 替换 StoreService 实现即可切换到数据库后端。
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import type { Thread, CreateThreadRequest, UpdateThreadRequest } from "@deer-flow/shared";
import { StoreService } from "../../common/store/store.service";

/** 线程存储键前缀 */
const THREAD_PREFIX = "thread:";

@Injectable()
export class ThreadsService {
  constructor(
    /** 注入存储服务 - 通过 DI 解耦存储实现 */
    private readonly store: StoreService
  ) {}

  /**
   * 创建新线程
   * 若提供了 id 则幂等创建 (已存在时直接返回)
   */
  create(dto: CreateThreadRequest): Thread {
    // 幂等性：若线程已存在，直接返回
    if (dto.id) {
      const existing = this.findById(dto.id);
      if (existing) return existing;
    }

    const now = new Date().toISOString();
    const thread: Thread = {
      id: dto.id ?? uuidv4(),
      status: "idle",
      metadata: dto.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };

    this.store.set(`${THREAD_PREFIX}${thread.id}`, thread);
    return thread;
  }

  /**
   * 获取所有线程列表 (按创建时间倒序)
   */
  findAll(): Thread[] {
    const threads = this.store
      .getByPrefix<Thread>(THREAD_PREFIX)
      .map(([, thread]) => thread);

    // 按创建时间倒序排列，最新的在前
    return threads.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * 通过 ID 查询线程
   * @throws NotFoundException 线程不存在时抛出 404
   */
  findOne(id: string): Thread {
    const thread = this.findById(id);
    if (!thread) {
      throw new NotFoundException(`Thread "${id}" not found`);
    }
    return thread;
  }

  /**
   * 更新线程元数据
   */
  update(id: string, dto: UpdateThreadRequest): Thread {
    const thread = this.findOne(id);
    const updated: Thread = {
      ...thread,
      metadata: { ...thread.metadata, ...dto.metadata },
      updatedAt: new Date().toISOString(),
    };
    this.store.set(`${THREAD_PREFIX}${id}`, updated);
    return updated;
  }

  /**
   * 更新线程状态 (供 Runs 服务调用)
   */
  updateStatus(id: string, status: Thread["status"]): void {
    const thread = this.findOne(id);
    this.store.set(`${THREAD_PREFIX}${id}`, {
      ...thread,
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * 删除线程
   */
  remove(id: string): void {
    this.findOne(id); // 确保存在，不存在时抛 404
    this.store.delete(`${THREAD_PREFIX}${id}`);
  }

  // ---- 私有方法 ----

  private findById(id: string): Thread | undefined {
    return this.store.get<Thread>(`${THREAD_PREFIX}${id}`);
  }
}
