#!/bin/bash
# =============================================================
# backup.sh — 部署前自动备份（保留最近7天）
# 用法：bash backup.sh
# =============================================================
set -euo pipefail

# ── 变量 ──
DRUPAL_ROOT="/var/www/html/drupal11"
BACKUP_DIR="/var/backups/drupal11"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
KEEP_DAYS=7

# 自动检测 web/ 子目录
if [ -d "${DRUPAL_ROOT}/web" ]; then
    WEB_ROOT="${DRUPAL_ROOT}/web"
else
    WEB_ROOT="${DRUPAL_ROOT}"
fi

# 自动检测 drush
if [ -f "${DRUPAL_ROOT}/vendor/bin/drush" ]; then
    DRUSH="${DRUPAL_ROOT}/vendor/bin/drush"
elif command -v drush &> /dev/null; then
    DRUSH=$(command -v drush)
else
    echo "❌ 找不到 drush" && exit 1
fi

# ── 颜色 ──
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info()    { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }

mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_PATH"

log_info "开始备份：${BACKUP_NAME}"

# ── 1. 备份数据库 ──
log_info "备份数据库..."
"$DRUSH" -r "$WEB_ROOT" sql:dump \
    --result-file="${BACKUP_PATH}/database.sql" \
    --gzip 2>/dev/null \
    || "$DRUSH" -r "$WEB_ROOT" sql-dump > "${BACKUP_PATH}/database.sql"
log_success "数据库备份完成"

# ── 2. 备份上传文件（仅最近修改的，加快速度）──
log_info "备份 files/ 目录..."
if [ -d "${WEB_ROOT}/sites/default/files" ]; then
    rsync -a --quiet \
        --exclude="*.tmp" \
        --exclude="css/" \
        --exclude="js/" \
        --exclude="php/" \
        "${WEB_ROOT}/sites/default/files/" \
        "${BACKUP_PATH}/files/"
    log_success "files/ 备份完成"
else
    log_warn "files/ 目录不存在，跳过"
fi

# ── 3. 备份配置 ──
log_info "备份配置..."
if [ -d "${DRUPAL_ROOT}/config/sync" ]; then
    cp -r "${DRUPAL_ROOT}/config/sync" "${BACKUP_PATH}/config-sync"
    log_success "配置备份完成"
else
    log_warn "config/sync/ 不存在，跳过"
fi

# ── 4. 备份自定义主题 ──
log_info "备份自定义主题..."
if [ -d "${WEB_ROOT}/themes/custom" ]; then
    cp -r "${WEB_ROOT}/themes/custom" "${BACKUP_PATH}/themes-custom"
    log_success "主题备份完成"
fi

# ── 5. 备份自定义模块 ──
log_info "备份自定义模块..."
if [ -d "${WEB_ROOT}/modules/custom" ]; then
    cp -r "${WEB_ROOT}/modules/custom" "${BACKUP_PATH}/modules-custom"
    log_success "模块备份完成"
fi

# ── 6. 打包 ──
log_info "打包备份文件..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}/"
rm -rf "${BACKUP_PATH}"
BACKUP_SIZE=$(du -sh "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)
log_success "备份包：${BACKUP_DIR}/${BACKUP_NAME}.tar.gz（大小：${BACKUP_SIZE}）"

# ── 7. 清理超过7天的备份 ──
log_info "清理 ${KEEP_DAYS} 天前的备份..."
find "$BACKUP_DIR" -name "backup-*.tar.gz" -mtime "+${KEEP_DAYS}" -delete
REMAINING=$(find "$BACKUP_DIR" -name "backup-*.tar.gz" | wc -l)
log_success "清理完成，当前保留 ${REMAINING} 个备份"
