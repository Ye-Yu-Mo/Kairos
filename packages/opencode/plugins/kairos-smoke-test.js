// @bun
// plugins/kairos-smoke-test.ts
import { resolve } from "path";
import { appendFileSync } from "fs";

// ../../script/kairos-fns.ts
import { readFileSync, existsSync } from "fs";
function readAlertsFile(path) {
  try {
    if (!existsSync(path))
      return null;
    const content = readFileSync(path, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}
function formatAlertsForSystem(alerts) {
  if (!alerts || !Array.isArray(alerts.triggered))
    return null;
  if (alerts.triggered.length === 0)
    return null;
  const lines = alerts.triggered.map((a) => `  \u2022 ${a.symbol} @ ${a.price} (${a.direction}): ${a.message}`);
  return [
    "\uD83D\uDD14 \u4EE5\u4E0B\u4EF7\u683C\u63D0\u9192\u5DF2\u89E6\u53D1\uFF08\u6765\u81EA\u9879\u76EE\u6839\u76EE\u5F55 .kairos/alerts.json\uFF09\uFF1A",
    ...lines,
    `  \uFF08\u5171 ${alerts.active} \u4E2A\u6D3B\u8DC3\u63D0\u9192\u672A\u89E6\u53D1\uFF09`
  ].join(`
`);
}
function isOcoCall(tool) {
  return tool === "mcp_trade_order_oco" || tool.endsWith("_order_oco");
}

// plugins/kairos-smoke-test.ts
var ALERTS_PATH = resolve(import.meta.dirname, "..", "..", "..", ".kairos", "alerts.json");
var LOG_PATH = resolve(import.meta.dirname, "..", "..", "..", ".kairos", "plugin.log");
function log(msg) {
  try {
    appendFileSync(LOG_PATH, `[${new Date().toISOString()}] ${msg}
`);
  } catch {}
}
var server = async (_input, _options) => {
  log("Plugin loaded \u2014 kairos-smoke-test");
  return {
    "experimental.chat.system.transform": async (_input2, output) => {
      log("system.transform called");
      const alerts = readAlertsFile(ALERTS_PATH);
      if (!alerts) {
        log("system.transform: no alerts file, skipping");
        return;
      }
      const text = formatAlertsForSystem(alerts);
      if (!text) {
        log("system.transform: alerts file empty, skipping");
        return;
      }
      output.system.push(text);
      log(`system.transform: injected alerts (${alerts.triggered.length} triggered)`);
    },
    "tool.execute.after": async (input, _output) => {
      if (isOcoCall(input.tool)) {
        log(`tool.execute.after: detected OCO! tool=${input.tool} sessionID=${input.sessionID}`);
      }
    }
  };
};
var kairos_smoke_test_default = { id: "kairos-smoke-test", server };
export {
  kairos_smoke_test_default as default
};
