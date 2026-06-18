/**
 * Kairos scanner 纯函数。
 * 解析 market.scanner HTTP API 响应，提取 Top N 币种。
 */

export interface Top20Entry {
  symbol: string
  last_price: number
  change_24h_pct: number
}

export interface Top20Data {
  updated_at: string
  top: Top20Entry[]
}

interface ScannerRawItem {
  symbol: string
  last_price: number
  change_24h_pct: number
  quote_volume_24h: number
}

/**
 * 解析 scanner API 响应，按成交量降序排列，取 Top N。
 */
export function parseScannerResponse(raw: { data?: ScannerRawItem[] }, limit: number): Top20Data {
  if (!raw || !Array.isArray(raw.data)) {
    throw new Error("Invalid scanner response: missing data array")
  }

  const sorted = [...raw.data]
    .sort((a, b) => (b.quote_volume_24h || 0) - (a.quote_volume_24h || 0))
    .slice(0, limit)
    .map((item) => ({
      symbol: item.symbol,
      last_price: item.last_price,
      change_24h_pct: item.change_24h_pct,
    }))

  return {
    updated_at: new Date().toISOString(),
    top: sorted,
  }
}
