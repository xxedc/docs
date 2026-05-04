# XEDC Drupal 11 工程

一个面向生产环境的 Drupal 11 自动化部署与主题开发工程，包含主题、模块、配置同步与一键部署脚本。

---

## 📦 项目信息

- 🌐 站点地址：tlte.top  
- 📁 Drupal 根目录：/var/www/html/drupal11/web/  
- 🎨 自定义主题：xedc（themes/custom/xedc）  
- 🧩 自定义模块：xedc_core（modules/custom/xedc_core）  
- 📂 仓库地址：https://github.com/xxedc/docs  
- 📌 项目代码目录：drupal/

---

## 📁 目录结构

drupal/ ├── themes/ │   └── xedc/              # 自定义主题（阶段1） ├── modules/ │   └── xedc_core/         # 自定义模块（阶段4） ├── config/ │   └── sync/              # Drupal 配置导出（阶段2） ├── scripts/ │   ├── deploy.sh          # 一键部署 │   ├── backup.sh          # 自动备份 │   ├── rollback.sh        # 回滚 │   ├── init-server.sh     # 服务器初始化 │   ├── post-deploy-hooks.sh │   └── CHEATSHEET.md ├── nginx/ │   └── drupal11.conf      # Nginx 配置参考 ├── .gitignore └── README.md

---

## 🚀 快速开始

### 1️⃣ 初始化服务器（仅执行一次）

bash curl -sL https://raw.githubusercontent.com/xxedc/docs/main/drupal/scripts/init-server.sh | bash 

---

### 2️⃣ 干跑（验证部署流程）

bash bash /opt/dc-repo/drupal/scripts/deploy.sh -n 

---

### 3️⃣ 正式部署

bash bash /opt/dc-repo/drupal/scripts/deploy.sh 

---

### 4️⃣ 回滚

bash bash /opt/dc-repo/drupal/scripts/rollback.sh 

---

## 🎨 主题设计（三色模式）

通过 HTML 根属性控制：

html <html data-theme="light"> 

### 支持模式

| 模式       | 描述 |
|------------|------|
| light    | 白底 + zinc 字（日间） |
| dark     | 深灰背景（zinc-950） |
| midnight | OLED 纯黑（极致省电 + 高对比） |

---

## 🧱 开发阶段规划

| 阶段 | 内容 |
|------|------|
| 0    | 部署架构 |
| 1a   | 主题骨架 + Design Tokens |
| 1b   | 8 个 SDC 基础组件 |
| 2    | 内容结构 + Paragraphs + Views |
| 3a-3d| 核心页面模板 |
| 4a-4b| 功能页面 + xedc_core 模块 |
| 5    | 性能优化 + SEO |

---

## ⚙️ 服务器初始化脚本

路径：

drupal/scripts/init-server.sh

服务器位置：

/opt/dc-repo/drupal/scripts/init-server.sh

---

### 📜 脚本内容

bash #!/bin/bash # ============================================================= # init-server.sh — 服务器一次性初始化（只需执行一次） # ============================================================= set -euo pipefail  GREEN='\033[0;32m' YELLOW='\033[1;33m' RED='\033[0;31m' BLUE='\033[0;34m' NC='\033[0m'  log_info()    { echo -e "${BLUE}ℹ️  $1${NC}"; } log_success() { echo -e "${GREEN}✅ $1${NC}"; } log_warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; } log_error()   { echo -e "${RED}❌ $1${NC}"; exit 1; }  REPO_URL="https://github.com/xxedc/docs.git" REPO_DIR="/opt/dc-repo" DRUPAL_ROOT="/var/www/html/drupal11" BACKUP_DIR="/var/backups/drupal11"  log_info "开始服务器初始化..."  # 安装依赖 apt-get update -qq apt-get install -y git rsync curl jq  # 创建备份目录 mkdir -p "$BACKUP_DIR"  # Drupal 目录处理 if [ -d "${DRUPAL_ROOT}/web" ]; then     WEB_ROOT="${DRUPAL_ROOT}/web" else     WEB_ROOT="${DRUPAL_ROOT}" fi  mkdir -p "${WEB_ROOT}/themes/custom" mkdir -p "${WEB_ROOT}/modules/custom"  # Git 仓库 if [ -d "$REPO_DIR/.git" ]; then     cd "$REPO_DIR" && git pull origin main else     git clone --filter=blob:none --no-checkout "$REPO_URL" "$REPO_DIR"     cd "$REPO_DIR"     git sparse-checkout init --cone     git sparse-checkout set drupal     git checkout main fi  # 权限 chmod +x "${REPO_DIR}/drupal/scripts/"*.sh  # 日志目录 mkdir -p /var/log/drupal-deploy  log_success "服务器初始化完成！" 

---

## 🧠 设计原则

- 配置与代码分离（Config Sync）
- 所有部署可回滚
- 脚本驱动（避免手动操作）
- SDC 组件化开发
- CSS Variables 驱动（无 Tailwind / SCSS）

---

## 📌 后续规划

- [ ] CI/CD 自动部署（GitHub Actions）
- [ ] 多环境（dev / staging / prod）
- [ ] Redis / Varnish 缓存
- [ ] Lighthouse 90+ 优化
- [ ] 自动备份（OSS / S3）

---

## ⚡ 命令速查

bash # 初始化 init-server.sh  # 部署 deploy.sh  # 回滚 rollback.sh  # 备份 backup.sh 

---

## 📄 Li



