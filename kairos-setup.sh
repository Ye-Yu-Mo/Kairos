#!/bin/bash
# Kairos 一键安装脚本
#
# 用法: bash kairos-setup.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo ""
echo "  █▀▀█ ▄▀▀▄ █▀▀█ █▀▀█ ▄▀▀▄ ▄▀▀▀"
echo "  █▀▀▄ █▀▀█  █▀  █▀▀▄ █▀▀█ █▀▀▄"
echo "  ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀"
echo "         AI 主观交易客户端"
echo ""

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
KAIROS_DIR="$PROJECT_DIR/.kairos"
OPENDIR="$PROJECT_DIR/packages/opencode/.opencode"
PLUGIN_DIR="$PROJECT_DIR/packages/opencode/plugins/kairos"

# ---------- 1. .kairos/ 目录 ----------
echo "==> 初始化 .kairos/ 目录"
mkdir -p "$KAIROS_DIR"

if [ ! -f "$KAIROS_DIR/context.md" ]; then
  cat > "$KAIROS_DIR/context.md" << 'EOF'
# Kairos 交易上下文

## 当前持仓
（待 AI 填写）

## 活跃提醒
（见 .kairos/alerts.json）

## 交易计划
（待 AI 填写）

## 经验教训
（待 AI 填写）
EOF
  echo -e "  ${GREEN}✓${NC} context.md 模板已创建"
else
  echo "  context.md 已存在，跳过"
fi

# ---------- 2. OpenCode 本地配置 ----------
echo "==> 配置 OpenCode"
mkdir -p "$OPENDIR"

cat > "$OPENDIR/opencode.jsonc" << EOF
{
  "\$schema": "https://opencode.ai/config.json",
  "plugin": ["$PLUGIN_DIR/index.js"],
  "permission": {
    "external_directory": "allow",
    "read": "allow",
    "glob": "allow",
    "bash": "allow"
  }
}
EOF
echo -e "  ${GREEN}✓${NC} opencode.jsonc 已配置"

# ---------- 3. 编译插件 ----------
echo "==> 编译 Kairos 插件"
cd "$PROJECT_DIR"
bun build "$PLUGIN_DIR/index.ts" --outdir="$PLUGIN_DIR/" --target=bun 2>/dev/null
echo -e "  ${GREEN}✓${NC} 插件已编译"

# ---------- 4. MCP 配置 ----------
echo "==> MCP Trade Server"
if [ -z "$KAIROS_TRADE_TOKEN" ]; then
  echo -e "  ${RED}⚠${NC}  KAIROS_TRADE_TOKEN 未设置"
  echo "  export KAIROS_TRADE_TOKEN=your-token"
  echo "  然后重新运行此脚本"
fi

if [ -z "$KAIROS_TRADE_URL" ]; then
  export KAIROS_TRADE_URL="http://185.239.224.208:8877"
  echo "  KAIROS_TRADE_URL 默认: $KAIROS_TRADE_URL"
fi

# ---------- 5. Provider 配置 ----------
echo "==> AI Provider"
if [ ! -f "$PROJECT_DIR/.opencode/opencode.jsonc" ]; then
  echo -e "  ${RED}⚠${NC}  请手动配置 .opencode/opencode.jsonc 中的 AI provider"
  echo "  参考: https://opencode.ai/docs"
else
  echo -e "  ${GREEN}✓${NC} .opencode/opencode.jsonc 已存在"
fi

echo ""
echo "==> 安装完成"
echo ""
echo "  启动交易会话:"
echo "    cd $PROJECT_DIR/packages/opencode"
echo "    bun run src/index.ts"
echo ""
echo "  后续步骤:"
echo "    1. 配置定时任务: bash script/setup-cron.sh"
echo "    2. 阅读交易方法论: main_trade/SPEC.md"
echo "    3. 阅读使用指南: KAIROS.md"
