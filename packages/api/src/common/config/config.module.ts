/**
 * 配置模块
 *
 * 全局模块，所有其他模块都可以注入 AppConfigService，
 * 无需在各自的 imports 中重复引入。
 */

import { Global, Module } from "@nestjs/common";
import { AppConfigService } from "./config.service";

@Global() // 标记为全局模块，自动在整个应用中可用
@Module({
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule {}
