/**
 * 记忆控制器
 * 提供记忆 CRUD REST API
 * 路由前缀: /api/memory
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { MemoryService } from "./memory.service";

@Controller("memory")
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  /** GET /api/memory - 获取所有记忆 */
  @Get()
  findAll() {
    return { facts: this.memoryService.findAll() };
  }

  /** POST /api/memory/facts - 创建记忆 */
  @Post("facts")
  create(@Body() dto: { key: string; value: string; tags?: string[] }) {
    return this.memoryService.create(dto);
  }

  /** PUT /api/memory/facts/:id - 更新记忆 */
  @Put("facts/:id")
  update(
    @Param("id") id: string,
    @Body() dto: { key?: string; value?: string; tags?: string[] }
  ) {
    return this.memoryService.update(id, dto);
  }

  /** DELETE /api/memory/facts/:id - 删除记忆 */
  @Delete("facts/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.memoryService.remove(id);
  }

  /** DELETE /api/memory - 清空所有记忆 */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  clear() {
    return this.memoryService.clear();
  }
}
