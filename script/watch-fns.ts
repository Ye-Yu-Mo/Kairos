/**
 * Kairos watch 纯函数。
 * 不依赖任何外部包，可安全单元测试。
 */

interface McpWatchResponse {
  alerts?: Array<{
    id: string
    symbol: string
    price: number
    direction: string
    message: string
    triggered_at?: string
  }>
  active?: Array<{
    id: string
    symbol: string
    price: number
    direction: string
    message: string
  }>
}

export interface KairosAlerts {
  updated_at: string
  triggered: Array<{
    id: string
    symbol: string
    price: number
    direction: string
    message: string
    triggered_at: string
  }>
  active: number
}

/**
 * 将 MCP market_watch 原始响应转换为 .kairos/alerts.json 格式。
 */
export function transformWatchResponse(raw: McpWatchResponse): KairosAlerts {
  if (!raw || !Array.isArray(raw.alerts)) {
    throw new Error("Invalid MCP response: missing alerts array")
  }

  return {
    updated_at: new Date().toISOString(),
    triggered: (raw.alerts || []).map((a) => ({
      id: a.id,
      symbol: a.symbol,
      price: a.price,
      direction: a.direction,
      message: a.message,
      triggered_at: a.triggered_at || new Date().toISOString(),
    })),
    active: (raw.active || []).length,
  }
}

/**
 * 移除路径遍历危险字符。
 */
export function safeFilename(name: string): string {
  return name.replace(/\.\./g, "").replace(/[\/\\]/g, "_")
}
