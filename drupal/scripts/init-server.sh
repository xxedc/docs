#!/bin/bash
# 作用：全新服务器环境的一键初始化（仅需运行一次）
set -euo pipefail

echo "📦 [1/5] 开始安装基础系统依赖..."
apt update
apt install -y git rsync curl jq tar zip unzip

echo "📂 [2/5] 准备本地代码仓库目录..."
# 如果存在老目录，先清理掉
if [ -d "/opt/dc-repo" ]; then
    rm -rf /opt/dc-repo
fi
mkdir -p /opt/dc-repo

echo "📥 [3/5] 使用 Git Sparse-checkout 精准拉取 drupal 目录..."
git clone --filter=blob:none --no-checkout https://github.com/xxedc/docs.git /opt/dc-repo
cd /opt/dc-repo
git sparse-checkout init --cone
git sparse-checkout set drupal
git checkout main

echo "📁 [4/5] 创建服务器上需要的业务和备份文件夹..."
mkdir -p /var/backups/drupal11
mkdir -p /var/www/html/drupal11/web/themes/custom
mkdir -p /var/www/html/drupal11/web/modules/custom

echo "🔑 [5/5] 赋予脚本执行权限..."
chmod +x /opt/dc-repo/drupal/scripts/*.sh

echo "✅ 初始化全部完成！"
echo "👉 推荐操作：现在你可以执行 bash /opt/dc-repo/drupal/scripts/deploy.sh -n 来干跑测试一下部署流程了。"
