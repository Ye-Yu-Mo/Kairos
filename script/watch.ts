#!/usr/bin/env bun
/**
 * Kairos 调度脚本 — 定时检查 market.watch 触发提醒。
 *
 * 用法:
 *   bun run script/watch.ts --once     # 运行一次
 *   watch -n 120 script/watch.ts       # 每 120 秒运行一次 (macOS)
 *
 * 环境变量:
 *   KAIROS_TRADE_URL    Trading Server URL (默认 http://185.239.224.208:8877)
 *   KAIROS_TRADE_TOKEN  API Token
 */

import { writeFileSync, existsSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { transformWatchResponse } from "./watch-fns"

const TRADING_URL = process.env.KAIROS_TRADE_URL || "http://185.239.224.208:8877"
const AUTH_TOKEN = process.env.KAIROS_TRADE_TOKEN || ""

const ALERTS_PATH = resolve(import.meta.dirname, "..", ".kairos", "alerts.json")

async function main() {
  const dir = dirname(ALERTS_PATH)
  if (!existsSync(dir)) {
    console.error(`[kairos-watch] Error: directory not found: ${dir}`)
    process.exit(1)
  }

  if (!AUTH_TOKEN) {
    console.error("[kairos-watch] Error: KAIROS_TRADE_TOKEN not set")
    process.exit(1)
  }

  try {
    const res = await fetch(`${TRADING_URL}/api/v1/market/watch`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    })

    if (!res.ok) {
      console.error(`[kairos-watch] HTTP ${res.status}`)
      process.exit(1)
    }

    const raw = await res.json()
    const alerts = transformWatchResponse(raw.data || raw)
    writeFileSync(ALERTS_PATH, JSON.stringify(alerts, null, 2) + "\n")

    if (alerts.triggered.length > 0) {
      console.error(
        `[kairos-watch] ${alerts.triggered.length} alert(s) triggered:`,
        alerts.triggered.map((a: any) => `${a.symbol} @ ${a.price}`).join(", "),
      )
    } else {
      console.error(`[kairos-watch] No alerts triggered`)
    }
  } catch (err) {
    console.error(`[kairos-watch] Failed:`, err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

main()
