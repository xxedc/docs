#!/bin/bash
# 作用：列出最近的备份并提供一键还原，救砖专用
set -euo pipefail

BACKUP_DIR="/var/backups/drupal11"
DRUPAL_ROOT="/var/www/html/drupal11"

if [ -d "${DRUPAL_ROOT}/web" ]; then
    WEB_ROOT="${DRUPAL_ROOT}/web"
else
    WEB_ROOT="${DRUPAL_ROOT}"
fi

if [ -f "${DRUPAL_ROOT}/vendor/bin/drush" ]; then
    DRUSH="${DRUPAL_ROOT}/vendor/bin/drush"
else
    DRUSH="drush"
fi

echo "🛡️ 准备执行回滚操作..."

# 列出最近的 7 个备份
echo "请选择要回滚的备份文件序号："
# 使用 ls 按照时间倒序排列文件
mapfile -t BACKUPS < <(ls -1t "$BACKUP_DIR"/backup-*.tar.gz | head -n 7)

if [ ${#BACKUPS[@]} -eq 0 ]; then
    echo "❌ 没有找到任何备份文件，无法回滚！"
    exit 1
fi

for i in "${!BACKUPS[@]}"; do
    SIZE=$(du -h "${BACKUPS[$i]}" | cut -f1)
    BASENAME=$(basename "${BACKUPS[$i]}")
    echo "[$i] $BASENAME ($SIZE)"
done

# 如果带有 -y 参数，默认选择第 0 个（最新的）
TARGET_BACKUP=""
if [[ "${1:-}" == "-y" ]]; then
    echo "检测到自动回滚模式，默认使用最新备份..."
    TARGET_BACKUP="${BACKUPS[0]}"
else
    read -p "请输入序号 (默认直接回车选 0): " SELECTION
    SELECTION=${SELECTION:-0}
    TARGET_BACKUP="${BACKUPS[$SELECTION]}"
fi

if [ -z "$TARGET_BACKUP" ] || [ ! -f "$TARGET_BACKUP" ]; then
    echo "❌ 选择的备份无效！"
    exit 1
fi

echo "🚀 开始从 $TARGET_BACKUP 还原..."

# 创建临时解压目录
TMP_RESTORE="/tmp/drupal_restore_$(date +%s)"
mkdir -p "$TMP_RESTORE"
tar -xzf "$TARGET_BACKUP" -C "$TMP_RESTORE"

# 1. 还原数据库
DB_FILE=$(find "$TMP_RESTORE" -name "*.sql" | head -n 1)
if [ -f "$DB_FILE" ]; then
    echo "还原数据库..."
    $DRUSH -r "$WEB_ROOT" sql-cli < "$DB_FILE"
fi

# 2. 还原文件
echo "还原用户上传文件 (files)..."
rsync -av --delete "$TMP_RESTORE/sites/default/files/" "$WEB_ROOT/sites/default/files/"

echo "还原主题 (themes)..."
rsync -av --delete "$TMP_RESTORE/themes/custom/" "$WEB_ROOT/themes/custom/"

echo "还原模块 (modules)..."
rsync -av --delete "$TMP_RESTORE/modules/custom/" "$WEB_ROOT/modules/custom/"

if [ -d "$TMP_RESTORE/config" ]; then
    echo "还原配置 (config)..."
    rsync -av --delete "$TMP_RESTORE/config/" "$DRUPAL_ROOT/config/"
fi

# 3. 清理缓存
echo "🧹 重建缓存..."
$DRUSH -r "$WEB_ROOT" cr

# 清理临时文件
rm -rf "$TMP_RESTORE"

echo "✅ 回滚成功！网站已恢复至旧状态。"
