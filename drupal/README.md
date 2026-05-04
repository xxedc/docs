# XEDC Drupal 11 工程

一个面向生产环境的 Drupal 11 自动化部署与主题开发工程，包含主题、模块、配置同步与一键部署脚本。

---

## 📦 项目信息

- 🌐 站点地址：tlte.top  
- 📁 Drupal 根目录：`/var/www/html/drupal11/web/`  
- 🎨 自定义主题：`xedc`（`themes/custom/xedc`）  
- 🧩 自定义模块：`xedc_core`（`modules/custom/xedc_core`）  
- 📂 仓库地址：https://github.com/xxedc/docs  
- 📌 项目代码目录：`drupal/`

---

## 📁 目录结构

```
drupal/
├── themes/
│   └── xedc/
├── modules/
│   └── xedc_core/
├── config/
│   └── sync/
├── scripts/
│   ├── deploy.sh
│   ├── backup.sh
│   ├── rollback.sh
│   ├── init-server.sh
│   ├── post-deploy-hooks.sh
│   └── CHEATSHEET.md
├── nginx/
│   └── drupal11.conf
├── .gitignore
└── README.md
```

---

## 🚀 快速开始

### 初始化服务器

```bash
curl -sL https://raw.githubusercontent.com/xxedc/docs/main/drupal/scripts/init-server.sh | bash
```

### 干跑

```bash
bash /opt/dc-repo/drupal/scripts/deploy.sh -n
```

### 部署

```bash
bash /opt/dc-repo/drupal/scripts/deploy.sh
```

### 回滚

```bash
bash /opt/dc-repo/drupal/scripts/rollback.sh
```

---

## 🎨 主题模式

```html
<html data-theme="light">
```

| 模式 | 描述 |
|------|------|
| light | 日间 |
| dark | 夜间 |
| midnight | OLED |

---

## 🧠 设计原则

- 配置与代码分离
- 支持回滚
- 自动化部署
- 组件化开发

---

## 📄 License

MIT
