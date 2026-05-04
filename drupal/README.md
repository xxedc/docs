# XEDC Drupal 11 主题工程

## 项目信息
- 站点地址：tlte.top
- Drupal 根：/var/www/html/drupal11/web/
- 主题名：xedc（themes/custom/xedc）
- 自定义模块：xedc_core（modules/custom/xedc_core）
- GitHub 仓库：github.com/xxedc/docs（代码放 drupal/ 子目录）

## 目录结构
drupal/
├── themes/
│   └── xedc/           # 自定义主题（阶段1产出）
├── modules/
│   └── xedc_core/      # 自定义模块（阶段4产出）
├── config/
│   └── sync/           # Drupal 配置导出（阶段2产出）
├── scripts/
│   ├── deploy.sh       # 一键部署
│   ├── backup.sh       # 部署前自动备份
│   ├── rollback.sh     # 回滚到指定备份
│   ├── init-server.sh  # 服务器一次性初始化
│   ├── post-deploy-hooks.sh  # 部署后钩子
│   └── CHEATSHEET.md   # 命令速查
├── nginx/
│   └── drupal11.conf   # nginx 站点配置参考
├── .gitignore
└── README.md
