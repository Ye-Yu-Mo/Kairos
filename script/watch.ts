#!/usr/bin/env bun
/**
 * Kairos 调度脚本 — 定时检查 MCP market.watch 触发提醒。
 *
 * 用法:
 *   bun run script/watch.ts          # 运行一次
 *   watch -n 120 script/watch.ts     # 每 120 秒运行一次 (macOS)
 *
 * 输出: .kairos/alerts.json
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js"
import { writeFileSync, existsSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { transformWatchResponse } from "./watch-fns"

/**
 * 从 .mcp.json 读取 MCP Server 配置。
 * 这里硬编码 mcp-trade 的配置，和 .mcp.json 保持一致。
 */
const MCP_SERVER_CONFIG = {
  command: "node",
  args: ["/Users/jasxu/Documents/mcp_trade/mcp-server/dist/index.js"],
}

const ALERTS_PATH = resolve(import.meta.dirname, "..", ".kairos", "alerts.json")

async function main() {
  // 确保 .kairos/ 目录存在
  const dir = dirname(ALERTS_PATH)
  if (!existsSync(dir)) {
    console.error(`[kairos-watch] Error: directory not found: ${dir}`)
    process.exit(1)
  }

  console.error(`[kairos-watch] Connecting to MCP server...`)

  const transport = new StdioClientTransport({
    command: MCP_SERVER_CONFIG.command,
    args: MCP_SERVER_CONFIG.args,
  })

  const client = new Client(
    { name: "kairos-watch", version: "0.1.0" },
    { capabilities: {} },
  )

  try {
    await client.connect(transport)

    const result = await client.callTool(
      { name: "market_watch", arguments: {} },
      CallToolResultSchema,
      { timeout: 30_000 },
    )

    if (result.isError) {
      const errText = result.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n")
      console.error(`[kairos-watch] MCP tool error: ${errText}`)
      process.exit(1)
    }

    // MCP 返回的 structuredContent 或 content[0].text 中解析 JSON
    let raw
    const textContent = result.content.find((c) => c.type === "text")
    if (textContent) {
      raw = JSON.parse(textContent.text)
    } else if (result.structuredContent) {
      raw = result.structuredContent
    } else {
      console.error("[kairos-watch] No content in MCP response")
      process.exit(1)
    }

    const alerts = transformWatchResponse(raw)
    writeFileSync(ALERTS_PATH, JSON.stringify(alerts, null, 2) + "\n")

    if (alerts.triggered.length > 0) {
      console.error(
        `[kairos-watch] ${alerts.triggered.length} alert(s) triggered:`,
        alerts.triggered.map((a) => `${a.symbol} @ ${a.price}`).join(", "),
      )
    } else {
      console.error(`[kairos-watch] No alerts triggered (${alerts.active} active)`)
    }

    await client.close()
    console.error(`[kairos-watch] Done. Wrote ${ALERTS_PATH}`)
  } catch (err) {
    console.error(`[kairos-watch] Failed:`, err instanceof Error ? err.message : String(err))
    // 不写空文件——如果之前有 alerts.json，保留旧数据
    if (client) {
      try { await client.close() } catch {}
    }
    process.exit(1)
  }
}

main()
