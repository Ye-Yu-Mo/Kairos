/**
 * kairos-fns 纯函数测试。
 *
 * 运行: cd script && bun test kairos-fns.test.ts
 */
import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from "node:fs"
import { resolve } from "node:path"
import { formatAlertsForSystem, isOcoCall, readAlertsFile } from "./kairos-fns"

const TEST_DIR = resolve(import.meta.dirname, "..", ".kairos")
const TEST_ALERTS = resolve(TEST_DIR, "alerts.json")

let oldContent: string | null = null

beforeEach(() => {
  if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true })
  if (existsSync(TEST_ALERTS)) {
    oldContent = require("fs").readFileSync(TEST_ALERTS, "utf-8")
  }
})

afterEach(() => {
  if (oldContent !== null) {
    writeFileSync(TEST_ALERTS, oldContent)
    oldContent = null
  } else if (existsSync(TEST_ALERTS)) {
    unlinkSync(TEST_ALERTS)
  }
})

// -------------------------------------------------------
// formatAlertsForSystem
// -------------------------------------------------------

describe("formatAlertsForSystem", () => {
  test("有触发提醒时返回格式化文本", () => {
    const alerts = {
      updated_at: "2026-06-19T14:30:00Z",
      triggered: [
        {
          id: "alert_001",
          symbol: "BNBUSDT",
          price: 592.0,
          direction: "BELOW",
          message: "BNB 跌破 592，做空机会",
          triggered_at: "2026-06-19T14:28:00Z",
        },
        {
          id: "alert_002",
          symbol: "BTCUSDT",
          price: 95000,
          direction: "ABOVE",
          message: "BTC 突破阻力",
          triggered_at: "2026-06-19T14:29:00Z",
        },
      ],
      active: 3,
    }

    const result = formatAlertsForSystem(alerts)

    expect(result).toContain("🔔")
    expect(result).toContain("BNBUSDT")
    expect(result).toContain("592")
    expect(result).toContain("做空机会")
    expect(result).toContain("BTCUSDT")
    expect(result).toContain("95000")
    expect(result).toContain("共 3 个活跃提醒")
  })

  test("无触发提醒时返回 null", () => {
    const alerts = { updated_at: "", triggered: [], active: 3 }
    expect(formatAlertsForSystem(alerts)).toBeNull()
  })

  test("alerts 为 null 时返回 null", () => {
    expect(formatAlertsForSystem(null)).toBeNull()
  })

  test("缺少 triggered 字段返回 null", () => {
    expect(formatAlertsForSystem({ updated_at: "", active: 0 })).toBeNull()
  })
})

// -------------------------------------------------------
// isOcoCall
// -------------------------------------------------------

describe("isOcoCall", () => {
  test("精确匹配 mcp_trade_order_oco", () => {
    expect(isOcoCall("mcp_trade_order_oco")).toBe(true)
  })

  test("不匹配其他工具", () => {
    expect(isOcoCall("mcp_trade_order_place")).toBe(false)
    expect(isOcoCall("mcp_trade_market_scanner")).toBe(false)
    expect(isOcoCall("read")).toBe(false)
  })

  test("空字符串返回 false", () => {
    expect(isOcoCall("")).toBe(false)
  })
})

// -------------------------------------------------------
// readAlertsFile
// -------------------------------------------------------

describe("readAlertsFile", () => {
  test("读取并解析 alerts.json", () => {
    const data = {
      updated_at: "2026-06-19T14:30:00Z",
      triggered: [{ id: "a1", symbol: "BTCUSDT", price: 95000, direction: "ABOVE", message: "test", triggered_at: "" }],
      active: 1,
    }
    writeFileSync(TEST_ALERTS, JSON.stringify(data))

    const result = readAlertsFile(TEST_ALERTS)

    expect(result).not.toBeNull()
    expect(result.triggered).toHaveLength(1)
    expect(result.triggered[0].symbol).toBe("BTCUSDT")
  })

  test("文件不存在时返回 null", () => {
    // 确保文件不存在
    if (existsSync(TEST_ALERTS)) unlinkSync(TEST_ALERTS)

    const result = readAlertsFile(TEST_ALERTS)
    expect(result).toBeNull()
  })

  test("文件内容非 JSON 时返回 null", () => {
    writeFileSync(TEST_ALERTS, "not valid json {{{")

    const result = readAlertsFile(TEST_ALERTS)
    expect(result).toBeNull()
  })
})
