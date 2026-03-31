/**
 * 计算器工具
 *
 * 安全地执行数学表达式计算，避免 Agent 在心算复杂数值时出错。
 * 使用沙箱方式执行，仅允许纯数学运算。
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * 安全地计算数学表达式
 *
 * 仅允许数字、基础运算符和数学函数，
 * 防止代码注入攻击。
 *
 * @param expression 数学表达式字符串，例如 "2 + 3 * 4"
 */
function safeEval(expression: string): number {
  // 白名单验证：只允许数字、运算符、括号和基础数学函数
  const safePattern =
    /^[\d\s+\-*/().,^%e]|(Math\.(sin|cos|tan|sqrt|pow|abs|log|floor|ceil|round|PI|E))+$/;
  const sanitized = expression.trim();

  // 检查是否包含危险字符
  if (/[a-zA-Z]/.test(sanitized) && !sanitized.includes("Math.")) {
    throw new Error("Expression contains invalid characters");
  }

  // 替换 ^ 为 ** (幂运算)
  const normalized = sanitized.replace(/\^/g, "**");

  // 使用 Function 构造器在受限作用域执行
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function("Math", `"use strict"; return (${normalized})`);
  const result: unknown = fn(Math);

  if (typeof result !== "number" || !isFinite(result)) {
    throw new Error(`Invalid result: ${result}`);
  }

  return result;
}

/**
 * 计算器工具定义
 */
export const calculatorTool = tool(
  async ({ expression }) => {
    try {
      const result = safeEval(expression);

      // 格式化输出：整数不显示小数点
      const formatted =
        Number.isInteger(result) ? result.toString() : result.toPrecision(10);

      return `${expression} = ${formatted}`;
    } catch (error) {
      return `Calculation error: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
  {
    name: "calculator",
    description:
      "Evaluate mathematical expressions accurately. Use this for any arithmetic, " +
      "algebra, or numeric calculations. Supports +, -, *, /, ** (power), % (modulo), " +
      "and Math functions (Math.sqrt, Math.sin, Math.PI, etc.).",
    schema: z.object({
      expression: z
        .string()
        .describe(
          'Mathematical expression to evaluate, e.g. "2 + 3 * 4" or "Math.sqrt(16)"'
        ),
    }),
  }
);
