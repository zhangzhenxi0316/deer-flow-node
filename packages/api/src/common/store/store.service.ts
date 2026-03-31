/**
 * 内存存储服务
 *
 * 提供轻量级的内存 KV 存储，用于线程、记忆等数据的持久化。
 * 生产环境可替换为数据库实现 (PostgreSQL, Redis 等)，
 * 只需提供相同接口的实现并通过 NestJS DI 替换即可。
 *
 * 注意: 内存存储在服务重启后数据会丢失，
 *       适合开发环境和演示场景。
 */

import { Injectable } from "@nestjs/common";

@Injectable()
export class StoreService {
  /** 使用 Map 作为底层存储结构 */
  private readonly store = new Map<string, unknown>();

  /**
   * 存储数据
   * @param key 存储键
   * @param value 存储值 (任意可序列化对象)
   */
  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  /**
   * 获取数据
   * @param key 存储键
   * @returns 存储的值，不存在时返回 undefined
   */
  get<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  /**
   * 删除数据
   * @param key 存储键
   * @returns 是否成功删除
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * 检查键是否存在
   */
  has(key: string): boolean {
    return this.store.has(key);
  }

  /**
   * 按前缀获取所有匹配的条目
   * @param prefix 键前缀
   * @returns 所有匹配的 [key, value] 数组
   */
  getByPrefix<T>(prefix: string): Array<[string, T]> {
    const results: Array<[string, T]> = [];
    for (const [key, value] of this.store.entries()) {
      if (key.startsWith(prefix)) {
        results.push([key, value as T]);
      }
    }
    return results;
  }
}
