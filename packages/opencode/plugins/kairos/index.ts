/**
 * Kairos 交易插件。
 *
 * 功能:
 * 1. 注入交易员角色 + 上次上下文 + 提醒 + 市场快照
 * 2. 后续 M3 扩展: 工具拦截（order.place / order.oco）
 */
import type { Hooks, PluginInput, PluginOptions } from "@opencode-ai/plugin"
import { resolve } from "node:path"
import { readFileSync, existsSync, writeFileSync } from "node:fs"
import { composeMethodology, buildSystemPrompt, type KairosAlerts, type Top20Data } from "./context"
import { isOrderPlace, isOrderOco, isOrderCancel, isTradeJournal, makeJournalReminder } from "./hooks"
import { appendJournalToContext } from "./sync"

function readJson(path: string): any | null {
  try {
    if (!existsSync(path)) return null
    return JSON.parse(readFileSync(path, "utf-8"))
  } catch {
    return null
  }
}

function readText(path: string): string | null {
  try {
    if (!existsSync(path)) return null
    return readFileSync(path, "utf-8")
  } catch {
    return null
  }
}

/**
 * 向上查找包含指定子目录的根目录。
 * 从 CWD 开始，每次向上一级，直到找到 targetDir 或到达文件系统根。
 */
function findProjectRoot(cwd: string, targetDir: string): string | null {
  let dir = resolve(cwd)
  const root = resolve("/")
  while (dir !== root) {
    if (existsSync(resolve(dir, targetDir))) return dir
    dir = resolve(dir, "..")
  }
  return null
}

const server = async (input: PluginInput, _options?: PluginOptions): Promise<Hooks> => {
  // 从项目目录查找 .kairos/ 和 main_trade/
  const projectRoot = findProjectRoot(input.directory, ".kairos") || input.directory
  const kairosDir = resolve(projectRoot, ".kairos")
  const mainTradeDir = resolve(projectRoot, "main_trade")

  const alertsPath = resolve(kairosDir, "alerts.json")
  const top20Path = resolve(kairosDir, "top20.json")
  const contextPath = resolve(kairosDir, "context.md")

  // 读取 main_trade 交易方法论
  const methodology = composeMethodology({
    spec: readText(resolve(mainTradeDir, "SPEC.md")),
    framework: readText(resolve(mainTradeDir, "analysis-framework.md")),
    plan: readText(resolve(mainTradeDir, "trade-plan-template.md")),
    review: readText(resolve(mainTradeDir, "review-template.md")),
  })

  return {
    "experimental.chat.system.transform": async (_input, output) => {
      const alerts = readJson(alertsPath) as KairosAlerts | null
      const top20 = readJson(top20Path) as Top20Data | null
      const contextMd = readText(contextPath)

      const prompt = buildSystemPrompt({
        methodology,
        alerts,
        top20,
        contextMd,
        kairosDir,
      })

      output.system.unshift(prompt)
    },

    "tool.execute.after": async (input, output) => {
      // 交易日志 → 自动追加到 context.md
      if (isTradeJournal(input.tool)) {
        const args = input.args as any
        if (args?.entry_type === "ENTRY" || args?.reason) {
          const entry = {
            id: `journal_${Date.now()}`,
            symbol: args.symbol || "unknown",
            side: args.side || "unknown",
            price: args.price || 0,
            reason: args.reason || "",
          }
          const current = readText(contextPath)
          const updated = appendJournalToContext(current, entry)
          try { writeFileSync(contextPath, updated, "utf-8") } catch {}
        }
        return
      }

      // 入场/出场操作 → 提醒写 journal
      const reminder = makeJournalReminder(input.tool)
      if (reminder) {
        output.output = (output.output || "") + reminder
      }
    },
  }
}

export default { id: "kairos", server }
