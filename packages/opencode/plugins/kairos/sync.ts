/**
 * Kairos context.md 同步逻辑。
 * 在 trade.journal 写入后自动更新 context.md。
 */

export interface JournalEntry {
  id: string
  symbol: string
  side: string
  price: number
  reason: string
}

/**
 * 检查 context 中是否已包含指定 journal ID。
 */
export function isDuplicateJournal(context: string | null, journalId: string): boolean {
  if (!context) return false
  return context.includes(journalId)
}

/**
 * 将 journal 摘要追加到 context.md 末尾。
 * 已存在的 journal ID 不重复追加。
 */
export function appendJournalToContext(context: string | null, entry: JournalEntry): string {
  const existing = context || ""

  if (isDuplicateJournal(existing, entry.id)) {
    return existing
  }

  const now = new Date().toISOString()
  const summary = [
    "",
    "---",
    `### 最近交易 — ${entry.id} — ${now}`,
    `- 品种: ${entry.symbol}`,
    `- 方向: ${entry.side}`,
    `- 入场价: ${entry.price}`,
    `- 理由: ${entry.reason}`,
  ].join("\n")

  return existing + summary
}
