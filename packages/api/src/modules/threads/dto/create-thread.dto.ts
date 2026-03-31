/**
 * 创建线程 DTO (Data Transfer Object)
 * 定义请求体的结构和验证规则
 */

export class CreateThreadDto {
  /** 可选的线程 ID，不提供则自动生成 UUID */
  id?: string;

  /** 线程初始元数据 */
  metadata?: {
    title?: string;
    model?: string;
    [key: string]: unknown;
  };
}
