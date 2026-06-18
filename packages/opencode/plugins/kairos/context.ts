/**
 * Kairos 插件纯函数。
 * 不依赖 OpenCode 运行时，可独立单元测试。
 */

// -------------------------------------------------------
// 交易方法论组合
// -------------------------------------------------------

export interface MethodologyInput {
  spec: string | null
  framework: string | null
  plan: string | null
  review: string | null
}

/**
 * 将 main_trade 的交易方法论文件组合为完整 system prompt 角色定义。
 */
export function composeMethodology(input: MethodologyInput): string {
  const parts: string[] = []

  if (input.spec) parts.push(input.spec)
  if (input.framework) parts.push("\n---\n" + input.framework)
  if (input.plan) parts.push("\n---\n" + input.plan)
  if (input.review) parts.push("\n---\n" + input.review)

  return parts.join("\n")
}

// -------------------------------------------------------
// 类型
// -------------------------------------------------------

export interface KairosAlerts {
  updated_at: string
  triggered: Array<{
    id: string
    symbol: string
    price: number
    direction: string
    message: string
    triggered_at: string
  }>
  active: number
}

export interface Top20Entry {
  symbol: string
  last_price: number
  change_24h_pct: number
}

export interface Top20Data {
  updated_at: string
  top: Top20Entry[]
}

export interface BuildPromptInput {
  methodology: string
  alerts: KairosAlerts | null
  top20: Top20Data | null
  contextMd: string | null
}

// -------------------------------------------------------
// 纯函数
// -------------------------------------------------------

/**
 * 判断缓存数据是否过期。
 */
export function isContextStale(updatedAt: string, maxAgeMs: number): boolean {
  if (!updatedAt) return true
  const age = Date.now() - new Date(updatedAt).getTime()
  return age > maxAgeMs
}

/**
 * 将 Top20 市场快照格式化为文本。
 * 无数据或空数组返回 null。
 */
export function formatMarketSnapshot(top20: Top20Data | null): string | null {
  if (!top20 || !Array.isArray(top20.top) || top20.top.length === 0) return null

  const lines = top20.top.map((entry) => {
    const change = entry.change_24h_pct >= 0 ? `+${entry.change_24h_pct}` : `${entry.change_24h_pct}`
    return `  ${entry.symbol.padEnd(14)} ${String(entry.last_price).padStart(10)}  ${change}%`
  })

  return ["📊 市场快照 (Top 20):", ...lines].join("\n")
}

/**
 * 将提醒数据格式化为 system prompt 注入文本。
 * 无触发提醒时返回 null。
 */
export function formatAlertsText(alerts: KairosAlerts | null): string | null {
  if (!alerts || !Array.isArray(alerts.triggered)) return null
  if (alerts.triggered.length === 0) return null

  const lines = alerts.triggered.map(
    (a) => `  • ${a.symbol} @ ${a.price} (${a.direction}): ${a.message}`,
  )

  return [
    "🔔 以下价格提醒已触发：",
    ...lines,
    `  （共 ${alerts.active} 个活跃提醒未触发）`,
  ].join("\n")
}

/**
 * 组合完整的 system prompt 块。
 * 顺序: role → context → alerts → top20
 */
export function buildSystemPrompt(input: BuildPromptInput): string {
  const sections: string[] = [input.methodology]

  // 上次交易上下文
  if (input.contextMd) {
    sections.push("\n---\n## 上次交易上下文\n" + input.contextMd)
  }

  // 触发提醒
  if (input.alerts) {
    const text = formatAlertsText(input.alerts)
    if (text) sections.push("\n---\n" + text)
  }

  // 市场快照
  if (input.top20) {
    const stale = isContextStale(input.top20.updated_at, 10 * 60 * 1000)
    const header = stale ? "📊 市场快照 (⚠️ 数据可能过期):" : "📊 市场快照:"
    const body = formatMarketSnapshot(input.top20)
    if (body) {
      // 替换默认 header 为带过期标注的版本
      const withHeader = body.replace("📊 市场快照 (Top 20):", header)
      sections.push("\n---\n" + withHeader)
    }
  }

  return sections.join("\n")
}
