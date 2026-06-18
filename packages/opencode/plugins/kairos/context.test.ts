/**
 * kairos/context.ts 纯函数测试。
 *
 * 运行: cd packages/opencode && bun test plugins/kairos/context.test.ts
 */
import { describe, expect, test } from "bun:test"
import { buildSystemPrompt, formatMarketSnapshot, isContextStale, composeMethodology } from "./context"

// -------------------------------------------------------
// composeMethodology
// -------------------------------------------------------

describe("composeMethodology", () => {
  test("组合所有 main_trade 文件为完整方法论", () => {
    const spec = "# SPEC\n核心原则：风险第一"
    const framework = "# 分析框架\n1h 定方向，15m 找水平，5m 找信号"
    const plan = "# 交易计划模板\n入场价：[价格]"
    const review = "# 复盘模板\n对错归因：ABCDE"

    const result = composeMethodology({ spec, framework, plan, review })

    expect(result).toContain("核心原则：风险第一")
    expect(result).toContain("1h 定方向")
    expect(result).toContain("入场价：[价格]")
    expect(result).toContain("对错归因：ABCDE")
  })

  test("缺少某个文件时跳过该部分", () => {
    const result = composeMethodology({
      spec: "spec",
      framework: null,
      plan: null,
      review: "review",
    })

    expect(result).toContain("spec")
    expect(result).toContain("review")
    expect(result).not.toContain("分析框架")
  })

  test("全部为 null 时返回空字符串", () => {
    expect(composeMethodology({ spec: null, framework: null, plan: null, review: null })).toBe("")
  })
})

// -------------------------------------------------------
// formatMarketSnapshot
// -------------------------------------------------------

describe("formatMarketSnapshot", () => {
  test("格式化 Top 币种为表格文本", () => {
    const top20 = {
      updated_at: "2026-06-19T15:00:00Z",
      top: [
        { symbol: "BTCUSDT", last_price: 62609.8, change_24h_pct: -4.18 },
        { symbol: "ETHUSDT", last_price: 1684.84, change_24h_pct: -4.36 },
        { symbol: "BNBUSDT", last_price: 576.27, change_24h_pct: -4.89 },
      ],
    }

    const result = formatMarketSnapshot(top20)

    expect(result).toContain("BTCUSDT")
    expect(result).toContain("62609.8")
    expect(result).toContain("-4.18%")
    expect(result).toContain("ETHUSDT")
    expect(result).toContain("BNBUSDT")
  })

  test("top20 为 null 时返回 null", () => {
    expect(formatMarketSnapshot(null)).toBeNull()
  })

  test("top 数组为空时返回 null", () => {
    expect(formatMarketSnapshot({ updated_at: "", top: [] })).toBeNull()
  })
})

// -------------------------------------------------------
// isContextStale
// -------------------------------------------------------

describe("isContextStale", () => {
  test("刚更新的数据不过期", () => {
    expect(isContextStale(new Date().toISOString(), 10 * 60 * 1000)).toBe(false)
  })

  test("超过 maxAge 的数据过期", () => {
    const old = new Date(Date.now() - 20 * 60 * 1000).toISOString()
    expect(isContextStale(old, 10 * 60 * 1000)).toBe(true)
  })

  test("空字符串视为过期", () => {
    expect(isContextStale("", 10 * 60 * 1000)).toBe(true)
  })
})

// -------------------------------------------------------
// buildSystemPrompt
// -------------------------------------------------------

describe("buildSystemPrompt", () => {
  test("只有 methodology，无数据文件时只返回 methodology", () => {
    const result = buildSystemPrompt({
      methodology: "You are a trader",
      alerts: null,
      top20: null,
      contextMd: null,
      kairosDir: "/test/.kairos",
    })

    expect(result).toContain("You are a trader")
    expect(result).not.toContain("alerts.json")
  })

  test("有 alerts 时包含提醒信息", () => {
    const alerts = {
      updated_at: new Date().toISOString(),
      triggered: [
        { id: "a1", symbol: "BNBUSDT", price: 592, direction: "BELOW", message: "做空", triggered_at: "" },
      ],
      active: 3,
    }

    const result = buildSystemPrompt({
      methodology: "You are a trader",
      alerts,
      top20: null,
      contextMd: null,
      kairosDir: "/test/.kairos",
    })

    expect(result).toContain("BNBUSDT")
    expect(result).toContain("592")
  })

  test("有 context.md 时包含其内容", () => {
    const result = buildSystemPrompt({
      methodology: "You are a trader",
      alerts: null,
      top20: null,
      contextMd: "## 当前持仓\nBTCUSDT 多单 0.01",
      kairosDir: "/test/.kairos",
    })

    expect(result).toContain("BTCUSDT")
    expect(result).toContain("当前持仓")
  })

  test("top20 数据过期时标注过期", () => {
    const oldDate = new Date(Date.now() - 20 * 60 * 1000).toISOString()
    const top20 = {
      updated_at: oldDate,
      top: [{ symbol: "BTCUSDT", last_price: 62609.8, change_24h_pct: -4.18 }],
    }

    const result = buildSystemPrompt({
      methodology: "You are a trader",
      alerts: null,
      top20,
      contextMd: null,
      kairosDir: "/test/.kairos",
    })

    expect(result).toContain("过期")
  })

  test("全部数据都有时组合完整，context 在最前", () => {
    const alerts = {
      updated_at: new Date().toISOString(),
      triggered: [{ id: "a1", symbol: "ETHUSDT", price: 3500, direction: "ABOVE", message: "突破", triggered_at: "" }],
      active: 1,
    }
    const top20 = {
      updated_at: new Date().toISOString(),
      top: [{ symbol: "BTCUSDT", last_price: 62000, change_24h_pct: -1.5 }],
    }

    const result = buildSystemPrompt({
      methodology: "You are a trader",
      alerts,
      top20,
      contextMd: "持仓: BTC 多",
      kairosDir: "/test/.kairos",
    })

    expect(result).toContain("You are a trader")
    expect(result).toContain("ETHUSDT")
    expect(result).toContain("BTCUSDT")
    expect(result).toContain("持仓: BTC 多")
    // context 在最前面
    expect(result.indexOf("持仓: BTC 多")).toBeLessThan(result.indexOf("You are a trader"))
  })

  test("system prompt 包含 .kairos/ 绝对路径", () => {
    const result = buildSystemPrompt({
      methodology: "",
      alerts: null,
      top20: null,
      contextMd: null,
      kairosDir: "/Users/jasxu/Documents/Kairos/.kairos",
    })

    expect(result).toContain("/Users/jasxu/Documents/Kairos/.kairos")
  })
})
