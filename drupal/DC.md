# DC 综合内容网站 — Drupal 11 主题开发提示词集 v2

> 项目代号:`dc_theme` + `dc_core` 模块  
> 服务器 Drupal 根:`/var/www/html/drupal11/web/`(若无 `web/` 子目录则去掉)  
> GitHub 仓库:`github.com/xxedc/docs`,代码放在 `drupal/` 子目录下  
> 设计语言:参考 shadcn/ui (OKLCH + 中性灰阶 + 极简圆角阴影)  
> 主题基底:`starterkit_theme`  
> 设计依据:PDF《综合内容网站完整页面设计方案 v1.0》17 页 / 6 大模块 / 180+ 功能项

-----

## 工作流总览

```
┌─ AI 在对话里输出代码(每文件标注 github 路径)
│
├─ 你复制到 github (网页 Add file 或本地 clone push)
│         github.com/xxedc/docs/tree/main/drupal/
│
├─ 服务器 SSH 执行 bash /opt/dc-repo/scripts/deploy.sh
│         git pull → rsync → drush cr
│
└─ 站点生效:tlte.top
```

## 全局约定(每次开新对话都贴这段)

```
【环境】
- Drupal 11 + PHP 8.3 + MariaDB + nginx
- 服务器 Drupal 根:/var/www/html/drupal11/web
- GitHub 仓库:github.com/xxedc/docs,Drupal 代码放 drupal/ 子目录
- 我在手机 Termius SSH,会用 deploy.sh 部署,不需要 heredoc 命令

【AI 输出格式要求】
每个文件单独输出,严格按下面格式:

### 文件 N/Total: <文件作用一句话>
- GitHub 路径: drupal/<相对路径>
- 服务器路径: /var/www/html/drupal11/web/<对应路径>

```<语言标记 yaml/twig/css/php/js>
<完整文件内容,不省略,不写"...其余略">
```

【硬约束】

1. 不要写 “省略” / “类似” / “…” / “等等” 这种占位
1. 不要在一个代码块里塞多个文件,一文件一块
1. 文件路径必须是相对/绝对完整路径,不要写 “在 themes/ 下”
1. 中文注释,变量名英文
1. 输出超过 12 个文件就停下来,告诉我下次继续做哪些

```
---

## 阶段 0:仓库与部署架构(只做一次)

> **目的**:先把 git workflow 跑通,后面所有代码自动同步  
> **预计耗时**:30 分钟  
> **输出**:9 个脚本/配置文件 + 一份服务器初始化命令清单

### 提示词
```

角色:你是 Drupal 11 + Git 部署专家。

【任务】
为我搭建 GitHub → 服务器自动部署架构,让我后续所有 AI 生成的代码
push 到 github 后,服务器执行一条命令就能同步到 Drupal 主题/模块目录。

【环境】

- 服务器:Vultr 韩国 VPS,Ubuntu,已装 Drupal 11
- Drupal 根:/var/www/html/drupal11/web (若实际无 web/ 子目录,文件直接在 drupal11 下)
- GitHub 仓库:github.com/xxedc/docs (已存在,公开仓库)
- 代码放仓库的 drupal/ 子目录下
- 我用 Termius 手机 SSH,所有命令要可复制粘贴

【目标仓库结构】
github.com/xxedc/docs/
└── drupal/
├── themes/
│   └── dc_theme/         # 自定义主题(阶段1产出)
├── modules/
│   └── dc_core/          # 自定义模块(阶段4产出)
├── config/
│   └── sync/             # Drupal 配置导出(阶段2产出)
├── scripts/
│   ├── deploy.sh         # 一键部署
│   ├── backup.sh         # 部署前自动备份
│   ├── rollback.sh       # 回滚到指定备份
│   ├── init-server.sh    # 服务器一次性初始化
│   └── post-receive      # github webhook 接收(可选)
├── nginx/
│   └── drupal11.conf     # nginx 站点配置参考
└── README.md             # 仓库使用说明

【需要输出的所有文件(完整内容)】

### 文件 1/9: 仓库 README

- GitHub 路径: drupal/README.md
  （说明:仓库结构、如何添加新文件、本地开发流程、部署流程、回滚流程）

### 文件 2/9: 服务器一次性初始化脚本

- GitHub 路径: drupal/scripts/init-server.sh
  （功能:首次在服务器跑,完成所有准备工作）
- 安装 git rsync curl jq
- 在 /opt/ 下创建 dc-repo 目录
- 用 git sparse-checkout 只拉取 drupal/ 子目录,节省空间
  git clone –filter=blob:none –no-checkout https://github.com/xxedc/docs.git /opt/dc-repo
  cd /opt/dc-repo && git sparse-checkout init –cone && git sparse-checkout set drupal && git checkout main
- 创建 /var/backups/drupal11/ 备份目录
- 给 /var/www/html/drupal11/web/themes/custom/ 与 modules/custom/ 创建空目录(若不存在)
- chmod +x scripts/*.sh
- 输出最终验证命令(测试 deploy.sh -n 干跑模式)

### 文件 3/9: 部署脚本(核心)

- GitHub 路径: drupal/scripts/deploy.sh
  功能要点:
- set -euo pipefail
- 支持 -n 干跑模式(只显示要做什么不真做)
- 步骤:
1. 进维护模式 drush sset system.maintenance_mode 1
1. 调 backup.sh 自动备份(失败则中止)
1. cd /opt/dc-repo && git pull origin main
1. rsync -av –delete drupal/themes/  /var/www/html/drupal11/web/themes/custom/
1. rsync -av –delete drupal/modules/ /var/www/html/drupal11/web/modules/custom/
1. rsync -av           drupal/config/sync/ /var/www/html/drupal11/config/sync/
1. cd /var/www/html/drupal11 && drush updb -y
1. drush config:import -y (失败给警告但不退出)
1. drush cr
1. drush sset system.maintenance_mode 0
- 失败任意步骤自动调 rollback.sh 到最近备份
- 彩色日志输出(成功绿色、警告黄色、错误红色)
- 末尾打印:总耗时、本次 commit hash 与日志路径

### 文件 4/9: 备份脚本

- GitHub 路径: drupal/scripts/backup.sh
- 备份内容:数据库 mysqldump、sites/default/files、config/sync、themes/custom、modules/custom
- 命名:/var/backups/drupal11/backup-YYYYMMDD-HHMMSS.tar.gz
- 保留最近 7 天,自动删旧
- 输出备份文件大小与路径

### 文件 5/9: 回滚脚本

- GitHub 路径: drupal/scripts/rollback.sh
- 列出 /var/backups/drupal11/ 下最近 7 个备份(按时间倒序,带大小)
- 让用户输入序号选择(默认最近一个)
- 解压 → 还原 db、files、config、themes、modules
- 跑 drush cr
- 支持 -y 跳过确认(deploy.sh 失败时自动调用用)

### 文件 6/9: nginx 站点配置参考

- GitHub 路径: drupal/nginx/drupal11.conf
- 完整 server 块:443 SSL、Drupal 11 标准 location 规则、PHP-FPM、静态资源缓存、gzip、安全头
- 注释说明:此文件仅作参考,服务器上 nginx 配置位置在 /etc/nginx/sites-available/drupal11

### 文件 7/9: GitHub Actions 自动通知部署(可选)

- GitHub 路径: drupal/.github/workflows/notify-deploy.yml
- 当 push 到 main 且改动 drupal/** 时,触发 webhook 通知服务器
- 服务器侧用 systemd webhook 监听器,自动执行 deploy.sh
- 给出 webhook secret 配置说明
- 标注:此为可选功能,先用手动 SSH 部署即可

### 文件 8/9: 仓库根 .gitignore

- GitHub 路径: drupal/.gitignore
- 忽略 *.log / *.tar.gz / .DS_Store / vendor/ / node_modules/
- 不忽略 config/sync/*.yml

### 文件 9/9: 服务器部署 cheatsheet

- GitHub 路径: drupal/scripts/CHEATSHEET.md
- 常用命令:部署/回滚/查看日志/进维护/单独同步主题/查看最近 5 个 commit
- 故障排查:rsync 失败、drush 报错、权限问题、git pull 冲突

【约束】

- deploy.sh 必须能在 Drupal 根没有 web/ 子目录的情况下也工作(检测 ${DRUPAL_ROOT}/web 是否存在)
- 所有路径在脚本顶部定义为变量,方便日后改动
- drush 路径自动检测(可能在 vendor/bin/ 或 /usr/local/bin/)
- 脚本之间互相调用用绝对路径
- 中文日志输出,带 emoji 提示状态(✅ ❌ ⚠️ 📦)

【验收】
执行下面这串,从空仓库到第一次部署成功:

1. github.com 网页创建 docs/drupal/scripts/init-server.sh 等 9 个文件
1. 服务器 ssh 执行:
   curl -sL https://raw.githubusercontent.com/xxedc/docs/main/drupal/scripts/init-server.sh | bash
1. 服务器执行:bash /opt/dc-repo/drupal/scripts/deploy.sh -n
   预期看到所有要执行的步骤,无报错
1. 真实部署:bash /opt/dc-repo/drupal/scripts/deploy.sh
1. 修改本地任意文件 push 后,服务器再跑 deploy.sh,验证文件被同步

请输出全部 9 个文件,完整内容。

```
---

## 阶段 1:主题脚手架与设计系统

> **依赖**:阶段 0 已完成,deploy.sh 跑通  
> **预计文件数**:~15 个,可能要拆 2 次对话

### 提示词
```

角色:Drupal 11 主题开发与设计系统专家,精通 SDC、Twig、OKLCH、shadcn/ui 设计语言。

【前置已完成】

- 仓库 github.com/xxedc/docs/drupal/ 结构已建好
- 服务器 deploy.sh 工作正常
- 阶段 0 产出的 9 个脚本/配置文件已部署

【任务】
为综合内容网站创建全新 Drupal 11 自定义主题骨架 dc_theme,
基于 starterkit_theme,所有代码放仓库 drupal/themes/dc_theme/ 下。

【设计语言:借鉴 shadcn/ui】

- 色彩:全部用 OKLCH,提供 light/dark 双模式,通过 [data-theme=“dark”] 切换
- 中性色:zinc 灰阶基底
- 主色 primary:oklch(0.55 0.18 250) (深蓝紫,可被 CSS 变量覆盖)
- 危险色 destructive:oklch(0.6 0.22 27)
- 圆角:–radius: 0.5rem (派生 sm/md/lg/xl)
- 阴影:极轻 (0 1px 2px rgba(0,0,0,0.04)),不要 Material 风格重阴影
- 字体:Inter (英文/数字) + Noto Sans SC 思源黑体 (中文),本地 woff2,不用 Google Fonts (大陆访问)
- font-feature-settings: ‘cv11’, ‘ss01’
- 间距:基于 4px,提供 –space-1 到 –space-16
- 断点:sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536

【设计 token 变量名(shadcn 命名约定)】
–background –foreground –card –card-foreground
–popover –popover-foreground –primary –primary-foreground
–secondary –secondary-foreground –muted –muted-foreground
–accent –accent-foreground –destructive –destructive-foreground
–border –input –ring –radius

【SDC 基础组件(每个一个目录)】
button(variants: default/secondary/outline/ghost/destructive/link;sizes: sm/md/lg/icon)
card(card / card-header / card-title / card-description / card-content / card-footer 子组件)
input(text input,带 disabled/invalid 状态)
badge(variants: default/secondary/outline/destructive)
avatar(圆形头像 + fallback 字母)
skeleton(骨架屏带脉动动画)

【输出格式】
按【全局约定】里规定的格式输出,每个文件单独代码块,顶部注明:

- GitHub 路径: drupal/themes/dc_theme/…
- 服务器路径: /var/www/html/drupal11/web/themes/custom/dc_theme/…

【需要输出的文件清单(请完整输出,不省略)】

1. dc_theme.info.yml
1. dc_theme.libraries.yml
1. dc_theme.theme(preprocess_html 注入 dark mode 状态、attach 字体)
1. dc_theme.breakpoints.yml
1. css/base/tokens.css(所有设计 token,light + dark)
1. css/base/reset.css(modern CSS reset)
1. css/base/typography.css
1. css/base/utilities.css(.container .stack .row .truncate 等工具类)
1. components/button/button.component.yml + button.twig + button.css
1. components/card/card.component.yml + card.twig + card.css
1. components/input/input.component.yml + input.twig + input.css
1. components/badge/badge.component.yml + badge.twig + badge.css
1. components/avatar/avatar.component.yml + avatar.twig + avatar.css
1. components/skeleton/skeleton.component.yml + skeleton.twig + skeleton.css
1. templates/layout/page.html.twig(顶部导航 + 主区 + 底部三段式骨架,对应 PDF 第 3 页区块 1+6)
1. templates/layout/region–header.html.twig
1. templates/layout/region–footer.html.twig
1. js/theme-toggle.js(light/dark 切换,记忆 localStorage)
1. fonts/README.md(说明字体文件如何获取与放置)
1. README.md(主题自身说明,激活命令、调试技巧)

【约束】

- 不依赖 Bootstrap/Tailwind 等 CSS 框架
- 不依赖 jQuery,JS 用原生 ES2020+
- 字体本地 woff2 加载,font-display: swap
- 所有库走 dc_theme.libraries.yml 注册,不在 Twig 硬塞 <script>
- 颜色绝不硬编码,全部 var(–xxx)
- 单次输出超过 12 个文件就停下,告诉我下次继续做剩余的

【激活方式(部署后)】
push 到 github → 服务器跑 deploy.sh → 自动 rsync 到主题目录
然后 ssh 进服务器执行:
cd /var/www/html/drupal11
drush theme:install dc_theme
drush config:set system.theme default dc_theme -y
drush cr

【验收】

- 启用主题后访问首页,看到 light 模式默认布局,右上角切换 dark 无闪烁
- 浏览器控制台无 404、无 JS 报错
- /admin/structure/components 看到 6 个 SDC 组件
- 不依赖任何 contrib 模块即可运行

```
---

## 阶段 2:内容架构与 Drupal 后台配置

> **依赖**:阶段 1 完成且主题已启用  
> **重要决定**:用 UI 后台手工建 → drush cex 导出 → push 到 git。比让 AI 直接生成 YAML 稳得多。

### 提示词
```

角色:Drupal 11 信息架构师,精通 Content Type、Field、Vocabulary、Views、配置同步。

【前置已完成】

- dc_theme 主题已启用
- 仓库与 deploy.sh 工作正常

【本阶段策略说明】
直接让 AI 写 config/sync/*.yml 配置文件,UUID 与依赖容易出错,首次导入失败概率高。
更稳的做法是:

1. 我在 UI 后台按你给的清单手工建好
1. ssh 服务器执行 drush cex -y 导出全部配置
1. cp /var/www/html/drupal11/config/sync/*.yml /opt/dc-repo/drupal/config/sync/
1. cd /opt/dc-repo && git add . && git commit -m “阶段2配置” && git push

所以本阶段你输出的不是 YAML,而是详细的【UI 操作清单】+【字段配置表】+【Views 配置表】。

【任务】
给我一份详细到能照着点的后台操作手册,内容包括:

1. composer require 一行命令(本地仓库根执行还是服务器?标注清楚)
   需要的模块:pathauto token redirect admin_toolbar admin_toolbar_tools
   field_group file_mdm image_widget_crop metatag
1. drush en 启用模块命令
1. 创建 3 个 Vocabulary 的步骤
   A. categories - 一级分类,层级 1
   B. tags - 自由标签,扁平
   C. topics - 话题,扁平,加 field_topic_cover (image)、field_topic_description (text_long)
   每个给出:Admin → Structure → Taxonomy → Add vocabulary 完整路径
   要填的:Name(中文)、Machine name(英文)、Description
   初始词条:categories 添加 10 个(生活/游戏/知识/娱乐/技术/财经/美食/风景/人像/动漫)
   可用 drush 命令批量添加,给出脚本
1. 创建 3 个 Content Type 的完整字段表
   每个内容类型给出表格:
   | 字段标签 | 机器名 | 类型 | 必填 | 默认值 | 备注 |
   
   A. 视频(video)字段:
- title (核心,标题)
- body (核心,摘要+正文)
- field_video_file (文件: mp4/webm,2GB 限制)
- field_video_url (链接,可选,与 field_video_file 二选一)
- field_cover_image (图片,单图)
- field_duration (整数,秒)
- field_category (实体引用→categories,单选必填)
- field_tags (实体引用→tags,多选)
- field_topics (实体引用→topics,多选)
- field_quality (列表-字符串: 360p/720p/1080p/4K)
- field_view_count, field_like_count, field_collect_count (整数,默认 0)
- field_allow_comment (布尔,默认开)
- field_allow_download (布尔,默认关)
- field_visibility (列表-字符串: public/followers/private)
   
   B. 图集(image_post)字段:
- field_images (图片,多值,最多 30)
- field_category, field_tags, field_topics
- field_orientation (landscape/portrait/square)
- field_color_palette (字符串,多值,主色 hex)
- field_exif (长文本,JSON)
- field_view_count, field_like_count, field_collect_count
- field_visibility, field_allow_comment, field_allow_download
   
   C. 文章(article)字段:
- field_cover_image (图片,可选)
- field_summary (文本,100 字摘要)
- field_category, field_tags, field_topics
- field_reading_time (整数,分钟,自动计算)
- field_view_count, field_like_count, field_collect_count
- field_allow_comment, field_visibility
- body 用 CKEditor5 + 代码块插件
1. User entity 扩展字段
   Admin → Configuration → People → Account settings → Manage fields
- field_avatar (图片,单图,支持 GIF)
- field_bio (长字符串,200 字)
- field_region (列表-字符串,省份代码)
- field_social_links (链接,多值,最多 5)
- field_gender (列表-字符串: M/F/N,默认 N)
- field_birthday (日期,可选)
1. 配置每个字段的 Form display 与 View display
   每个 Content Type 给出建议布局(用 field_group 分组:基本信息/媒体/分类标签/发布设置)
1. 创建 7 个 View
   每个 View 给出完整配置:
   
   |View 名称|路径|显示类型|行|字段|过滤器|排序|分页|
   |-------|--|----|-|--|---|--|--|
   1. video_list - /videos - Page - Grid - title/cover/duration/uploader - status=1 + type=video - created DESC - 24/page
   1. image_waterfall - /images - Page - Unformatted list - 字段 - status=1 + type=image_post - created DESC - 30/page
   1. article_list - /articles - Page - Grid - title/summary/cover/author - status=1 + type=article - created DESC - 20/page
   1. front_recommend - 块 - Grid - 混合 video/image_post/article - promoted = 1 - created DESC - 18/page
   1. front_banner - 块 - Carousel - sticky = 1 - created DESC - 5 条
   1. user_content - 嵌入 user 页 - 多 attachment(投稿/收藏/喜欢/历史/草稿)
   1. search_results - /search - Page - 关键词过滤(阶段4 接 search_api)
1. 配置 pathauto URL 模式
- video → /video/[node:title]
- image_post → /image/[node:title]
- article → /article/[node:title]
- taxonomy_term:topics → /topic/[term:name]
- user → /user/[user:name]
1. 启用 file_widget_crop 给封面图配比例(16:9 视频封面,正方形头像)
1. 完成所有 UI 操作后导出与提交命令(给一段 shell 脚本):
   
   ```
   #!/bin/bash
   # 导出配置到 git 仓库
   cd /var/www/html/drupal11
   drush cex -y
   cp -r config/sync/* /opt/dc-repo/drupal/config/sync/
   cd /opt/dc-repo
   git add drupal/config/sync/
   git commit -m "feat(stage2): 内容架构 - 3 内容类型 + 7 Views + 用户字段"
   git push origin main
   ```

【输出格式】
本阶段不要求标准代码块格式,可以用表格+步骤说明+操作截图位置描述。
但末尾的导出脚本与初始化脚本要按【全局约定】格式输出。

【验收】

- 后台 /node/add 看到视频/图集/文章 3 个选项
- /admin/structure/taxonomy 看到 3 个 vocabulary
- /videos /images /articles 能访问(空内容显示空状态)
- /admin/people 编辑用户能看到 6 个新字段
- 创建 1 条视频测试节点,跳转 /video/test-title 正常
- drush cex 后 config/sync/ 下有 60+ 个 yml 文件,无错误

```
---

## 阶段 3:P0 核心页面模板

> **依赖**:阶段 1 + 阶段 2 全部完成  
> **建议**:本阶段拆 3 次对话(3a 视频+列表通用 / 3b 图片+瀑布流 / 3c 文章+登录+错误页)

### 提示词(每次开对话用其中一个分支)
```

角色:Drupal 11 Twig 模板专家,精通 SDC、模板继承、Views 模板、节点视图模式。

【前置已完成】

- 阶段 1 主题骨架与 6 个基础 SDC 组件
- 阶段 2 三个内容类型 + 7 个 Views + 用户字段

【任务范围(本次只做下面其一,开新对话再做下一个)】

▶ 分支 3a:首页 + 视频体系
对应 PDF 第 3、4、5 页

- 首页 page–front + Banner + 分类导航 + 推荐流 + 侧边栏热榜
- 视频列表 + 视频卡片 + 视频详情 + 视频播放器
- 列表页通用:筛选+排序+视图模式切换+无限滚动

▶ 分支 3b:图片体系 + 通用列表
对应 PDF 第 6、7 页

- 图片列表瀑布流(Pinterest 风格,2-5 列响应式)
- 图片详情 + 大图 lightbox + 缩放拖拽 + 上下张切换
- 批量操作组件
- EXIF 信息展示

▶ 分支 3c:文章体系 + 登录 + 错误页
对应 PDF 第 8、9、18、19 页

- 文章列表(掘金风格)+ 文章卡片
- 文章详情 + 阅读控制(字号/行距/夜间)+ 目录侧边锚点 + 阅读进度条
- 登录/注册/找回密码
- 404/403/500/网络断开

【输出格式】
按【全局约定】严格执行:

- 每文件单独代码块
- GitHub 路径 + 服务器路径双标注
- 单次不超过 12 个文件,超出停下问下次做哪些

【设计要求(三分支通用)】

- 列表页支持视图模式切换(大卡/小卡/列表),URL ?display= 参数 + localStorage 记忆
- 视频”已看”标记:JS 读 localStorage history 数组,后续接 dc_core 的 history API
- 图片瀑布流:CSS Grid + JS 计算列高,IntersectionObserver 懒加载
- 文章详情阅读宽度 max-width: 720px,行高 1.75
- 详情页右侧/底部”猜你喜欢”:独立 Block 插件(同 category 随机)
- 错误页插画:inline SVG,不引外部图
- 视频播放器:第一阶段用 <video src> 原生,留 data-hls-src 钩子供后续 HLS.js 替换
- 弹幕、投币:留 DOM 占位,onclick 弹”敬请期待”,阶段 4 实现

【BEM 命名约定】
.dc-card / .dc-card__header / .dc-card–featured

【交互 JS 全部原生 ES2020+,放 themes/dc_theme/js/】

- masonry.js / lightbox.js / video-controls.js
- toc-scrollspy.js / reading-controls.js
- network-detect.js / view-mode-switch.js
  全部走 libraries.yml 注册,只在对应模板 attach

【验收】

- 9 个 P0 页面 light/dark 模式都正常
- 移动端 375px / 平板 768px / PC 1280px 三档响应式
- Lighthouse 性能 ≥ 85,可访问性 ≥ 95
- 控制台无 404 无 JS error

```
> **请把上面提示词复制后,在【任务范围】里只保留 3a/3b/3c 其中一个,删掉另外两个。**

---

## 阶段 4:P1 功能页面与交互后端

> **依赖**:阶段 1+2+3 全部完成  
> **建议**:拆 2 次对话(4a 自定义模块 dc_core / 4b 5 个 P1 页面模板)

### 提示词(同样拆分使用)
```

角色:Drupal 11 全栈开发,精通自定义模块、Controller、REST、search_api、flag、
private_message、message_notify、自定义 Field Formatter。

【前置已完成】

- 阶段 1 主题
- 阶段 2 内容架构
- 阶段 3 P0 模板

【任务范围(二选一)】

▶ 分支 4a:dc_core 自定义模块
仓库路径 drupal/modules/dc_core/
服务器路径 /var/www/html/drupal11/web/modules/custom/dc_core/
功能:

1. RESTful 接口
   POST /api/view/{nid}     浏览量+1(写 cookie 防刷)
   POST /api/like/{nid}     点赞切换(基于 flag)
   POST /api/collect/{nid}  收藏切换
   GET  /api/recommend/{nid} 猜你喜欢
   POST /api/follow/{uid}   关注切换
   GET  /api/search-suggest 搜索联想
   GET  /api/unread-count   未读消息计数
1. 历史记录:hook_node_view 写入 history 表
1. 通知系统:基于 message + message_notify
1. Block 插件:HotRankBlock(热榜)、RelatedContentBlock(相关推荐)
1. Twig extension:|reading_time、|view_count_format(1.2k/3.4w)

需要的 contrib 模块(composer require):
drupal/{flag,search_api,search_api_db,facets,private_message,message,
message_notify,better_exposed_filters,views_infinite_scroll,captcha,
recaptcha,honeypot}

输出文件清单(都按全局约定格式):

- dc_core.info.yml / dc_core.module / dc_core.routing.yml / dc_core.services.yml
- src/Controller/{View,Like,Collect,Recommend,Follow,Search,Notification}Controller.php
- src/Plugin/Block/{HotRank,RelatedContent}Block.php
- src/TwigExtension/DcExtension.php
- src/EventSubscriber/{NodeViewSubscriber,UserLoginSubscriber}.php
- config/install/*.yml(默认配置)
- README.md

▶ 分支 4b:5 个 P1 页面模板

- 搜索结果页 (PDF p10):search_api + facets + 关键词高亮 + 联想下拉
- 个人中心 (p11):user–full.html.twig + 5 tab + 数据统计 sparkline
- 他人主页 (p12):用户卡 + 关注按钮 + 私信入口 + 举报
- 内容发布 (p13):3 种发布表单 + 拖拽上传 + 分片 XHR + 草稿自动保存
- 消息通知 (p14):会话列表 + 实时聊天 + 未读红点 + 三 tab 通知

需要在 themes/dc_theme/templates/ 与 components/ 下输出对应模板与 SDC

【输出格式】
严格按【全局约定】,单次不超过 12 个文件超出停下。

【约束】

- 所有 Ajax 带 X-CSRF-Token
- 上传:视频 2GB / 图片 10MB / 头像 2MB,在 .htaccess + nginx + PHP 三处配
- 搜索 index 用 search_api_db(无 Solr 依赖)
- 私信启用 honeypot
- 所有页面给 cache tag

【验收】

- /search?q=xxx 搜出三种内容,facets 生效
- /user/me 看自己主页,/user/{uid} 看他人主页
- /publish 三种表单提交成功
- /messages 看通知与会话,未读红点同步

```
---

## 阶段 5:P2 扩展功能 + 性能优化 + SEO

> **依赖**:阶段 1-4 全部完成  
> **部署架构在阶段 0 已搞定,本阶段只做内容功能 + 优化**

### 提示词
```

角色:Drupal 11 性能优化与 SEO 专家,熟悉 Redis、CDN、image_optimize、WebP、
metatag、simple_sitemap、JSON-LD。

【前置已完成】

- 阶段 0-4 全部
- 部署架构 deploy.sh 工作正常

【任务】

▶ A. P2 三个页面(对应 PDF p15/16/17)

1. 话题标签页 /topics/{slug}
- taxonomy-term–topics.html.twig
- 头部:话题封面 + 描述 + 参与人数 + 关注按钮
- 内容区:精选置顶 + 类型切换 + 参与排行榜 + 相关话题
- SDC: topic-header / topic-leaderboard
1. 收藏夹页 /user/{uid}/collections, /collections/{folder_id}
- 自定义实体 dc_collection_folder(name/cover/is_public/user_id)
- PHP 类完整:Entity / Storage / RouteProvider / Form / ListBuilder
- 拖拽排序(本地 vendor sortablejs)
- 分享短链 /s/{base62_id}
1. 历史记录 /user/me/history
- 基于 history 表 + 自定义 dc_view_log 表
- 按日期分组 / 视频续播进度 / 暂停记录开关 / 清空全部 / 类型筛选

▶ B. 性能优化(给完整配置 diff)

1. Redis 缓存:composer require drupal/redis,settings.php 改动
1. 图片优化:image_optimize_webp + responsive_image,4 档 image styles
1. CSS/JS 聚合:打开 preprocess
1. nginx 缓存:静态 1y / HTML 5min / API 不缓存
1. CDN(Cloudflare):cdn.tlte.top 子域分离

▶ C. SEO

1. composer require drupal/{metatag,simple_sitemap,redirect}
1. metatag 默认值与 token,差异化各内容类型
1. simple_sitemap 包含 video/image_post/article + topic + user
1. JSON-LD:dc_theme.theme 钩 hook_page_attachments,按 node 类型注入
   VideoObject / ImageObject / Article schema
1. robots.txt 模板

【输出格式】
按【全局约定】,GitHub 路径 + 服务器路径双标注。
A 部分文件放 drupal/themes/dc_theme/templates/、drupal/modules/dc_core/
B、C 部分:settings.php diff、nginx 配置改动、composer.json 改动给出完整片段

【验收】

- /topics/{slug} 完整功能
- /user/me/collections 创建/重命名/拖拽/分享
- /user/me/history 分组历史与视频进度
- 首页 PageSpeed 移动端 ≥ 80
- 内容页查看 source 看到 JSON-LD schema
- /sitemap.xml 包含全部内容

```
---

## 附录 A:对话节奏与拆分建议

| 阶段 | 推荐对话数 | 单次输出文件数上限 | 累计天数 |
|------|-----------|-------------------|---------|
| 0    | 1 次      | 9                 | 半天    |
| 1    | 1-2 次    | 12 (超出拆 1a/1b) | 半天    |
| 2    | 1 次      | UI 操作清单 + 导出脚本 | 半天    |
| 3    | 3 次(3a/3b/3c) | 每次 ~12     | 2-3 天  |
| 4    | 2 次(4a/4b)    | 每次 ~12     | 2-3 天  |
| 5    | 1-2 次    | ~15               | 1-2 天  |

**总计:9-12 次对话,7-10 天可完整跑下来。**

## 附录 B:每次新对话开头小抄
```

项目:DC 综合内容网站 Drupal 11 主题
仓库:github.com/xxedc/docs/drupal/
服务器 Drupal 根:/var/www/html/drupal11/web/
当前阶段:【填编号 0/1/2/3a/3b/3c/4a/4b/5】
前置已完成:【列出之前阶段产出的关键模块/文件】
本次任务:【具体到哪个区块/哪些文件】
输出格式:每文件单独代码块,顶部注 GitHub 路径 + 服务器路径,单次≤12 个文件

```
## 附录 C:contrib 模块一次性安装命令

```bash
ssh 进服务器:
cd /var/www/html/drupal11
composer require \
  drupal/admin_toolbar drupal/pathauto drupal/token drupal/redirect \
  drupal/field_group drupal/file_mdm drupal/image_widget_crop \
  drupal/metatag drupal/simple_sitemap \
  drupal/flag drupal/search_api drupal/search_api_db drupal/facets \
  drupal/better_exposed_filters drupal/views_infinite_scroll \
  drupal/private_message drupal/message drupal/message_notify \
  drupal/captcha drupal/recaptcha drupal/honeypot \
  drupal/redis drupal/cdn \
  drupal/imageapi_optimize_webp drupal/responsive_image
drush en admin_toolbar admin_toolbar_tools pathauto field_group -y
drush cr

# 把 composer.json 与 composer.lock 同步回 git 仓库:
cp composer.json composer.lock /opt/dc-repo/drupal/
cd /opt/dc-repo
git add drupal/composer.* && git commit -m "deps: 安装 contrib 模块" && git push
```

## 附录 D:常用 Drush 速查

```bash
cd /var/www/html/drupal11
drush cr                                   # 清缓存
drush updb -y                              # 数据库更新
drush cim -y                               # 配置导入
drush cex -y                               # 配置导出
drush en {module} -y                       # 启用模块
drush theme:install dc_theme               # 安装主题
drush config:set system.theme default dc_theme -y
drush sset system.maintenance_mode 1 -y    # 维护模式
drush user:create test --mail=t@t.com --password=xxx
drush sql:dump > /tmp/db-$(date +%F).sql
```

## 附录 E:故障排查速查

|问题                   |处理                                               |
|---------------------|-------------------------------------------------|
|deploy.sh 卡在 git pull|检查服务器到 github 的网络,可加 https proxy                 |
|rsync 报权限错误          |chown -R www-data:www-data web/themes web/modules|
|drush cim 失败 UUID 不匹配|第一次同步:先 drush cex 一次让本地 UUID 对齐                  |
|主题改动不生效              |drush cr;检查 sites/default/files/css/ 是否被清空       |
|dark 模式闪一下白          |theme-toggle.js 必须放 <head> 同步执行,不能 defer         |
|图片瀑布流错位              |检查 IntersectionObserver 触发时机,加 ResizeObserver    |

## 附录 F:GitHub 网页快速添加文件

不用 clone 仓库也能加文件:

1. 打开 https://github.com/xxedc/docs
1. 进入 drupal/ 目录(若不存在,先在根目录 Add file → Create new file,文件名输入 `drupal/README.md` 自动建目录)
1. Add file → Create new file
1. 文件名输入完整路径如 `themes/dc_theme/dc_theme.info.yml`(在 drupal/ 目录里输,会自动拼上)
1. 粘贴 AI 给的代码,Commit changes

进阶:把 .com 改成 .dev(github.dev),用 VSCode 网页版批量编辑,效率高很多。
