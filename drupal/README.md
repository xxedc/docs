# Drupal 11 网站项目

这是 Drupal 11 项目的自定义代码和配置同步仓库。核心部署思路是：核心代码（Drupal Core 和 Contrib 模块）由 Composer 在服务器端管理，而本仓库只管理我们自己写的业务逻辑和UI。

## 目录结构说明

- `themes/` - 存放自定义主题（如 xedc）
- `modules/` - 存放自定义模块（如 xedc_core）
- `config/sync/` - 存放 Drupal 的 yml 配置导出文件
- `scripts/` - 存放自动化运维部署脚本
- `nginx/` - 存放 Nginx 的参考配置文件

## 部署流程

1. 本地修改代码或配置，通过 Git Push 推送到本仓库的 `main` 分支。
2. 手机打开 Termius 连接韩国 Vultr 服务器。
3. 执行 `/opt/dc-repo/drupal/scripts/deploy.sh` 即可自动备份并一键上线。
