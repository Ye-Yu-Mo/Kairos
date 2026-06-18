/**
 * Kairos M1 验证插件。
 *
 * 验证目标:
 * 1. experimental.chat.system.transform 能否读文件并注入 system prompt
 * 2. tool.execute.after 能否检测 MCP 工具调用
 *
 * 这是验证代码，不是生产代码。M1 通过后会重构或删除。
 *
 * 注册方式: 在 .opencode/opencode.jsonc 中添加:
 *   "plugin": ["./packages/opencode/plugins/kairos-smoke-test.ts"]
 */
import type { Hooks, PluginInput, PluginOptions } from "@opencode-ai/plugin"
import { resolve } from "node:path"
import { appendFileSync } from "node:fs"
import { readAlertsFile, formatAlertsForSystem, isOcoCall } from "../../../script/kairos-fns"

const ALERTS_PATH = resolve(import.meta.dirname, "..", "..", "..", ".kairos", "alerts.json")
const LOG_PATH = resolve(import.meta.dirname, "..", "..", "..", ".kairos", "plugin.log")

function log(msg: string) {
  try {
    appendFileSync(LOG_PATH, `[${new Date().toISOString()}] ${msg}\n`)
  } catch {
    // 文件写不了也不炸
  }
}

const server = async (_input: PluginInput, _options?: PluginOptions): Promise<Hooks> => {
  log("Plugin loaded — kairos-smoke-test")

  return {
    /**
     * 验证点 A: system.transform Hook
     */
    "experimental.chat.system.transform": async (_input, output) => {
      log("system.transform called")
      const alerts = readAlertsFile(ALERTS_PATH)
      if (!alerts) {
        log("system.transform: no alerts file, skipping")
        return
      }

      const text = formatAlertsForSystem(alerts)
      if (!text) {
        log("system.transform: alerts file empty, skipping")
        return
      }

      output.system.push(text)
      log(`system.transform: injected alerts (${alerts.triggered.length} triggered)`)
    },

    /**
     * 验证点 B: tool.execute.after Hook
     */
    "tool.execute.after": async (input, _output) => {
      if (isOcoCall(input.tool)) {
        log(`tool.execute.after: detected OCO! tool=${input.tool} sessionID=${input.sessionID}`)
      }
    },
  }
}

export default { id: "kairos-smoke-test", server }
