/**
 * API Server 启动入口
 *
 * 配置并启动 NestJS 应用：
 * - 全局 API 前缀: /api
 * - CORS: 允许前端域名
 * - 端口: 3001
 */

// 显式指定 .env 路径：monorepo 根目录（src → api → packages → root）
// 必须在所有其他 import 之前执行，确保环境变量在模块初始化时就已就绪
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
loadEnv({ path: resolve(__dirname, "../../../.env") });

import "reflect-metadata"; // NestJS 装饰器元数据所必需
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AppConfigService } from "./common/config/config.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "error", "warn", "debug"],
  });

  // 从 DI 容器获取配置服务
  const config = app.get(AppConfigService);

  // 设置全局 API 前缀，所有路由都以 /api 开头
  app.setGlobalPrefix("api");

  // 配置 CORS，允许前端访问
  app.enableCors({
    origin: config.corsOrigins,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  await app.listen(config.port);
  console.log(`\n🚀 DeerFlow API Server running at http://localhost:${config.port}/api\n`);
}

bootstrap().catch((error) => {
  console.error("Failed to start API server:", error);
  process.exit(1);
});
