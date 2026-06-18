/**
 * watch.ts 的单元测试。
 * 测试 MCP market_watch 响应的解析逻辑，不依赖真实 MCP 连接。
 *
 * 运行: cd script && bun test watch.test.ts
 */
import { describe, expect, test } from "bun:test"
import { transformWatchResponse, safeFilename, type KairosAlerts } from "./watch-fns"

describe("transformWatchResponse", () => {
  test("解析 HTTP API 格式 {data: {triggered_alerts: [...]}}", () => {
    const raw = {
      data: {
        triggered_alerts: [
          { symbol: "BNBUSDT", price: 592.0, direction: "BELOW", message: "做空机会" },
          { symbol: "BTCUSDT", price: 95000, direction: "ABOVE", message: "突破阻力" },
        ],
      },
    }

    const result = transformWatchResponse(raw)

    expect(result.triggered).toHaveLength(2)
    expect(result.triggered[0].symbol).toBe("BNBUSDT")
    expect(result.triggered[0].price).toBe(592.0)
    expect(result.triggered[0].direction).toBe("BELOW")
    expect(result.updated_at).toBeString()
  })

  test("解析 MCP structuredContent 格式 {triggered_alerts: [...]}", () => {
    const raw = {
      triggered_alerts: [
        { symbol: "ETHUSDT", price: 3500, direction: "ABOVE", message: "突破" },
      ],
    }

    const result = transformWatchResponse(raw)

    expect(result.triggered).toHaveLength(1)
    expect(result.triggered[0].symbol).toBe("ETHUSDT")
  })

  test("null 的 triggered_alerts 转为空数组", () => {
    const raw = {
      data: {
        triggered_alerts: null,
      },
    }

    const result = transformWatchResponse(raw)

    expect(result.triggered).toEqual([])
  })

  test("无触发提醒时返回空数组", () => {
    const raw = {
      data: {
        triggered_alerts: [],
      },
    }

    const result = transformWatchResponse(raw)

    expect(result.triggered).toEqual([])
  })

  test("raw 为 null 时抛出错误", () => {
    expect(() => transformWatchResponse(null)).toThrow()
  })
})

describe("safeFilename", () => {
  test("普通字符串不变", () => {
    expect(safeFilename("mcp_trade_market_watch")).toBe("mcp_trade_market_watch")
  })

  test("替换路径遍历字符", () => {
    expect(safeFilename("../../../etc/passwd")).not.toContain("/")
    expect(safeFilename("../../../etc/passwd")).not.toContain("..")
  })

  test("空字符串返回自身", () => {
    expect(safeFilename("")).toBe("")
  })
})
