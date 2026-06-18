/**
 * watch.ts 的单元测试。
 * 测试 MCP market_watch 响应的解析逻辑，不依赖真实 MCP 连接。
 *
 * 运行: cd script && bun test watch.test.ts
 */
import { describe, expect, test } from "bun:test"
import { transformWatchResponse, safeFilename } from "./watch-fns"

describe("transformWatchResponse", () => {
  test("有触发提醒时，返回 triggered 数组", () => {
    const raw = {
      alerts: [
        {
          id: "alert_001",
          symbol: "BNBUSDT",
          price: 592.0,
          direction: "BELOW",
          message: "BNB 跌破 592，做空机会",
          triggered_at: "2026-06-19T14:28:00Z",
        },
      ],
      active: [
        {
          id: "alert_002",
          symbol: "BTCUSDT",
          price: 95000,
          direction: "ABOVE",
          message: "BTC 突破 95000 做多",
        },
      ],
    }

    const result = transformWatchResponse(raw)

    expect(result.triggered).toHaveLength(1)
    expect(result.triggered[0].symbol).toBe("BNBUSDT")
    expect(result.triggered[0].price).toBe(592.0)
    expect(result.active).toBe(1)
    expect(result.updated_at).toBeString()
  })

  test("无触发提醒时，triggered 为空数组", () => {
    const raw = {
      alerts: [],
      active: [
        {
          id: "alert_003",
          symbol: "ETHUSDT",
          price: 3500,
          direction: "ABOVE",
          message: "ETH 突破",
        },
      ],
    }

    const result = transformWatchResponse(raw)

    expect(result.triggered).toEqual([])
    expect(result.active).toBe(1)
  })

  test("全部为空时，返回空结果", () => {
    const raw = {
      alerts: [],
      active: [],
    }

    const result = transformWatchResponse(raw)

    expect(result.triggered).toEqual([])
    expect(result.active).toBe(0)
  })

  test("缺少 alerts 字段时抛出错误", () => {
    const raw = {
      active: [],
    } as any

    expect(() => transformWatchResponse(raw)).toThrow()
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
