/**
 * Kairos watch 纯函数。
 * 解析 market.watch API 响应，提取触发提醒。
 */

export interface KairosAlerts {
  updated_at: string
  triggered: Array<{
    symbol: string
    price: number
    direction: string
    message: string
  }>
}

interface WatchData {
  triggered_alerts?: Array<{
    symbol: string
    price: number
    direction: string
    message: string
  }> | null
}

/**
 * 将 market.watch API 原始响应转换为 .kairos/alerts.json 格式。
 * 支持两种包裹格式: {data: {...}} (HTTP) 或直接 {...} (MCP structuredContent)
 */
export function transformWatchResponse(raw: { data?: WatchData; triggered_alerts?: any } | null): KairosAlerts {
  if (!raw) throw new Error("Invalid MCP response: null")

  const data = raw.data || raw
  const triggered = data.triggered_alerts || []

  if (!Array.isArray(triggered)) {
    throw new Error("Invalid MCP response: triggered_alerts is not an array")
  }

  return {
    updated_at: new Date().toISOString(),
    triggered: triggered.map((a: any) => ({
      symbol: a.symbol,
      price: a.price,
      direction: a.direction,
      message: a.message || "",
    })),
  }
}

/**
 * 移除路径遍历危险字符。
 */
export function safeFilename(name: string): string {
  return name.replace(/\.\./g, "").replace(/[\/\\]/g, "_")
}
