#!/bin/bash
# 网站导入脚本 (运行于新服务器)

# === 请先修改这里的数据库密码 ===
DB_PASS="9999zhen"
DB_NAME="drupal"
BACKUP_NAME="/root/drupal_full_backup.tar.gz"

echo "📂 1/4 正在解压网站数据到正确位置..."
tar -xzvf $BACKUP_NAME -C /

echo "🗄️ 2/4 正在重建数据库并导入数据..."
mysql -u root -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
mysql -u root -p"$DB_PASS" $DB_NAME < /root/drupal_db.sql

echo "🔐 3/4 正在修复网站权限..."
chown -R www-data:www-data /var/www/html/drupal11

echo "🧹 4/4 正在清理系统缓存并删除临时文件..."
cd /var/www/html/drupal11
./vendor/bin/drush cr
rm /root/drupal_db.sql

echo "✅ 恢复完成！你的网站代码和数据已经原封不动地安家了！"
