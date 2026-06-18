/**
 * scanner-fns 纯函数测试。
 *
 * 运行: cd script && bun test scanner-fns.test.ts
 */
import { describe, expect, test } from "bun:test"

// RED 阶段 — 源文件不存在
import { parseScannerResponse, type Top20Data } from "./scanner-fns"

describe("parseScannerResponse", () => {
  test("正常解析 scanner API 响应，提取 Top N", () => {
    const raw = {
      data: [
        { symbol: "BTCUSDT", last_price: 62609.8, change_24h_pct: -4.18, volume_24h: 770122, quote_volume_24h: 49128404402 },
        { symbol: "ETHUSDT", last_price: 1684.84, change_24h_pct: -4.36, volume_24h: 23415743, quote_volume_24h: 40592331611 },
        { symbol: "XRPUSDT", last_price: 1.1416, change_24h_pct: -5.38, volume_24h: 33858956316, quote_volume_24h: 39355084830 },
      ],
    }

    const result = parseScannerResponse(raw, 3)

    expect(result.top).toHaveLength(3)
    expect(result.top[0].symbol).toBe("BTCUSDT")
    expect(result.top[0].last_price).toBe(62609.8)
    expect(result.top[0].change_24h_pct).toBe(-4.18)
    expect(result.updated_at).toBeString()
  })

  test("数据按 quote_volume_24h 降序排列", () => {
    const raw = {
      data: [
        { symbol: "SMALL", last_price: 1, change_24h_pct: 0, volume_24h: 1, quote_volume_24h: 100 },
        { symbol: "BIG", last_price: 1, change_24h_pct: 0, volume_24h: 1, quote_volume_24h: 1000 },
        { symbol: "MID", last_price: 1, change_24h_pct: 0, volume_24h: 1, quote_volume_24h: 500 },
      ],
    }

    const result = parseScannerResponse(raw, 3)

    expect(result.top[0].symbol).toBe("BIG")
    expect(result.top[1].symbol).toBe("MID")
    expect(result.top[2].symbol).toBe("SMALL")
  })

  test("limit 限制返回数量", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      symbol: `COIN${i}`,
      last_price: i,
      change_24h_pct: 0,
      volume_24h: 1,
      quote_volume_24h: 1000 - i,
    }))

    const result = parseScannerResponse({ data: items }, 20)

    expect(result.top).toHaveLength(20)
  })

  test("缺少 data 字段抛出错误", () => {
    expect(() => parseScannerResponse({}, 20)).toThrow()
    expect(() => parseScannerResponse(null as any, 20)).toThrow()
  })

  test("空数组返回空 top", () => {
    const result = parseScannerResponse({ data: [] }, 20)
    expect(result.top).toEqual([])
  })
})
