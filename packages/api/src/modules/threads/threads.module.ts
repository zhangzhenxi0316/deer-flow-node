/**
 * 线程模块
 * 聚合线程相关的 Controller 和 Service
 */

import { Module } from "@nestjs/common";
import { ThreadsController } from "./threads.controller";
import { ThreadsService } from "./threads.service";

@Module({
  controllers: [ThreadsController],
  providers: [ThreadsService],
  exports: [ThreadsService], // 导出给 RunsModule 使用
})
export class ThreadsModule {}
