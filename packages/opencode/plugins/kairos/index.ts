/**
 * Kairos 交易插件。
 *
 * 功能:
 * 1. 注入交易员角色 + 上次上下文 + 提醒 + 市场快照
 * 2. 后续 M3 扩展: 工具拦截（order.place / order.oco）
 */
import type { Hooks, PluginInput, PluginOptions } from "@opencode-ai/plugin"
import { resolve } from "node:path"
import { readFileSync, existsSync } from "node:fs"
import { composeMethodology, buildSystemPrompt, type KairosAlerts, type Top20Data } from "./context"

const KAIROS_DIR = resolve(import.meta.dirname, "..", "..", "..", "..", ".kairos")
const MAIN_TRADE_DIR = resolve(import.meta.dirname, "..", "..", "..", "..", "main_trade")

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

const server = async (_input: PluginInput, _options?: PluginOptions): Promise<Hooks> => {
  const alertsPath = resolve(KAIROS_DIR, "alerts.json")
  const top20Path = resolve(KAIROS_DIR, "top20.json")
  const contextPath = resolve(KAIROS_DIR, "context.md")

  // 读取 main_trade 交易方法论
  const methodology = composeMethodology({
    spec: readText(resolve(MAIN_TRADE_DIR, "SPEC.md")),
    framework: readText(resolve(MAIN_TRADE_DIR, "analysis-framework.md")),
    plan: readText(resolve(MAIN_TRADE_DIR, "trade-plan-template.md")),
    review: readText(resolve(MAIN_TRADE_DIR, "review-template.md")),
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
      })

      output.system.unshift(prompt)
    },
  }
}

export default { id: "kairos", server }
