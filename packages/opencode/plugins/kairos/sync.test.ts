/**
 * kairos/sync.ts 纯函数测试。
 *
 * 运行: cd packages/opencode && bun test plugins/kairos/sync.test.ts
 */
import { describe, expect, test } from "bun:test"
import { appendJournalToContext, isDuplicateJournal } from "./sync"

// -------------------------------------------------------
// isDuplicateJournal
// -------------------------------------------------------

describe("isDuplicateJournal", () => {
  test("已存在的 journal ID 返回 true", () => {
    const context = "### 最近交易 — journal_abc123\n- 品种: BTCUSDT"
    expect(isDuplicateJournal(context, "journal_abc123")).toBe(true)
  })

  test("不存在的 journal ID 返回 false", () => {
    const context = "### 最近交易 — journal_abc123\n- 品种: BTCUSDT"
    expect(isDuplicateJournal(context, "journal_xyz789")).toBe(false)
  })

  test("空 context 返回 false", () => {
    expect(isDuplicateJournal("", "journal_001")).toBe(false)
    expect(isDuplicateJournal(null as any, "journal_001")).toBe(false)
  })
})

// -------------------------------------------------------
// appendJournalToContext
// -------------------------------------------------------

describe("appendJournalToContext", () => {
  test("追加 journal 摘要到 context 末尾", () => {
    const existing = "# 交易上下文\n## 当前持仓\n无"
    const entry = {
      id: "journal_001",
      symbol: "BTCUSDT",
      side: "SHORT",
      price: 63100,
      reason: "反弹到 R1 被拒绝，Pinbar 确认",
    }

    const result = appendJournalToContext(existing, entry)

    expect(result).toContain(existing) // 原有内容保留
    expect(result).toContain("journal_001")
    expect(result).toContain("BTCUSDT")
    expect(result).toContain("SHORT")
    expect(result).toContain("63100")
    expect(result).toContain("反弹到 R1")
  })

  test("空 context 时创建新内容", () => {
    const entry = {
      id: "journal_002",
      symbol: "ETHUSDT",
      side: "LONG",
      price: 3500,
      reason: "支撑位反弹",
    }

    const result = appendJournalToContext("", entry)

    expect(result).toContain("journal_002")
    expect(result).toContain("ETHUSDT")
    expect(result).not.toBe("")
  })

  test("重复 journal ID 返回原内容不变", () => {
    const existing = "### 最近交易 — journal_003\n- 品种: BTCUSDT\n- 方向: LONG"
    const entry = {
      id: "journal_003",
      symbol: "BTCUSDT",
      side: "LONG",
      price: 62000,
      reason: "重复",
    }

    const result = appendJournalToContext(existing, entry)

    expect(result).toBe(existing) // 完全不变
  })

  test("追加后的内容保留原有格式", () => {
    const existing = "# Kairos 交易上下文\n\n## 当前持仓\n无\n\n## 交易计划\n等待信号"
    const entry = {
      id: "journal_004",
      symbol: "BNBUSDT",
      side: "SHORT",
      price: 590,
      reason: "跌破支撑",
    }

    const result = appendJournalToContext(existing, entry)

    // 原有内容在开头
    expect(result.startsWith(existing)).toBe(true)
    // 新内容用分隔线隔开
    expect(result).toContain("---\n")
    // 新内容包含 journal ID
    expect(result).toContain("journal_004")
  })
})
