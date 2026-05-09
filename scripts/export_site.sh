#!/bin/bash
# 网站导出脚本 (运行于旧服务器)

# === 请先修改这里的数据库密码 ===
DB_PASS="9999zhen"
DB_NAME="drupal"
WEB_DIR="/var/www/html/drupal11"
BACKUP_NAME="drupal_full_backup.tar.gz"

echo "🧹 1/3 开始导出数据库..."
mysqldump -u root -p"$DB_PASS" $DB_NAME > /root/drupal_db.sql

echo "📦 2/3 开始打包网站文件和数据库 (这可能需要几分钟)..."
cd /root
tar -czvf $BACKUP_NAME $WEB_DIR /root/drupal_db.sql

echo "🗑️ 3/3 清理临时文件..."
rm /root/drupal_db.sql

echo "✅ 搞定！你的网站全套行李已打包在：/root/$BACKUP_NAME"
