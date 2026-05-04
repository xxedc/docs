#!/bin/bash
# 作用：一键自动化部署最新代码到生产环境
set -euo pipefail

# --- 变量定义区 ---
DRUPAL_ROOT="/var/www/html/drupal11"
REPO_DIR="/opt/dc-repo/drupal"
LOG_FILE="/var/log/drupal_deploy_$(date +%Y%m%d).log"
START_TIME=$(date +%s)

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检测 Web 根目录是否带 web 子目录
if [ -d "${DRUPAL_ROOT}/web" ]; then
    WEB_ROOT="${DRUPAL_ROOT}/web"
else
    WEB_ROOT="${DRUPAL_ROOT}"
fi

# 自动检测 Drush 路径
if [ -f "${DRUPAL_ROOT}/vendor/bin/drush" ]; then
    DRUSH="${DRUPAL_ROOT}/vendor/bin/drush"
elif command -v drush &> /dev/null; then
    DRUSH="drush"
else
    echo -e "${RED}❌ 找不到 Drush 命令，部署中止！${NC}"
    exit 1
fi

# 支持 -n 干跑模式参数
DRY_RUN_ARG=""
if [[ "${1:-}" == "-n" ]]; then
    DRY_RUN_ARG="--dry-run"
    echo -e "${YELLOW}⚠️ 当前为干跑(Dry-Run)模式，不会实际覆盖文件和数据库！${NC}"
fi

echo -e "${BLUE}📦 开始执行 Drupal 自动部署任务...${NC}" | tee -a "$LOG_FILE"

# 错误捕获：任何一步失败，自动调用回滚脚本（非干跑模式下）
trap 'if [[ "$DRY_RUN_ARG" != "--dry-run" ]]; then echo -e "${RED}❌ 部署过程发生严重错误，准备触发回滚...${NC}"; bash ${REPO_DIR}/scripts/rollback.sh -y; fi' ERR

# 1. 开启维护模式
echo "🚧 开启网站维护模式..." | tee -a "$LOG_FILE"
if [[ "$DRY_RUN_ARG" != "--dry-run" ]]; then
    $DRUSH -r "$WEB_ROOT" sset system.maintenance_mode 1 -y
fi

# 2. 执行备份（只有真跑才备份）
if [[ "$DRY_RUN_ARG" != "--dry-run" ]]; then
    echo "💾 正在执行部署前全量备份..." | tee -a "$LOG_FILE"
    bash "${REPO_DIR}/scripts/backup.sh" || { echo -e "${RED}❌ 备份失败，中止部署以防万一！${NC}"; exit 1; }
fi

# 3. 更新 Git 仓库代码
echo "📥 从 GitHub 拉取最新代码..." | tee -a "$LOG_FILE"
cd /opt/dc-repo
git pull origin main

# 4. Rsync 同步主题、模块、配置
echo "🔄 开始同步代码和配置..." | tee -a "$LOG_FILE"
# 同步主题
rsync -av --delete $DRY_RUN_ARG "${REPO_DIR}/themes/" "${WEB_ROOT}/themes/custom/" | tee -a "$LOG_FILE"
# 同步模块
rsync -av --delete $DRY_RUN_ARG "${REPO_DIR}/modules/" "${WEB_ROOT}/modules/custom/" | tee -a "$LOG_FILE"
# 同步配置 (如果有的话)
if [ -d "${REPO_DIR}/config/sync/" ]; then
    rsync -av $DRY_RUN_ARG "${REPO_DIR}/config/sync/" "${DRUPAL_ROOT}/config/sync/" | tee -a "$LOG_FILE"
fi

# 5. 执行数据库更新和配置导入
if [[ "$DRY_RUN_ARG" != "--dry-run" ]]; then
    echo "🛠️ 正在执行数据库更新 (updb)..." | tee -a "$LOG_FILE"
    $DRUSH -r "$WEB_ROOT" updb -y

    echo "⚙️ 正在导入 Drupal 核心配置 (cim)..." | tee -a "$LOG_FILE"
    # 配置导入偶尔会因为依赖问题报错，所以这里加了 || true 允许继续，但给警告
    $DRUSH -r "$WEB_ROOT" cim -y || echo -e "${YELLOW}⚠️ 配置导入遇到问题，请稍后手动排查，部署将继续。${NC}" | tee -a "$LOG_FILE"

    echo "🧹 清理所有缓存 (cr)..." | tee -a "$LOG_FILE"
    $DRUSH -r "$WEB_ROOT" cr
fi

# 6. 关闭维护模式
echo "🟢 关闭网站维护模式..." | tee -a "$LOG_FILE"
if [[ "$DRY_RUN_ARG" != "--dry-run" ]]; then
    $DRUSH -r "$WEB_ROOT" sset system.maintenance_mode 0 -y
fi

# 7. 调用后续 Hook (暖站预热等)
if [[ "$DRY_RUN_ARG" != "--dry-run" ]]; then
    echo "🔗 执行部署后钩子脚本..." | tee -a "$LOG_FILE"
    bash "${REPO_DIR}/scripts/post-deploy-hooks.sh"
fi

END_TIME=$(date +%s)
COST_TIME=$((END_TIME - START_TIME))
COMMIT_HASH=$(cd /opt/dc-repo && git rev-parse --short HEAD)

echo -e "${GREEN}✅ 部署成功完成！${NC}"
echo -e "⏱️ 总耗时: ${COST_TIME} 秒"
echo -e "🔖 当前版本: Git Hash [${COMMIT_HASH}]"
echo -e "📝 日志存放于: ${LOG_FILE}"
