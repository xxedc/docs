
#!/bin/bash
# =============================================================
# post-deploy-hooks.sh — 部署后自动执行（由 deploy.sh 调用）
# 功能：缓存预热 + Telegram 通知
# =============================================================
set -euo pipefail

# ── 变量 ──
SITE_URL="https://tlte.top"
# Telegram 通知（可选，设置环境变量即可启用）
TG_BOT_TOKEN="${TG_BOT_TOKEN:-}"
TG_CHAT_ID="${TG_CHAT_ID:-}"

# ── 颜色 ──
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info()    { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }

# ── 1. 缓存预热：curl 核心页面触发 Drupal 缓存生成 ──
log_info "开始缓存预热..."

# 需要预热的核心 URL 列表
WARM_URLS=(
    "${SITE_URL}/"
    "${SITE_URL}/videos"
    "${SITE_URL}/images"
    "${SITE_URL}/articles"
)

for url in "${WARM_URLS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time 15 \
        --user-agent "XedcCacheWarmer/1.0" \
        "$url" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        log_success "预热成功 [${HTTP_CODE}]: ${url}"
    else
        log_warn "预热失败 [${HTTP_CODE}]: ${url}（非致命，继续）"
    fi
done

log_success "缓存预热完成"

# ── 2. Telegram 通知（可选）──
if [ -n "$TG_BOT_TOKEN" ] && [ -n "$TG_CHAT_ID" ]; then
    log_info "发送 Telegram 部署通知..."

    DEPLOY_TIME=$(date '+%Y-%m-%d %H:%M:%S')
    COMMIT_HASH=$(cd /opt/dc-repo && git rev-parse --short HEAD 2>/dev/null || echo "unknown")

    MESSAGE="✅ *XEDC 部署成功*
🕐 时间：${DEPLOY_TIME}
🔗 Commit：\`${COMMIT_HASH}\`
🌐 站点：${SITE_URL}
📦 主题：xedc"

    curl -s -X POST \
        "https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TG_CHAT_ID}" \
        -d "text=${MESSAGE}" \
        -d "parse_mode=Markdown" \
        > /dev/null 2>&1 \
        && log_success "Telegram 通知已发送" \
        || log_warn "Telegram 通知发送失败（非致命）"
else
    log_warn "未配置 TG_BOT_TOKEN/TG_CHAT_ID，跳过 Telegram 通知"
    log_warn "如需启用：export TG_BOT_TOKEN=xxx TG_CHAT_ID=xxx"
fi

log_success "部署后钩子执行完毕"
