/**
 * Runs 模块
 */

import { Module } from "@nestjs/common";
import { RunsController } from "./runs.controller";
import { RunsService } from "./runs.service";
import { ThreadsModule } from "../threads/threads.module";

@Module({
  imports: [ThreadsModule], // 导入 ThreadsModule 以使用 ThreadsService
  controllers: [RunsController],
  providers: [RunsService],
})
export class RunsModule {}
