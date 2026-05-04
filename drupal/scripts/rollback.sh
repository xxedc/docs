#!/bin/bash
# =============================================================
# rollback.sh — 回滚到指定备份
# 用法：bash rollback.sh [-y 跳过确认]
# =============================================================
set -euo pipefail

# ── 变量 ──
DRUPAL_ROOT="/var/www/html/drupal11"
BACKUP_DIR="/var/backups/drupal11"
SKIP_CONFIRM=false

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

# 解析参数
if [[ "${1:-}" == "-y" ]]; then
    SKIP_CONFIRM=true
fi

# ── 颜色 ──
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info()    { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error()   { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ── 列出最近7个备份 ──
echo ""
echo -e "${BLUE}📦 可用备份列表（最近7个，时间倒序）:${NC}"
echo "──────────────────────────────────────────────"

# 获取备份列表（时间倒序）
mapfile -t BACKUPS < <(find "$BACKUP_DIR" -name "backup-*.tar.gz" | sort -r | head -7)

if [ ${#BACKUPS[@]} -eq 0 ]; then
    log_error "没有找到备份文件！"
fi

for i in "${!BACKUPS[@]}"; do
    BFILE="${BACKUPS[$i]}"
    BNAME=$(basename "$BFILE")
    BSIZE=$(du -sh "$BFILE" | cut -f1)
    BTIME=$(echo "$BNAME" | grep -oP '\d{8}-\d{6}' | sed 's/\(....\)\(..\)\(..\)-\(..\)\(..\)\(..\)/\1-\2-\3 \4:\5:\6/')
    printf "  ${YELLOW}[%d]${NC} %s  大小: %s  时间: %s\n" $((i+1)) "$BNAME" "$BSIZE" "$BTIME"
done

echo "──────────────────────────────────────────────"
echo ""

# ── 选择备份 ──
if [ "$SKIP_CONFIRM" = true ]; then
    CHOICE=1
    log_info "自动选择最新备份（序号 1）"
else
    read -r -p "请输入序号选择备份 [默认: 1]: " CHOICE
    CHOICE=${CHOICE:-1}
fi

# 验证输入
if ! [[ "$CHOICE" =~ ^[0-9]+$ ]] || [ "$CHOICE" -lt 1 ] || [ "$CHOICE" -gt ${#BACKUPS[@]} ]; then
    log_error "无效的序号：$CHOICE"
fi

SELECTED_BACKUP="${BACKUPS[$((CHOICE-1))]}"
SELECTED_NAME=$(basename "$SELECTED_BACKUP")
log_info "已选择备份：${SELECTED_NAME}"

# ── 二次确认 ──
if [ "$SKIP_CONFIRM" = false ]; then
    echo -e "${RED}⚠️  回滚将覆盖当前站点数据，此操作不可逆！${NC}"
    read -r -p "确认回滚？(输入 yes 继续): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        log_warn "已取消回滚"
        exit 0
    fi
fi

# ── 开始回滚 ──
RESTORE_TMP="/tmp/drupal-restore-$(date +%s)"
mkdir -p "$RESTORE_TMP"

log_info "解压备份文件..."
tar -xzf "$SELECTED_BACKUP" -C "$RESTORE_TMP"
BACKUP_CONTENT="${RESTORE_TMP}/$(ls "$RESTORE_TMP" | head -1)"

# ── 还原数据库 ──
log_info "还原数据库..."
if [ -f "${BACKUP_CONTENT}/database.sql.gz" ]; then
    gunzip -c "${BACKUP_CONTENT}/database.sql.gz" | "$DRUSH" -r "$WEB_ROOT" sql:cli
elif [ -f "${BACKUP_CONTENT}/database.sql" ]; then
    "$DRUSH" -r "$WEB_ROOT" sql:cli < "${BACKUP_CONTENT}/database.sql"
fi
log_success "数据库还原完成"

# ── 还原 files/ ──
log_info "还原 files/..."
if [ -d "${BACKUP_CONTENT}/files" ]; then
    rsync -a --delete \
        "${BACKUP_CONTENT}/files/" \
        "${WEB_ROOT}/sites/default/files/"
    log_success "files/ 还原完成"
fi

# ── 还原配置 ──
log_info "还原配置..."
if [ -d "${BACKUP_CONTENT}/config-sync" ]; then
    rsync -a "${BACKUP_CONTENT}/config-sync/" "${DRUPAL_ROOT}/config/sync/"
    log_success "配置还原完成"
fi

# ── 还原主题 ──
log_info "还原自定义主题..."
if [ -d "${BACKUP_CONTENT}/themes-custom" ]; then
    rsync -a --delete \
        "${BACKUP_CONTENT}/themes-custom/" \
        "${WEB_ROOT}/themes/custom/"
    log_success "主题还原完成"
fi

# ── 还原模块 ──
log_info "还原自定义模块..."
if [ -d "${BACKUP_CONTENT}/modules-custom" ]; then
    rsync -a --delete \
        "${BACKUP_CONTENT}/modules-custom/" \
        "${WEB_ROOT}/modules/custom/"
    log_success "模块还原完成"
fi

# ── 清除缓存 ──
log_info "清除缓存..."
"$DRUSH" -r "$WEB_ROOT" cr
log_success "缓存清除完成"

# ── 清理临时目录 ──
rm -rf "$RESTORE_TMP"

echo ""
log_success "============================================"
log_success "  回滚成功完成！"
log_success "  已回滚到：${SELECTED_NAME}"
log_success "============================================"
echo ""
