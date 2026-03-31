/**
 * 存储模块
 * 全局模块，所有业务模块均可注入 StoreService
 */

import { Global, Module } from "@nestjs/common";
import { StoreService } from "./store.service";

@Global()
@Module({
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
