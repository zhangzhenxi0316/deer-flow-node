/**
 * 线程控制器
 *
 * 提供线程 CRUD 的 REST API 端点。
 * NestJS 使用装饰器定义路由，依赖注入提供服务实例。
 *
 * 路由前缀: /api/threads (在 AppModule 设置 globalPrefix)
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ThreadsService } from "./threads.service";
import { CreateThreadDto } from "./dto/create-thread.dto";

@Controller("threads")
export class ThreadsController {
  constructor(
    /** NestJS 自动注入 ThreadsService */
    private readonly threadsService: ThreadsService
  ) {}

  /**
   * POST /api/threads
   * 创建新线程 (幂等，提供 id 时已存在则返回现有线程)
   */
  @Post()
  create(@Body() dto: CreateThreadDto) {
    return this.threadsService.create(dto);
  }

  /**
   * GET /api/threads
   * 获取所有线程列表
   */
  @Get()
  findAll() {
    return this.threadsService.findAll();
  }

  /**
   * GET /api/threads/:id
   * 查询特定线程
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.threadsService.findOne(id);
  }

  /**
   * PATCH /api/threads/:id
   * 更新线程元数据 (如标题)
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: { metadata: Record<string, unknown> }) {
    return this.threadsService.update(id, dto);
  }

  /**
   * DELETE /api/threads/:id
   * 删除线程及其所有数据
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content
  remove(@Param("id") id: string) {
    return this.threadsService.remove(id);
  }
}
