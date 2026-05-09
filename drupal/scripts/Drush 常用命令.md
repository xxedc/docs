# 进入 Drupal 根目录
cd /var/www/html/drupal11

# 清除缓存（最常用）
vendor/bin/drush cr

# 数据库更新
vendor/bin/drush updb -y

# 导出配置（后台改完后执行）
vendor/bin/drush cex -y

# 导入配置（从文件恢复）
vendor/bin/drush cim -y

# 启用模块
vendor/bin/drush en 模块名 -y

# 禁用模块
vendor/bin/drush pm-uninstall 模块名 -y

# 安装/切换主题
vendor/bin/drush theme:install xedc
vendor/bin/drush config:set system.theme default xedc -y

# 开启/关闭维护模式
vendor/bin/drush sset system.maintenance_mode 1 -y
vendor/bin/drush sset system.maintenance_mode 0 -y

# 备份数据库
vendor/bin/drush sql:dump > /tmp/db-$(date +%F).sql

# 创建测试用户
vendor/bin/drush user:create test --mail=t@t.com --password=test123

# 执行临时 PHP
vendor/bin/drush php:eval "echo drupal_get_installed_schema_version('node');"
