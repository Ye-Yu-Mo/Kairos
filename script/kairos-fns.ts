/**
 * Kairos 插件纯函数。
 * 不依赖 OpenCode 运行时，只依赖 Node.js 标准库。
 */

import { readFileSync, existsSync } from "node:fs"

/**
 * 从 .kairos/alerts.json 读取提醒数据。
 * 文件不存在或格式错误时返回 null。
 */
export function readAlertsFile(path: string): any | null {
  try {
    if (!existsSync(path)) return null
    const content = readFileSync(path, "utf-8")
    return JSON.parse(content)
  } catch {
    return null
  }
}

/**
 * 将提醒数据格式化为 system prompt 注入文本。
 * 无触发提醒时返回 null。
 */
export function formatAlertsForSystem(alerts: any): string | null {
  if (!alerts || !Array.isArray(alerts.triggered)) return null
  if (alerts.triggered.length === 0) return null

  const lines = alerts.triggered.map(
    (a: any) => `  • ${a.symbol} @ ${a.price} (${a.direction}): ${a.message}`,
  )

  return [
    "🔔 以下价格提醒已触发（来自项目根目录 .kairos/alerts.json）：",
    ...lines,
  ].join("\n")
}

/**
 * 检测工具调用是否为 order_oco。
 * MCP 工具 ID 格式: mcp_trade_order_oco
 */
export function isOcoCall(tool: string): boolean {
  return tool === "mcp_trade_order_oco" || tool.endsWith("_order_oco")
}
