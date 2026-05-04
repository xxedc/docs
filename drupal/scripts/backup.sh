#!/bin/bash
# 作用：打包当前数据库、用户上传的文件以及自定义代码
set -euo pipefail

DRUPAL_ROOT="/var/www/html/drupal11"
BACKUP_DIR="/var/backups/drupal11"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="backup-${TIMESTAMP}.tar.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# 动态判断 web 目录
if [ -d "${DRUPAL_ROOT}/web" ]; then
    WEB_ROOT="${DRUPAL_ROOT}/web"
else
    WEB_ROOT="${DRUPAL_ROOT}"
fi

# 判断 drush 路径
if [ -f "${DRUPAL_ROOT}/vendor/bin/drush" ]; then
    DRUSH="${DRUPAL_ROOT}/vendor/bin/drush"
else
    DRUSH="drush"
fi

echo "💾 开始打包备份..."

# 临时目录存数据库导出
TMP_DB="/tmp/drupal_db_${TIMESTAMP}.sql"
$DRUSH -r "$WEB_ROOT" sql-dump --result-file="$TMP_DB"

# 打包数据库、文件、主题、模块、配置
tar -czf "$BACKUP_PATH" \
    -C /tmp "drupal_db_${TIMESTAMP}.sql" \
    -C "$WEB_ROOT" "sites/default/files" "themes/custom" "modules/custom" \
    -C "$DRUPAL_ROOT" "config" 2>/dev/null || true

# 清理临时的 sql 文件
rm -f "$TMP_DB"

echo "✅ 备份完成：${BACKUP_PATH}"

# 清理旧备份，只保留最近 7 天的
echo "🧹 清理 7 天前的历史备份..."
find "$BACKUP_DIR" -type f -name "backup-*.tar.gz" -mtime +7 -exec rm -f {} \;
echo "✅ 清理完成！"
