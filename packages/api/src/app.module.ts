/**
 * 根模块 (App Module)
 *
 * NestJS 应用的顶层模块，负责：
 * 1. 导入所有业务模块
 * 2. 注册全局模块 (Config, Store)
 * 3. 配置中间件
 *
 * 依赖注入容器在此模块树中统一管理所有 Provider 的生命周期。
 */

import { Module } from "@nestjs/common";
import { ConfigModule } from "./common/config/config.module";
import { StoreModule } from "./common/store/store.module";
import { ThreadsModule } from "./modules/threads/threads.module";
import { RunsModule } from "./modules/runs/runs.module";
import { ModelsModule } from "./modules/models/models.module";
import { MemoryModule } from "./modules/memory/memory.module";

@Module({
  imports: [
    // 全局基础模块 (标记了 @Global()，无需在子模块中重复导入)
    ConfigModule,
    StoreModule,

    // 业务功能模块
    ThreadsModule,
    RunsModule,
    ModelsModule,
    MemoryModule,
  ],
})
export class AppModule {}
