# XEDC Drupal 命令速查手册

## 部署命令

```bash
# 初始化服务器（只需执行一次）
curl -sL https://raw.githubusercontent.com/xxedc/docs/main/drupal/scripts/init-server.sh | bash

# 干跑验证（不实际操作）
bash /opt/dc-repo/drupal/scripts/deploy.sh -n

# 正式部署
bash /opt/dc-repo/drupal/scripts/deploy.sh

# 回滚（交互式选择备份）
bash /opt/dc-repo/drupal/scripts/rollback.sh

# 回滚（自动选最新，跳过确认）
bash /opt/dc-repo/drupal/scripts/rollback.sh -y
#Drush 常用命令
