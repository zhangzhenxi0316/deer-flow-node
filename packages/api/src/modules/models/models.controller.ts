/**
 * 模型控制器
 * GET /api/models
 */

import { Controller, Get } from "@nestjs/common";
import { ModelsService } from "./models.service";

@Controller("models")
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  /** GET /api/models - 获取可用 LLM 模型列表 */
  @Get()
  async getModels() {
    const models = await this.modelsService.getModels();
    return { models };
  }
}
