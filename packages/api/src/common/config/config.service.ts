/**
 * 配置服务
 *
 * 统一管理所有环境配置，通过依赖注入提供给各模块。
 * 优先读取 .env 文件，支持默认值。
 */

import { Injectable } from "@nestjs/common";

@Injectable()
export class AppConfigService {
  /** Agent Server 地址 */
  get agentServerUrl(): string {
    const host = process.env["AGENT_SERVER_HOST"] ?? "localhost";
    const port = process.env["AGENT_SERVER_PORT"] ?? "3002";
    return `http://${host}:${port}`;
  }

  /** API Server 端口 */
  get port(): number {
    return parseInt(process.env["API_SERVER_PORT"] ?? "3001", 10);
  }

  /** CORS 允许的来源 */
  get corsOrigins(): string[] {
    const origins = process.env["CORS_ORIGINS"] ?? "http://localhost:5173";
    return origins.split(",").map((o) => o.trim());
  }
}
