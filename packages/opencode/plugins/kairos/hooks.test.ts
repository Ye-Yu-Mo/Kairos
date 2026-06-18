/**
 * kairos/hooks.ts 纯函数测试。
 *
 * 运行: cd packages/opencode && bun test plugins/kairos/hooks.test.ts
 */
import { describe, expect, test } from "bun:test"
import { isOrderPlace, isOrderOco, isOrderCancel, isTradeJournal, makeJournalReminder } from "./hooks"

// -------------------------------------------------------
// 工具名匹配
// -------------------------------------------------------

describe("isOrderPlace", () => {
  test("匹配 mcp-trade_order_place", () => {
    expect(isOrderPlace("mcp-trade_order_place")).toBe(true)
  })

  test("不匹配其他工具", () => {
    expect(isOrderPlace("mcp-trade_order_oco")).toBe(false)
    expect(isOrderPlace("mcp-trade_market_scanner")).toBe(false)
    expect(isOrderPlace("read")).toBe(false)
  })

  test("空字符串返回 false", () => {
    expect(isOrderPlace("")).toBe(false)
  })
})

describe("isOrderOco", () => {
  test("匹配 mcp-trade_order_oco", () => {
    expect(isOrderOco("mcp-trade_order_oco")).toBe(true)
  })

  test("不匹配 order_place", () => {
    expect(isOrderOco("mcp-trade_order_place")).toBe(false)
  })
})

describe("isOrderCancel", () => {
  test("匹配 mcp-trade_order_cancel", () => {
    expect(isOrderCancel("mcp-trade_order_cancel")).toBe(true)
  })
})

describe("isTradeJournal", () => {
  test("匹配 mcp-trade_trade_journal", () => {
    expect(isTradeJournal("mcp-trade_trade_journal")).toBe(true)
  })

  test("不匹配 journal_list", () => {
    expect(isTradeJournal("mcp_trade_trade_journal_list")).toBe(false)
  })
})

// -------------------------------------------------------
// 提醒消息生成
// -------------------------------------------------------

describe("makeJournalReminder", () => {
  test("order_place 提醒写 ENTRY", () => {
    const result = makeJournalReminder("mcp-trade_order_place")
    expect(result).toContain("trade.journal")
    expect(result).toContain("ENTRY")
    expect(result).toContain("⚠️")
  })

  test("order_oco 提醒记录计划", () => {
    const result = makeJournalReminder("mcp-trade_order_oco")
    expect(result).toContain("trade.journal")
    expect(result).toContain("止盈止损")
  })

  test("order_cancel 提醒写 REVIEW", () => {
    const result = makeJournalReminder("mcp-trade_order_cancel")
    expect(result).toContain("REVIEW")
    expect(result).toContain("撤单")
  })

  test("未知工具返回 null", () => {
    expect(makeJournalReminder("mcp-trade_market_scanner")).toBeNull()
  })

  test("空字符串返回 null", () => {
    expect(makeJournalReminder("")).toBeNull()
  })
})
