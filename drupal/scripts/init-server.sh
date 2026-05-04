
---

### 文件 2/9: 服务器一次性初始化脚本
- **GitHub 路径:** `drupal/scripts/init-server.sh`
- **服务器路径:** `/opt/dc-repo/drupal/scripts/init-server.sh`

```bash
#!/bin/bash
# =============================================================
# init-server.sh — 服务器一次性初始化（只需执行一次）
# 用法：curl -sL https://raw.githubusercontent.com/xxedc/docs/main/drupal/scripts/init-server.sh | bash
# =============================================================
set -euo pipefail

# ── 颜色输出 ──
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error()   { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ── 变量 ──
REPO_URL="https://github.com/xxedc/docs.git"
REPO_DIR="/opt/dc-repo"
DRUPAL_ROOT="/var/www/html/drupal11"
BACKUP_DIR="/var/backups/drupal11"

log_info "开始服务器初始化..."

# ── 1. 安装基础工具 ──
log_info "安装基础依赖：git rsync curl jq..."
apt-get update -qq
apt-get install -y git rsync curl jq
log_success "基础依赖安装完成"

# ── 2. 创建备份目录 ──
log_info "创建备份目录 $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
log_success "备份目录已创建"

# ── 3. 创建 Drupal 自定义目录 ──
log_info "创建 Drupal 主题/模块目录..."
# 自动检测是否有 web/ 子目录
if [ -d "${DRUPAL_ROOT}/web" ]; then
    WEB_ROOT="${DRUPAL_ROOT}/web"
else
    WEB_ROOT="${DRUPAL_ROOT}"
fi
mkdir -p "${WEB_ROOT}/themes/custom"
mkdir -p "${WEB_ROOT}/modules/custom"
log_success "Drupal 目录已创建：${WEB_ROOT}/themes/custom 和 ${WEB_ROOT}/modules/custom"

# ── 4. 克隆仓库（sparse checkout 只拉 drupal/ 子目录）──
log_info "初始化 Git 仓库（sparse checkout）..."
if [ -d "$REPO_DIR/.git" ]; then
    log_warn "仓库已存在，跳过克隆，直接 pull"
    cd "$REPO_DIR" && git pull origin main
else
    git clone \
        --filter=blob:none \
        --no-checkout \
        "$REPO_URL" \
        "$REPO_DIR"
    cd "$REPO_DIR"
    git sparse-checkout init --cone
    git sparse-checkout set drupal
    git checkout main
fi
log_success "仓库已克隆到 $REPO_DIR"

# ── 5. 给脚本加执行权限 ──
log_info "设置脚本执行权限..."
chmod +x "${REPO_DIR}/drupal/scripts/"*.sh
log_success "执行权限已设置"

# ── 6. 创建日志目录 ──
mkdir -p /var/log/drupal-deploy
log_success "日志目录已创建：/var/log/drupal-deploy"

# ── 完成 ──
echo ""
log_success "============================================"
log_success "  服务器初始化完成！"
log_success "============================================"
echo ""
echo -e "  ${YELLOW}下一步建议：${NC}"
echo -e "  1. 干跑验证：${GREEN}bash ${REPO_DIR}/drupal/scripts/deploy.sh -n${NC}"
echo -e "  2. 正式部署：${GREEN}bash ${REPO_DIR}/drupal/scripts/deploy.sh${NC}"
echo ""
