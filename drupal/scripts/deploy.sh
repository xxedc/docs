#!/bin/bash
# =============================================================
# deploy.sh — 核心部署脚本
# 用法：bash deploy.sh [-n 干跑模式]
# =============================================================
set -euo pipefail

# ── 顶部变量（所有路径在此定义）──
DRUPAL_ROOT="/var/www/html/drupal11"
REPO_DIR="/opt/dc-repo/drupal"
LOG_DIR="/var/log/drupal-deploy"
LOG_FILE="${LOG_DIR}/deploy-$(date +%Y%m%d-%H%M%S).log"
START_TIME=$(date +%s)

# 自动检测 web/ 子目录
if [ -d "${DRUPAL_ROOT}/web" ]; then
    WEB_ROOT="${DRUPAL_ROOT}/web"
else
    WEB_ROOT="${DRUPAL_ROOT}"
fi

# 自动检测 drush 路径
if [ -f "${DRUPAL_ROOT}/vendor/bin/drush" ]; then
    DRUSH="${DRUPAL_ROOT}/vendor/bin/drush"
elif command -v drush &> /dev/null; then
    DRUSH=$(command -v drush)
else
    echo "❌ 找不到 drush，请检查安装" && exit 1
fi

# ── 颜色输出 ──
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"; }
log_success() { echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"; }
log_warn()    { echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"; }
log_error()   { echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"; }

# ── 干跑模式检测 ──
DRY_RUN=false
if [[ "${1:-}" == "-n" ]]; then
    DRY_RUN=true
    echo -e "${YELLOW}🔍 干跑模式：不实际执行任何操作${NC}"
fi

run() {
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[干跑] $*${NC}"
    else
        "$@"
    fi
}

# ── 创建日志目录 ──
mkdir -p "$LOG_DIR"

# ── 失败时自动回滚 ──
on_error() {
    log_error "部署失败！正在自动回滚..."
    run "$REPO_DIR/scripts/rollback.sh" -y 2>/dev/null || true
    run "$DRUSH" -r "$WEB_ROOT" sset system.maintenance_mode 0 -y 2>/dev/null || true
    log_error "回滚完成，请检查日志：$LOG_FILE"
    exit 1
}
trap on_error ERR

# ── 开始部署 ──
echo "" | tee -a "$LOG_FILE"
log_info "============================================"
log_info "  XEDC Drupal 部署开始 $(date '+%Y-%m-%d %H:%M:%S')"
log_info "  Drupal 根：${WEB_ROOT}"
log_info "  仓库目录：${REPO_DIR}"
log_info "  Drush：${DRUSH}"
log_info "============================================"
echo "" | tee -a "$LOG_FILE"

# ── 步骤 1：开启维护模式 ──
log_info "步骤 1/10：开启维护模式..."
run "$DRUSH" -r "$WEB_ROOT" sset system.maintenance_mode 1 -y
log_success "维护模式已开启"

# ── 步骤 2：备份（失败则中止）──
log_info "步骤 2/10：执行备份..."
if ! run bash "${REPO_DIR}/scripts/backup.sh"; then
    log_error "备份失败，部署中止！"
    run "$DRUSH" -r "$WEB_ROOT" sset system.maintenance_mode 0 -y
    exit 1
fi
log_success "备份完成"

# ── 步骤 3：拉取最新代码 ──
log_info "步骤 3/10：拉取最新代码..."
cd "${REPO_DIR}/.."
run git pull origin main
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
log_success "代码已更新，当前 commit：${COMMIT_HASH}"

# ── 步骤 4：同步主题文件 ──
log_info "步骤 4/10：同步主题文件..."
if [ -d "${REPO_DIR}/themes" ]; then
    run rsync -av --delete \
        "${REPO_DIR}/themes/" \
        "${WEB_ROOT}/themes/custom/"
    log_success "主题文件同步完成"
else
    log_warn "themes/ 目录不存在，跳过"
fi

# ── 步骤 5：同步模块文件 ──
log_info "步骤 5/10：同步模块文件..."
if [ -d "${REPO_DIR}/modules" ]; then
    run rsync -av --delete \
        "${REPO_DIR}/modules/" \
        "${WEB_ROOT}/modules/custom/"
    log_success "模块文件同步完成"
else
    log_warn "modules/ 目录不存在，跳过"
fi

# ── 步骤 6：同步配置文件 ──
log_info "步骤 6/10：同步配置文件..."
if [ -d "${REPO_DIR}/config/sync" ]; then
    run rsync -av \
        "${REPO_DIR}/config/sync/" \
        "${DRUPAL_ROOT}/config/sync/"
    log_success "配置文件同步完成"
else
    log_warn "config/sync/ 目录不存在，跳过"
fi

# ── 步骤 7：数据库更新 ──
log_info "步骤 7/10：执行数据库更新..."
run "$DRUSH" -r "$WEB_ROOT" updb -y
log_success "数据库更新完成"

# ── 步骤 8：导入配置（config/sync 为空时跳过）──
log_info "步骤 8/10：导入配置..."
CONFIG_SYNC="${DRUPAL_ROOT}/config/sync"
CONFIG_COUNT=0
if [ -d "$CONFIG_SYNC" ]; then
    CONFIG_COUNT=$(find "$CONFIG_SYNC" -name "*.yml" | wc -l)
fi
if [ "$CONFIG_COUNT" -lt 5 ]; then
    log_warn "config/sync/ 文件不足（${CONFIG_COUNT} 个），跳过 cim"
else
    if ! run "$DRUSH" -r "$WEB_ROOT" cim -y 2>> "$LOG_FILE"; then
        log_warn "配置导入有警告，请检查日志"
    else
        log_success "配置导入完成"
    fi
fi



# ── 步骤 9：清除缓存 ──
log_info "步骤 9/10：清除缓存..."
run "$DRUSH" -r "$WEB_ROOT" cr
log_success "缓存已清除"

# ── 步骤 10：关闭维护模式 ──
log_info "步骤 10/10：关闭维护模式..."
run "$DRUSH" -r "$WEB_ROOT" sset system.maintenance_mode 0 -y
log_success "维护模式已关闭"

# ── 部署后钩子 ──
log_info "执行部署后钩子..."
run bash "${REPO_DIR}/scripts/post-deploy-hooks.sh" 2>> "$LOG_FILE" || log_warn "钩子执行有警告"

# ── 计算耗时 ──
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo "" | tee -a "$LOG_FILE"
log_success "============================================"
log_success "  部署成功完成！🎉"
log_success "  总耗时：${ELAPSED} 秒"
log_success "  Commit：${COMMIT_HASH}"
log_success "  日志：${LOG_FILE}"
log_success "============================================"
echo "" | tee -a "$LOG_FILE"
