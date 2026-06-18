#!/bin/bash
# Kairos 定时任务安装脚本 (macOS launchd)
#
# 用法: bash script/setup-cron.sh

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WATCH_SCRIPT="$PROJECT_DIR/script/watch.ts"
SCANNER_SCRIPT="$PROJECT_DIR/script/scanner.ts"
PLIST_DIR="$HOME/Library/LaunchAgents"

echo "==> Kairos 定时任务安装"
echo "    项目目录: $PROJECT_DIR"

mkdir -p "$PLIST_DIR"

# watch — 每 2 分钟检查提醒
WATCH_PLIST="$PLIST_DIR/com.kairos.watch.plist"
cat > "$WATCH_PLIST" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.kairos.watch</string>
    <key>ProgramArguments</key>
    <array>
        <string>$HOME/.bun/bin/bun</string>
        <string>run</string>
        <string>$WATCH_SCRIPT</string>
        <string>--once</string>
    </array>
    <key>StartInterval</key>
    <integer>120</integer>
    <key>EnvironmentVariables</key>
    <dict>
        <key>KAIROS_TRADE_TOKEN</key>
        <string>${KAIROS_TRADE_TOKEN:-}</string>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/kairos-watch.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/kairos-watch.err</string>
</dict>
</plist>
PLIST

# scanner — 每 5 分钟刷新市场快照
SCANNER_PLIST="$PLIST_DIR/com.kairos.scanner.plist"
cat > "$SCANNER_PLIST" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.kairos.scanner</string>
    <key>ProgramArguments</key>
    <array>
        <string>$HOME/.bun/bin/bun</string>
        <string>run</string>
        <string>$SCANNER_SCRIPT</string>
        <string>--once</string>
    </array>
    <key>StartInterval</key>
    <integer>300</integer>
    <key>EnvironmentVariables</key>
    <dict>
        <key>KAIROS_TRADE_TOKEN</key>
        <string>${KAIROS_TRADE_TOKEN:-}</string>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/kairos-scanner.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/kairos-scanner.err</string>
</dict>
</plist>
PLIST

# 加载
launchctl unload "$WATCH_PLIST" 2>/dev/null || true
launchctl unload "$SCANNER_PLIST" 2>/dev/null || true
launchctl load "$WATCH_PLIST"
launchctl load "$SCANNER_PLIST"

echo "==> 完成"
echo "    watch:   每 2 分钟 → $WATCH_PLIST"
echo "    scanner: 每 5 分钟 → $SCANNER_PLIST"
echo ""
echo "    管理命令:"
echo "      launchctl list | grep kairos"
echo "      launchctl unload $WATCH_PLIST"
