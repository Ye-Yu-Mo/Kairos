#!/usr/bin/env bun
/**
 * Kairos 调度脚本 — 定时获取市场 Top 20 行情。
 *
 * 用法:
 *   bun run script/scanner.ts --once     # 运行一次
 *   bun run script/scanner.ts --daemon   # 持续轮询（每 5 分钟）
 */

import { writeFileSync, existsSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { parseScannerResponse } from "./scanner-fns"

const TRADING_URL = process.env.KAIROS_TRADE_URL || "http://185.239.224.208:8877"
const AUTH_TOKEN = process.env.KAIROS_TRADE_TOKEN || ""
const TOP20_PATH = resolve(import.meta.dirname, "..", ".kairos", "top20.json")
const TOP_N = 20
const INTERVAL_MS = 5 * 60 * 1000

async function fetchTop20(): Promise<void> {
  const dir = dirname(TOP20_PATH)
  if (!existsSync(dir)) {
    console.error("[kairos-scanner] Error: .kairos/ directory not found")
    process.exit(1)
  }

  try {
    const res = await fetch(`${TRADING_URL}/api/v1/market/scanner`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    })

    if (!res.ok) {
      console.error(`[kairos-scanner] HTTP ${res.status}`)
      return
    }

    const raw = await res.json()
    const data = parseScannerResponse(raw, TOP_N)
    writeFileSync(TOP20_PATH, JSON.stringify(data, null, 2) + "\n")

    console.error(`[kairos-scanner] Updated top ${data.top.length} coins`)
  } catch (err) {
    console.error(`[kairos-scanner] Failed:`, err instanceof Error ? err.message : String(err))
  }
}

const mode = process.argv.includes("--daemon") ? "daemon" : "once"

if (mode === "daemon") {
  console.error(`[kairos-scanner] Starting daemon mode (every ${INTERVAL_MS / 1000}s)`)
  fetchTop20()
  setInterval(fetchTop20, INTERVAL_MS)
} else {
  fetchTop20()
}
