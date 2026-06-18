/**
 * Kairos 工具拦截纯函数。
 * 工具名匹配 + 提醒消息生成。
 */

const TOOL_ORDER_PLACE = "mcp-trade_order_place"
const TOOL_ORDER_OCO = "mcp-trade_order_oco"
const TOOL_ORDER_CANCEL = "mcp-trade_order_cancel"
const TOOL_TRADE_JOURNAL = "mcp-trade_trade_journal"

export function isOrderPlace(tool: string): boolean {
  return tool === TOOL_ORDER_PLACE
}

export function isOrderOco(tool: string): boolean {
  return tool === TOOL_ORDER_OCO
}

export function isOrderCancel(tool: string): boolean {
  return tool === TOOL_ORDER_CANCEL
}

export function isTradeJournal(tool: string): boolean {
  return tool === TOOL_TRADE_JOURNAL
}

/**
 * 根据工具名生成 journal 提醒文本。
 * 不匹配返回 null。
 */
export function makeJournalReminder(tool: string): string | null {
  switch (tool) {
    case TOOL_ORDER_PLACE:
      return "\n\n⚠️ **别忘了：写 trade.journal(ENTRY) 记录入场理由**"

    case TOOL_ORDER_OCO:
      return "\n\n⚠️ **止盈止损已设。写 trade.journal 记录完整入场计划（止损/止盈/仓位）**"

    case TOOL_ORDER_CANCEL:
      return "\n\n⚠️ **订单已取消。写 trade.journal(REVIEW) 记录撤单原因**"

    default:
      return null
  }
}
