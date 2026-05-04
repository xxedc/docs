# XEDC 综合内容网站 — Drupal 11 主题开发提示词集 v3

> 项目代号:`xedc` 主题 + `xedc_core` 模块  
> 服务器 Drupal 根:`/var/www/html/drupal11/web/` (若无 `web/` 子目录则去掉)  
> GitHub 仓库:`github.com/xxedc/docs`,代码放在 `drupal/` 子目录下  
> 设计语言:参考 shadcn/ui (OKLCH + 中性灰阶 + 极简圆角阴影)  
> 主题基底:`starterkit_theme`  
> 三色模式:**日间 light / 夜间 dark / 深夜 midnight (OLED 友好)**  
> 已装关键模块:**Twig Tweak、Paragraphs**(模板大量用 `drupal_view/block/field/menu`)  
> 设计依据:PDF《综合内容网站完整页面设计方案 v1.0》17 页 / 6 大模块 / 180+ 功能项

-----

## 工作流总览

```
┌─ AI 在对话里输出代码(每文件双标 GitHub 路径 + 服务器路径)
│
├─ 你复制到 github (网页 Add file 或本地 clone push)
│         github.com/xxedc/docs/tree/main/drupal/
│
├─ 服务器 SSH 执行 bash /opt/dc-repo/drupal/scripts/deploy.sh
│         git pull → rsync → drush cim → drush cr
│
└─ 站点生效:tlte.top
```

## 全局约定 (每次开新对话都贴这段)

```
【环境】
- Drupal 11 + PHP 8.3 + MariaDB + nginx
- 服务器 Drupal 根:/var/www/html/drupal11/web
- GitHub 仓库:github.com/xxedc/docs,Drupal 代码放 drupal/ 子目录
- 主题名:xedc(放 themes/xedc)
- 自定义模块名:xedc_core(放 modules/custom/xedc_core)
- 已启用关键 contrib 模块:twig_tweak、paragraphs、admin_toolbar、pathauto、token、
  field_group、file_mdm、image_widget_crop、metatag
- 我用 Termius 手机 SSH,会用 deploy.sh 部署

【三色模式约定】
- light:白底 zinc 字
- dark:深灰底(zinc-900)柔字 (常规夜间)
- midnight:OLED 纯黑底(oklch 0)+ 高对比字 (深夜阅读、省电)
- 切换 UI:右上角月亮图标 → 弹出 4 选 1 (跟随系统/日间/夜间/深夜),localStorage 记忆
- HTML 根属性 [data-theme="light|dark|midnight"]

【Twig Tweak 优先用法】
模板里禁止再到后台手工 placement block,优先用 Twig Tweak 直接调用:
- {{ drupal_view('view_name', 'display_id') }}        # 渲染视图
- {{ drupal_block('block_id') }}                       # 渲染块
- {{ drupal_block('plugin_id', {label: '热榜'}) }}     # 创建块插件实例
- {{ drupal_menu('main') }}                            # 渲染菜单
- {{ drupal_field('field_cover_image', 'node', nid) }} # 渲染单字段
- {{ drupal_entity('node', nid, 'teaser') }}           # 渲染实体
- {{ drupal_image(fid, 'card_640') }}                  # 渲染图片
- {{ drupal_token('node:title') }}                     # 解析 token

【Paragraphs 用法】
- 文章正文 body 改用 paragraph 结构化,提供 6 种 paragraph type:
  text_block / quote_block / code_block / image_gallery / video_embed / cta_block
- 首页 banner 也是 paragraph(运营可在后台拖拽编辑)
- 模板必须输出 paragraph--{bundle}.html.twig 各类型模板

【AI 输出格式硬性要求】
每个文件单独输出,严格按下面格式:

### 文件 N/Total: <文件作用一句话>
- GitHub 路径: drupal/<相对路径>
- 服务器路径: /var/www/html/drupal11/web/<对应路径>

```<语言标记>
<完整文件内容,不省略,不写"...其余略">
```

【硬约束】

1. 不要写”省略”/“类似”/”…”/“等等”占位
1. 不要在一个代码块塞多个文件
1. 单次输出超过 12 个文件就停下,告诉我下次继续做哪些
1. 中文注释,变量名英文
1. 颜色绝不硬编码,全部 var(–xxx)
1. 模板里能用 Twig Tweak 就别 block placement

```
---

## 阶段 0:仓库与部署架构(只做一次)

> **目的**:先把 git workflow 跑通  
> **耗时**:30 分钟  
> **输出**:9 个脚本/配置文件

### 提示词
```

角色:Drupal 11 + Git 部署专家。

【任务】
搭建 GitHub → 服务器自动部署架构,
让我后续 AI 生成的代码 push 到 github 后,服务器执行一条命令同步到 Drupal 主题/模块目录。

【环境】

- 服务器:Vultr 韩国 VPS,Ubuntu,已装 Drupal 11
- Drupal 根:/var/www/html/drupal11/web (若实际无 web/ 子目录,直接 drupal11/)
- GitHub 仓库:github.com/xxedc/docs (公开仓库)
- 代码放仓库 drupal/ 子目录
- 我用 Termius 手机 SSH

【目标仓库结构】
github.com/xxedc/docs/
└── drupal/
├── themes/
│   └── xedc/                # 自定义主题(阶段1产出)
├── modules/
│   └── xedc_core/           # 自定义模块(阶段4产出)
├── config/
│   └── sync/                # Drupal 配置导出(阶段2产出)
├── scripts/
│   ├── deploy.sh            # 一键部署
│   ├── backup.sh            # 部署前自动备份
│   ├── rollback.sh          # 回滚到指定备份
│   ├── init-server.sh       # 服务器一次性初始化
│   └── CHEATSHEET.md        # 命令速查
├── nginx/
│   └── drupal11.conf        # nginx 站点配置参考
├── .gitignore
└── README.md

【需要输出的所有 9 个文件(完整内容)】

1. drupal/README.md - 仓库说明
1. drupal/scripts/init-server.sh - 服务器一次性初始化
   功能:
- apt install -y git rsync curl jq
- 在 /opt 下创建 dc-repo
- git sparse-checkout 只拉 drupal/ 子目录:
  git clone –filter=blob:none –no-checkout https://github.com/xxedc/docs.git /opt/dc-repo
  cd /opt/dc-repo && git sparse-checkout init –cone && git sparse-checkout set drupal && git checkout main
- mkdir -p /var/backups/drupal11
- mkdir -p /var/www/html/drupal11/web/themes/custom /var/www/html/drupal11/web/modules/custom
- chmod +x /opt/dc-repo/drupal/scripts/*.sh
- 末尾:echo 完成 + 推荐执行 deploy.sh -n 验证
1. drupal/scripts/deploy.sh - 核心部署脚本
- set -euo pipefail
- 顶部变量:DRUPAL_ROOT=”/var/www/html/drupal11”
  REPO_DIR=”/opt/dc-repo/drupal”
  DRUSH(自动检测路径)
- 支持 -n 干跑模式
- 步骤:
   1. maint on
   1. backup.sh(失败中止)
   1. cd $REPO_DIR/.. && git pull origin main
   1. rsync -av –delete $REPO_DIR/themes/  ${DRUPAL_ROOT}/web/themes/custom/
   1. rsync -av –delete $REPO_DIR/modules/ ${DRUPAL_ROOT}/web/modules/custom/
   1. rsync -av           $REPO_DIR/config/sync/ ${DRUPAL_ROOT}/config/sync/
   1. drush updb -y
   1. drush cim -y (失败给警告但继续)
   1. drush cr
   1. maint off
- 任意失败自动调 rollback.sh
- 彩色输出:✅ 绿 ⚠️ 黄 ❌ 红 📦 蓝
- 末尾打印总耗时 + commit hash + 日志路径
1. drupal/scripts/backup.sh
- 备份 db、files、config、themes、modules
- 命名:/var/backups/drupal11/backup-YYYYMMDD-HHMMSS.tar.gz
- 保留最近 7 天
1. drupal/scripts/rollback.sh
- 列出最近 7 个备份(时间倒序+大小)
- 输入序号选择(默认最近)
- 还原 db/files/config/themes/modules + drush cr
- 支持 -y 跳确认
1. drupal/nginx/drupal11.conf - 完整 server 块,SSL/PHP-FPM/缓存/gzip/安全头
1. drupal/.gitignore - 忽略 *.log *.tar.gz .DS_Store vendor/ node_modules/
1. drupal/scripts/CHEATSHEET.md - 命令速查 + 故障排查
1. drupal/scripts/post-deploy-hooks.sh
- deploy.sh 末尾自动调
- 暖站:curl 几个核心 URL 触发缓存预热
- 通知(可选):Telegram bot 推送部署成功消息(预留环境变量 TG_BOT_TOKEN/TG_CHAT_ID)

【约束】

- deploy.sh 必须能处理无 web/ 子目录情况(检测 ${DRUPAL_ROOT}/web 是否存在)
- 所有路径在脚本顶部定义为变量
- drush 路径自动检测(可能 vendor/bin/ 或 /usr/local/bin/)
- 中文日志输出 + emoji 状态
- 中文 commit message 用英文 prefix(feat/fix/docs/chore/refactor/perf/test/build/ci/style)

【验收】

1. github 网页创建 9 个文件(在 drupal/scripts/ 等目录下)
1. 服务器执行:
   curl -sL https://raw.githubusercontent.com/xxedc/docs/main/drupal/scripts/init-server.sh | bash
1. 干跑:bash /opt/dc-repo/drupal/scripts/deploy.sh -n
1. 真跑:bash /opt/dc-repo/drupal/scripts/deploy.sh
1. 改任意文件 push 后再 deploy.sh,验证同步成功

请输出全部 9 个文件,完整内容,严格按全局约定的输出格式。

```
---

## 阶段 1:主题脚手架与设计系统(三色模式)

> **依赖**:阶段 0 完成,deploy.sh 跑通  
> **预计文件数**:~15-18 个,可能要拆 1a/1b 两次对话

### 提示词
```

角色:Drupal 11 主题开发与设计系统专家,精通 SDC、Twig、Twig Tweak、OKLCH、
shadcn/ui 设计语言、三色模式实现。

【前置已完成】

- 阶段 0 部署架构,deploy.sh 工作正常
- 已装 contrib 模块:twig_tweak、paragraphs、admin_toolbar、pathauto、token、
  field_group、file_mdm、image_widget_crop、metatag

【任务】
为综合内容网站创建全新 Drupal 11 自定义主题 xedc,
基于 starterkit_theme,代码放仓库 drupal/themes/xedc/ 下。

【设计语言:借鉴 shadcn/ui】

- 色彩:全部用 OKLCH,提供 light/dark/midnight 三模式
- 切换:HTML 根属性 [data-theme=“light|dark|midnight”],localStorage 记忆 + 跟随系统
- 中性色:zinc 灰阶基底
- 主色 primary:oklch(0.55 0.18 250) 深蓝紫
- 危险色 destructive:oklch(0.6 0.22 27)
- 圆角:–radius: 0.5rem
- 阴影:极轻 (0 1px 2px rgba(0,0,0,0.04))
- 字体:Inter (英文/数字) + Noto Sans SC (中文),本地 woff2,不用 Google Fonts (大陆访问)
- font-feature-settings: ‘cv11’, ‘ss01’
- 间距:4px 基础,–space-1 到 –space-16
- 断点:sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536

【三色模式具体颜色定义(必须遵守)】
LIGHT 日间:
–background: oklch(1 0 0)
–foreground: oklch(0.145 0 0)
–card: oklch(1 0 0)
–muted: oklch(0.961 0 0)
–border: oklch(0.898 0 0)

DARK 夜间(常规深灰,B 站夜间风格):
–background: oklch(0.145 0 0)      # zinc-950
–foreground: oklch(0.985 0 0)
–card: oklch(0.18 0 0)
–muted: oklch(0.22 0 0)
–border: oklch(0.27 0 0)

MIDNIGHT 深夜(OLED 纯黑,夜读省电):
–background: oklch(0 0 0)          # 纯黑
–foreground: oklch(0.92 0 0)       # 不用纯白,降低强光刺眼
–card: oklch(0.08 0 0)             # 几乎黑,微微抬一点区分卡片
–muted: oklch(0.12 0 0)
–border: oklch(0.18 0 0)
–primary: oklch(0.65 0.16 250)     # 主色稍微亮一点,黑底上更明显

设计 token 变量名 (shadcn 命名约定):
–background –foreground –card –card-foreground
–popover –popover-foreground –primary –primary-foreground
–secondary –secondary-foreground –muted –muted-foreground
–accent –accent-foreground –destructive –destructive-foreground
–border –input –ring –radius

【主题切换器交互(theme-toggle.js + theme-toggle SDC)】

- 桌面端右上角月亮/太阳图标按钮
- 点击弹出下拉菜单,4 选 1:
  ☀️ 跟随系统  ☀️ 日间  🌙 夜间  ⚫ 深夜
- localStorage key: xedc-theme,值:system|light|dark|midnight
- system 模式下监听 prefers-color-scheme 变化自动切
- 初始化必须放 <head> 同步执行,避免 FOUC 闪白
- 切换时 <html> 加 .theme-transitioning 类,200ms 过渡完移除

【SDC 基础组件(每个一个目录)】

1. button - default/secondary/outline/ghost/destructive/link;sm/md/lg/icon
1. card - card / card-header / card-title / card-description / card-content / card-footer
1. input - 文本输入,disabled/invalid 状态
1. badge - default/secondary/outline/destructive
1. avatar - 圆形头像 + fallback 字母
1. skeleton - 骨架屏带脉动动画
1. dropdown - 下拉菜单(主题切换器要用)
1. theme-toggle - 主题切换器(包含图标 + 下拉)

【输出格式】
按全局约定,每文件单独代码块,顶部双标 GitHub 路径 + 服务器路径。

【需要输出的文件清单】
建议拆两次对话,每次 ≤12 文件:

▶ 分支 1a:核心骨架与 Token (12 个)

1. xedc.info.yml
1. xedc.libraries.yml
1. xedc.theme(preprocess_html 注入主题状态、attach 字体、设置默认主题区域)
1. xedc.breakpoints.yml
1. css/base/tokens.css(三模式所有 token,包含 [data-theme] 选择器)
1. css/base/reset.css
1. css/base/typography.css
1. css/base/utilities.css
1. js/theme-toggle.js(三模式切换 + 跟随系统 + FOUC 防护)
1. templates/layout/page.html.twig(用 Twig Tweak 调用 menu/blocks)
1. templates/layout/region–header.html.twig
1. templates/layout/region–footer.html.twig

▶ 分支 1b:8 个 SDC 组件 (8 个目录,每目录 3 文件)

1. components/button/{button.component.yml,button.twig,button.css}
1. components/card/{card.component.yml,card.twig,card.css}
1. components/input/{input.component.yml,input.twig,input.css}
1. components/badge/{badge.component.yml,badge.twig,badge.css}
1. components/avatar/{avatar.component.yml,avatar.twig,avatar.css}
1. components/skeleton/{skeleton.component.yml,skeleton.twig,skeleton.css}
1. components/dropdown/{dropdown.component.yml,dropdown.twig,dropdown.css,dropdown.js}
1. components/theme-toggle/{theme-toggle.component.yml,theme-toggle.twig,theme-toggle.css}

- fonts/README.md
- themes/xedc/README.md

【page.html.twig 关键要求 (展示 Twig Tweak 用法)】
顶部导航部分必须用:
{{ drupal_menu(‘main’) }}                                       # 主导航
{# 主题切换器 SDC #}

<div>{% include 'xedc:theme-toggle' %}</div>
{# 站点 logo + 搜索框 + 通知图标 + 用户头像 #}

主区:
{{ page.content }}                                              # Drupal 主内容

侧边栏(PC 端):
{{ drupal_view(‘front_recommend’, ‘block_hot’) }}               # 阶段2会建这个 view
{{ drupal_block(‘user_login_block’) }}                          # 未登录显示

底部:
{{ drupal_menu(‘footer’) }}

【约束】

- 不依赖 Bootstrap/Tailwind
- 不依赖 jQuery,JS 用原生 ES2020+
- 字体本地 woff2,font-display: swap
- 所有库走 libraries.yml,不在 Twig 硬塞 <script>
- 颜色绝不硬编码,全部 var(–xxx)
- midnight 模式下图片要加微微的滤镜降低亮度(filter: brightness(0.85))
- 单次输出超过 12 个文件停下问下次

【激活方式】
git push → deploy.sh → ssh 进服务器:
cd /var/www/html/drupal11
drush theme:install xedc
drush config:set system.theme default xedc -y
drush cr

【验收】

- 启用主题后访问首页,默认日间模式
- 右上角月亮图标点击,弹出 4 选 1 菜单
- 切换三模式无闪烁、color-scheme meta 正确
- 跟随系统模式下,操作系统切深色站点跟着切
- /admin/structure/components 看到 8 个 SDC 组件
- F12 检查 :root 与 [data-theme=“dark”] [data-theme=“midnight”] CSS 变量都生效

```
---

## 阶段 2:内容架构 + Paragraphs 类型 + Views

> **依赖**:阶段 1 完成且主题已启用  
> **策略**:UI 后台手工建 + Paragraph type 用 drush 命令 → drush cex 导出 → push

### 提示词
```

角色:Drupal 11 信息架构师,精通 Content Type、Field、Vocabulary、Views、
Paragraphs、配置同步。

【前置已完成】

- xedc 主题已启用
- 仓库与 deploy.sh 正常
- 已装 paragraphs、twig_tweak、admin_toolbar、pathauto、token、field_group、
  file_mdm、image_widget_crop、metatag

【本阶段策略】
直接让 AI 写 config/sync/*.yml UUID 容易出错,改成:

1. 我在 UI 后台按你给的清单手工建好 (Paragraph types 可用 drush 命令辅助)
1. ssh 服务器执行 drush cex -y 导出
1. cp /var/www/html/drupal11/config/sync/*.yml /opt/dc-repo/drupal/config/sync/
1. cd /opt/dc-repo && git add drupal/config && git commit -m “feat(stage2): 内容架构” && git push

所以本阶段你输出【UI 操作清单】+【字段配置表】+【Paragraph types 配置】+【Views 配置表】。

【任务】

▶ A. composer require & drush en (一行命令)
除了已装的,还需:
composer require drupal/paragraphs drupal/entity_reference_revisions
drush en paragraphs entity_reference_revisions twig_tweak -y

▶ B. 创建 6 个 Paragraph types (xedc 风格内容块)
后台路径 /admin/structure/paragraphs_type

1. text_block (普通文本段落)
- field_text (text_long,富文本格式 basic_html)
1. quote_block (引用块)
- field_quote (text_long)
- field_author (string,引用作者,可选)
- field_source_url (link,可选)
1. code_block (代码块)
- field_language (list_string: javascript/python/php/bash/yaml/json/html/css/sql/rust/go)
- field_code (text_long,纯文本)
- field_filename (string,可选,显示文件名)
1. image_gallery (图片画廊)
- field_images (image,多值,最多 12)
- field_caption (string,可选)
- field_layout (list_string: grid/carousel/masonry,默认 grid)
1. video_embed (嵌入视频)
- field_video_url (link,YouTube/B 站/Vimeo URL)
- field_video_file (file,可选,本地 mp4)
- field_caption (string,可选)
1. cta_block (号召性按钮区)
- field_title (string)
- field_description (text_long)
- field_button_text (string)
- field_button_url (link)
- field_style (list_string: primary/secondary/gradient)

给出每个 paragraph type 的 drush 创建命令(若 paragraphs 模块支持)
或者 UI 操作步骤截图位置描述

▶ C. 创建 3 个 Vocabulary

1. categories - 一级分类,层级 1
1. tags - 自由标签,扁平
1. topics - 话题,扁平,加 field_topic_cover (image)、field_topic_description (text_long)
   初始词条 categories: 生活/游戏/知识/娱乐/技术/财经/美食/风景/人像/动漫
   给出 drush 批量创建脚本

▶ D. 3 个 Content Type 完整字段表

D-1. 视频 (video)

|字段标签|机器名                 |类型                                  |必填|备注                      |
|----|--------------------|------------------------------------|--|------------------------|
|标题  |title               |核心                                  |是 |                        |
|摘要  |body                |text_long                           |否 |视频简介,纯文本                |
|视频文件|field_video_file    |file                                |否 |mp4/webm,2GB            |
|视频外链|field_video_url     |link                                |否 |与上面二选一                  |
|封面图 |field_cover_image   |image                               |是 |16:9 裁剪                 |
|时长  |field_duration      |integer                             |否 |秒                       |
|分类  |field_category      |entity_ref→categories               |是 |单选                      |
|标签  |field_tags          |entity_ref→tags                     |否 |多选                      |
|话题  |field_topics        |entity_ref→topics                   |否 |多选                      |
|画质  |field_quality       |list_string                         |否 |360p/720p/1080p/4K      |
|浏览量 |field_view_count    |integer                             |- |默认 0                    |
|点赞数 |field_like_count    |integer                             |- |默认 0                    |
|收藏数 |field_collect_count |integer                             |- |默认 0                    |
|允许评论|field_allow_comment |boolean                             |- |默认开                     |
|允许下载|field_allow_download|boolean                             |- |默认关                     |
|可见性 |field_visibility    |list_string                         |- |public/followers/private|
|详情段落|field_paragraphs    |entity_reference_revisions→paragraph|否 |允许 6 种类型,可选添加更详细介绍      |

D-2. 图集 (image_post)

- field_images (image, 多值, 最多 30)
- field_category, field_tags, field_topics
- field_orientation (landscape/portrait/square)
- field_color_palette (string, 多值, 主色 hex)
- field_exif (text_long, JSON)
- 计数三件套 + 可见性 + 评论/下载开关
- field_paragraphs (描述段落,可选)

D-3. 文章 (article) ⭐ 这个 body 改用 paragraphs

|字段标签              |机器名                  |类型                            |必填|备注      |
|------------------|---------------------|------------------------------|--|--------|
|标题                |title                |核心                            |是 |        |
|封面图               |field_cover_image    |image                         |否 |        |
|摘要                |field_summary        |text                          |是 |100 字   |
|正文段落              |field_body_paragraphs|entity_ref_revisions→paragraph|是 |⭐ 6 种类型 |
|分类/标签/话题          |(同上)                 |                              |  |        |
|阅读时长              |field_reading_time   |integer                       |- |hook 自动算|
|计数三件套 + 可见性 + 评论开关|                     |                              |  |        |

⚠️ 注意:文章 body 字段不再用 text_with_summary,改用 paragraphs 字段。
编辑时通过”添加段落”按钮选 6 种类型之一插入。

▶ E. User entity 扩展字段
/admin/config/people/accounts/fields

- field_avatar (image, 单图, 支持 GIF)
- field_bio (string_long, 200 字)
- field_region (list_string, 省份代码)
- field_social_links (link, 多值, 最多 5)
- field_gender (list_string: M/F/N, 默认 N)
- field_birthday (datetime date, 可选)

▶ F. 配置 Form display 与 View display
每个 Content Type 用 field_group 分组:基本信息 / 媒体 / 分类标签 / 发布设置
显示模式建议:default(详情用)/teaser(列表用)/card(网格用)

▶ G. 创建 7 个 View

|View 名                    |路径       |显示                     |行                       |字段                      |过滤          |排序|
|--------------------------|---------|-----------------------|------------------------|------------------------|------------|--|
|video_list                |/videos  |Page Grid 24/页         |rendered entity (teaser)|type=video,status=1     |created DESC|  |
|image_waterfall           |/images  |Page Unformatted 30/页  |rendered entity (card)  |type=image_post,status=1|created DESC|  |
|article_list              |/articles|Page Grid 20/页         |rendered entity (teaser)|type=article,status=1   |created DESC|  |
|front_recommend           |(块)      |Grid 18                |rendered (teaser)       |promoted=1              |created DESC|  |
|front_banner              |(块)      |Carousel 5             |sticky=1                |created DESC            |            |  |
|front_recommend(block_hot)|(块)      |List 10                |sort by view_count DESC |热榜 TOP10                |            |  |
|user_content              |嵌入 user 页|多 attachment           |投稿/收藏/喜欢/历史/草稿          |                        |            |  |
|search_results            |/search  |Page (阶段4 接 search_api)|                        |                        |            |  |

▶ H. pathauto URL 模式

- video → /video/[node:title]
- image_post → /image/[node:title]
- article → /article/[node:title]
- taxonomy:topics → /topic/[term:name]
- user → /user/[user:name]

▶ I. 完成 UI 操作后导出脚本(给一段 shell):
#!/bin/bash

# 阶段2 配置导出与提交

cd /var/www/html/drupal11
drush cex -y
cp -r config/sync/* /opt/dc-repo/drupal/config/sync/
cd /opt/dc-repo
git add drupal/config/sync/
git commit -m “feat(stage2): 内容架构 + 6 paragraph types + 7 views”
git push origin main

【输出格式】
本阶段以表格 + 步骤说明为主,末尾导出脚本按全局约定格式。

【验收】

- /node/add 看到视频/图集/文章 3 个选项
- 编辑文章时能”添加段落”插入 6 种类型
- /admin/structure/paragraphs_type 看到 6 个 paragraph 类型
- /videos /images /articles 能访问(空状态显示)
- /admin/people 编辑用户看到 6 个新字段
- 创建 1 篇带 paragraph 的测试文章,前台预览正常显示
- drush cex 后 config/sync/ 有 70+ yml,无错误

```
---

## 阶段 3:P0 核心页面模板 + Paragraph 模板

> **依赖**:阶段 1 + 2 完成  
> **建议**:拆 4 次对话(3a 首页+视频 / 3b 图片 / 3c 文章+Paragraphs / 3d 登录+错误)

### 提示词(每次开对话用其中一个分支)
```

角色:Drupal 11 Twig 模板专家,精通 SDC、Twig Tweak、Paragraphs 模板、模板继承、
Views 模板、节点视图模式。

【前置已完成】

- 阶段 1 主题骨架 + 8 个 SDC 组件 + 三色模式
- 阶段 2 三个内容类型 + 6 个 Paragraph 类型 + 7 个 Views

【任务范围(本次只做下面其一,开新对话再做下一个)】

▶ 分支 3a:首页 + 视频体系 (PDF p3/4/5)

- 首页 page–front + Banner Paragraph 渲染 + 分类导航 + 推荐流 + 侧边栏热榜
- 视频列表 + 视频卡片 + 视频详情 + 视频播放器
- 列表页通用:筛选+排序+视图模式切换+无限滚动

必输出文件:

- templates/layout/page–front.html.twig (用 Twig Tweak 大量调用)
- templates/views/views-view–front-banner.html.twig
- templates/views/views-view–front-recommend.html.twig
- templates/views/views-view–video-list.html.twig
- templates/content/node–video–full.html.twig
- templates/content/node–video–teaser.html.twig
- components/banner-carousel/(SDC,自动播放)
- components/category-nav/(SDC)
- components/hot-rank/(SDC,侧边栏 TOP10)
- components/video-player/(SDC,HTML5,留 HLS 钩子)
- components/video-card/(SDC,Hover 3 秒预览)
- css/pages/{front,video-list,video-detail}.css
- js/{masonry,video-controls,view-mode-switch,infinite-scroll}.js

▶ 分支 3b:图片体系 (PDF p6/7)

- 图片列表瀑布流(Pinterest 风格,2-5 列响应式)
- 图片详情 + 大图 lightbox + 缩放拖拽 + 上下张切换
- 批量操作组件
- EXIF 信息展示

必输出:

- templates/content/node–image-post–full.html.twig
- templates/content/node–image-post–teaser.html.twig
- templates/views/views-view-unformatted–image-waterfall.html.twig
- components/masonry-grid/(SDC + JS)
- components/image-lightbox/(SDC + JS)
- components/exif-info/
- components/batch-toolbar/
- css/pages/{image-list,image-detail}.css
- js/{lightbox,batch-select}.js

▶ 分支 3c:文章体系 + Paragraph 模板 ⭐核心⭐ (PDF p8/9)

- 文章列表(掘金风格)+ 文章卡片
- 文章详情 + 阅读控制 + 目录侧边锚点 + 阅读进度条
- **6 个 Paragraph 类型的模板** (重要,前置已建好类型,这里渲染)

必输出:

- templates/content/node–article–full.html.twig
- templates/content/node–article–teaser.html.twig
- templates/views/views-view–article-list.html.twig
- components/article-toc/(SDC + JS,目录滚动联动)
- components/reading-controls/(SDC,字号/行距/夜间/护眼/专注)
- components/reading-progress/(SDC,顶部进度条)

⭐ Paragraph 模板(每个 paragraph type 一个 Twig 模板):

- templates/paragraphs/paragraph–text-block.html.twig
- templates/paragraphs/paragraph–quote-block.html.twig
- templates/paragraphs/paragraph–code-block.html.twig
  (集成 highlight.js 或 prism.js,本地 vendor)
- templates/paragraphs/paragraph–image-gallery.html.twig
  (按 field_layout 切换 grid/carousel/masonry 三种渲染)
- templates/paragraphs/paragraph–video-embed.html.twig
  (智能识别 YouTube/B 站/Vimeo URL,生成 iframe;有本地 mp4 则用 video 标签)
- templates/paragraphs/paragraph–cta-block.html.twig
  (按 field_style 切换 primary/secondary/gradient 三种样式)
- css/components/paragraphs.css

▶ 分支 3d:登录 + 错误页 (PDF p18/19)

- 登录/注册/找回密码
- 404/403/500/网络断开

必输出:

- templates/form/{user-login-form,user-register-form,user-pass}.html.twig
- templates/system/{page–system–403,page–system–404,page–system–500}.html.twig
- components/empty-state/(SDC,内嵌 SVG)
- js/network-detect.js
- css/pages/{auth,error}.css

【page–front.html.twig 必须演示 Twig Tweak 用法(分支 3a)】
{# 顶部 Banner #}

<section class="xedc-banner">
  {{ drupal_view('front_banner', 'block_1') }}
</section>

{# 分类导航 #}
{{ drupal_block(‘category_nav_block’) }}    {# 阶段4 dc_core 提供 #}

{# 个性化推荐流 (主区) #}

<main class="xedc-front__main">
  {{ drupal_view('front_recommend', 'default') }}
</main>

{# 侧边栏(PC 端) #}

<aside class="xedc-front__sidebar">
  {# 实时热榜 TOP10 #}
  {{ drupal_view('front_recommend', 'block_hot') }}

{# 推荐关注用户 #}
{{ drupal_block(‘xedc_recommend_users’) }}

{# 热门话题 #}
{{ drupal_view(‘topic_list’, ‘block_hot’) }}

</aside>

【node–article–full.html.twig 必须演示精细字段渲染(分支 3c)】

<article class="xedc-article">
  {# 阅读进度条 (固定顶部) #}
  {% include 'xedc:reading-progress' %}

{# 文章头 #}

  <header>
    <h1>{{ label }}</h1>
    {{ drupal_field('field_summary', 'node', node.id) }}
    {# 作者卡 + 阅读时长 + 字数 #}
    <div class="xedc-article__meta">
      {{ drupal_entity('user', node.uid.target_id, 'compact') }}
      <span>{{ node.field_reading_time.value }} 分钟阅读</span>
    </div>
  </header>

{# 封面 #}
{{ drupal_field(‘field_cover_image’, ‘node’, node.id) }}

{# 主区:左侧目录 + 右侧正文 #}

  <div class="xedc-article__layout">
    <aside class="xedc-article__toc">
      {% include 'xedc:article-toc' %}
    </aside>

```
<main class="xedc-article__content">
  {# 正文 paragraphs (核心) #}
  {{ content.field_body_paragraphs }}
</main>
```

  </div>

{# 互动栏 #}
{{ drupal_block(‘xedc_article_actions’, {nid: node.id}) }}

{# 阅读控制(浮动右下) #}
{% include ‘xedc:reading-controls’ %}

{# 推荐 #}
{{ drupal_view(‘article_list’, ‘block_related’, [node.field_category.target_id]) }}

</article>

【输出格式】
按全局约定,严格双标路径,单次 ≤12 文件超出停下。

【设计要求(三分支通用)】

- 列表页支持视图模式切换,?display= + localStorage
- 视频”已看”标记:JS 读 localStorage,后续接 xedc_core history API
- 图片瀑布流:CSS Grid + JS 计算列高 + IntersectionObserver 懒加载
- 文章详情阅读宽度 max-width: 720px,行高 1.75
- 错误页插画:inline SVG
- 视频播放器:第一阶段 <video src> 原生,留 data-hls-src 钩子
- 弹幕、投币:留 DOM 占位,onclick 弹”敬请期待”

【midnight 模式额外要求】

- 视频/图片在 [data-theme=“midnight”] 下加 filter: brightness(0.85),减少强光
- 代码块在 midnight 模式用更深的背景 oklch(0.05 0 0)
- 卡片阴影改成微微的 inset 描边代替 box-shadow

【BEM 命名】
.xedc-card / .xedc-card__header / .xedc-card–featured

【验收】

- 每分支 9 个 P0 页面 light/dark/midnight 三模式都正常
- 移动端 375 / 平板 768 / PC 1280 三档响应式
- 文章里 6 种 paragraph 类型都能正确渲染
- Lighthouse 性能 ≥ 85,可访问性 ≥ 95
- 控制台无 404 无 JS error

```
> **使用方法**:把上面提示词复制到 AI,在【任务范围】里只保留 3a/3b/3c/3d 其中一个,删掉其他三个。

---

## 阶段 4:P1 功能页面与 xedc_core 后端模块

> **依赖**:阶段 1+2+3 全部完成  
> **建议**:拆 2 次对话(4a xedc_core 模块 / 4b 5 个 P1 页面模板)

### 提示词
```

角色:Drupal 11 全栈开发,精通自定义模块、Controller、REST、search_api、flag、
private_message、message_notify、自定义 Field Formatter、Twig Tweak。

【前置已完成】

- 阶段 1-3 全部
- 已装 twig_tweak、paragraphs

【任务范围(二选一)】

▶ 分支 4a:xedc_core 自定义模块
仓库:drupal/modules/xedc_core/
服务器:/var/www/html/drupal11/web/modules/custom/xedc_core/

功能:

1. RESTful 接口
   POST /api/view/{nid}     浏览量+1(cookie 防刷)
   POST /api/like/{nid}     点赞切换(基于 flag)
   POST /api/collect/{nid}  收藏切换
   GET  /api/recommend/{nid} 猜你喜欢
   POST /api/follow/{uid}   关注切换
   GET  /api/search-suggest 搜索联想
   GET  /api/unread-count   未读消息计数
   POST /api/danmaku/{nid}  发弹幕(预留,阶段4后期接)
   GET  /api/danmaku/{nid}  拉弹幕
1. 历史记录:hook_node_view 写 history 表
1. 通知系统:基于 message + message_notify
   触发场景:点赞/评论/关注/系统
1. Block 插件(对应阶段3模板里 drupal_block 调用):
- HotRankBlock          (热榜)
- RecommendUsersBlock   (推荐关注用户)
- CategoryNavBlock      (分类导航,首页)
- ArticleActionsBlock   (文章互动栏:点赞/收藏/分享/字数)
- VideoActionsBlock     (视频互动栏:三连)
- RelatedContentBlock   (相关推荐)
1. Twig extension:
- |reading_time         给文本字符串估算阅读分钟
- |view_count_format    1.2k / 3.4w / 12.3m
- |relative_time        “3 分钟前”
1. composer require & drush en:
   composer require drupal/{flag,search_api,search_api_db,facets,
   private_message,message,message_notify,better_exposed_filters,
   views_infinite_scroll,captcha,recaptcha,honeypot}

输出文件清单(按全局约定格式):

- xedc_core.info.yml / xedc_core.module / xedc_core.routing.yml
  xedc_core.services.yml / xedc_core.permissions.yml / xedc_core.libraries.yml
- src/Controller/{View,Like,Collect,Recommend,Follow,Search,Notification,Danmaku}Controller.php
- src/Plugin/Block/{HotRank,RecommendUsers,CategoryNav,ArticleActions,
  VideoActions,RelatedContent}Block.php
- src/TwigExtension/XedcExtension.php
- src/EventSubscriber/{NodeViewSubscriber,UserLoginSubscriber}.php
- config/install/*.yml
- README.md

▶ 分支 4b:5 个 P1 页面模板 (PDF p10-14)

- 搜索结果页 (p10):search_api + facets + 关键词高亮 + 联想下拉
- 个人中心 (p11):user–full.html.twig + 5 tab + 数据 sparkline
- 他人主页 (p12):用户卡 + 关注按钮 + 私信 + 举报
- 内容发布 (p13):3 种发布表单 + 拖拽上传 + 分片 XHR + 草稿自动保存
  ⭐ 文章发布要支持 paragraph 编辑 (用 paragraphs 默认编辑器)
- 消息通知 (p14):会话列表 + 实时聊天 + 未读红点 + 三 tab 通知

输出在 themes/xedc/templates/ 与 components/ 下:

- templates/{user/user–full.html.twig,user/user–full–public.html.twig}
- templates/{search/page–search.html.twig,page–messages.html.twig}
- components/{search-tabs,search-filters,search-suggestion,
  user-stats,profile-tabs,follow-button,message-button,report-modal,
  upload-dropzone,cover-frame-extractor,markdown-editor,
  conversation-list,chat-window,notification-list}/

【约束】

- 所有 Ajax 带 X-CSRF-Token
- 上传:视频 2GB / 图片 10MB / 头像 2MB,nginx + PHP + .htaccess 三处配
- 搜索 index 用 search_api_db
- 私信启用 honeypot
- 所有页面给 cache tag

【验收】

- /search?q=xxx 搜出三种类型,facets 生效
- /user/me 自己主页,/user/{uid} 他人主页
- /publish 三种表单提交成功 (文章带 paragraphs)
- /messages 通知 + 会话 + 红点同步

```
---

## 阶段 5:P2 + 性能 + SEO

> **依赖**:阶段 1-4 全部完成

### 提示词
```

角色:Drupal 11 性能优化与 SEO 专家,熟悉 Redis、CDN、image_optimize、WebP、
metatag、simple_sitemap、JSON-LD。

【前置已完成】

- 阶段 0-4 全部

【任务】

▶ A. P2 三个页面 (PDF p15-17)

1. 话题标签页 /topics/{slug}
1. 收藏夹 /user/{uid}/collections, /collections/{folder_id}
   自定义实体 xedc_collection_folder
1. 历史记录 /user/me/history

▶ B. 性能优化

1. Redis 缓存 (composer require drupal/redis,settings.php diff)
1. 图片优化 (image_optimize_webp + responsive_image, 4 档 image styles)
1. CSS/JS 聚合 (preprocess on)
1. nginx 缓存 (静态 1y / HTML 5min / API 不缓存)
1. CDN (cdn.tlte.top 子域分离)

▶ C. SEO

1. composer require drupal/{metatag,simple_sitemap,redirect}
1. metatag 默认值与 token,差异化各内容类型
1. simple_sitemap 包含 video/image_post/article + topic + user
1. JSON-LD: xedc.theme 钩 hook_page_attachments
1. robots.txt 模板

【输出按全局约定格式】

【验收】

- /topics/{slug} 完整功能
- /user/me/collections 创建/重命名/拖拽/分享
- /user/me/history 分组历史与视频进度
- 首页 PageSpeed 移动端 ≥ 80
- view-source 看到 JSON-LD schema
- /sitemap.xml 包含全部内容

```
---

## 附录 A:对话节奏

| 阶段 | 对话数 | 单次文件数 | 累计天数 |
|------|--------|-----------|---------|
| 0    | 1     | 9         | 半天    |
| 1    | 2 (1a/1b) | ≤12 | 半天-1 天  |
| 2    | 1     | 操作清单   | 半天    |
| 3    | 4 (3a/3b/3c/3d) | ≤12 | 3-4 天  |
| 4    | 2 (4a/4b) | ≤12 | 2-3 天  |
| 5    | 1-2   | ≤15       | 1-2 天  |

**总计:11-13 次对话,8-11 天可完整跑下来。**

## 附录 B:每次新对话开头小抄
```

项目:XEDC 综合内容网站 Drupal 11 主题
仓库:github.com/xxedc/docs/drupal/
服务器 Drupal 根:/var/www/html/drupal11/web/
主题:xedc(themes/custom/xedc),自定义模块:xedc_core(modules/custom/xedc_core)
三色模式:light/dark/midnight,根属性 [data-theme]
已装关键模块:twig_tweak、paragraphs、admin_toolbar、pathauto、token、
field_group、file_mdm、image_widget_crop、metatag

当前阶段:【填编号 0/1a/1b/2/3a/3b/3c/3d/4a/4b/5】
前置已完成:【列出关键产出】
本次任务:【具体到哪些文件】
输出格式:每文件单独代码块,顶部双标 GitHub 路径 + 服务器路径,单次≤12 文件

```
## 附录 C:contrib 模块一次性安装

```bash
ssh 进服务器:
cd /var/www/html/drupal11
composer require \
  drupal/admin_toolbar drupal/pathauto drupal/token drupal/redirect \
  drupal/field_group drupal/file_mdm drupal/image_widget_crop \
  drupal/metatag drupal/simple_sitemap \
  drupal/twig_tweak drupal/paragraphs drupal/entity_reference_revisions \
  drupal/flag drupal/search_api drupal/search_api_db drupal/facets \
  drupal/better_exposed_filters drupal/views_infinite_scroll \
  drupal/private_message drupal/message drupal/message_notify \
  drupal/captcha drupal/recaptcha drupal/honeypot \
  drupal/redis drupal/cdn \
  drupal/imageapi_optimize_webp drupal/responsive_image

drush en \
  admin_toolbar admin_toolbar_tools pathauto token redirect \
  field_group file_mdm image_widget_crop metatag \
  twig_tweak paragraphs entity_reference_revisions -y
drush cr

# 把 composer.json composer.lock 同步回 git
cp composer.json composer.lock /opt/dc-repo/drupal/
cd /opt/dc-repo
git add drupal/composer.* && git commit -m "deps: 安装 contrib 模块" && git push
```

## 附录 D:Twig Tweak 速查 (模板里直接用)

```twig
{# 视图 #}
{{ drupal_view('view_name', 'display_id') }}
{{ drupal_view('article_list', 'block_related', category_id) }}      {# 带参数 #}

{# 块 #}
{{ drupal_block('plugin_id') }}
{{ drupal_block('plugin_id', {label: '标题', label_display: 'visible'}) }}

{# 菜单 #}
{{ drupal_menu('main') }}
{{ drupal_menu('footer', 0, 1) }}                                    {# level 0,depth 1 #}

{# 单字段 #}
{{ drupal_field('field_cover_image', 'node', node.id) }}
{{ drupal_field('field_cover_image', 'node', node.id, 'card') }}     {# 用 card 显示模式 #}

{# 实体 #}
{{ drupal_entity('node', 123, 'teaser') }}
{{ drupal_entity('user', uid, 'compact') }}

{# 图片 #}
{{ drupal_image(fid, 'card_640') }}                                  {# 用 image style #}

{# Token #}
{{ drupal_token('site:name') }}
{{ drupal_token('node:title') }}

{# 配置 #}
{{ drupal_config('system.site', 'name') }}

{# Region #}
{{ drupal_region('sidebar_first') }}

{# 参数处理 #}
{% set my_var = drupal_view_result('article_list')|length %}        {# 获取行数 #}
```

## 附录 E:Paragraph 模板套路

每个 paragraph type 的模板放 `themes/xedc/templates/paragraphs/paragraph--{bundle}.html.twig`
命名规则:bundle 名里的下划线变连字符 (text_block → text-block)

模板基本结构:

```twig
{# paragraph--code-block.html.twig #}
<figure class="xedc-code">
  {% if content.field_filename|render %}
    <figcaption>{{ content.field_filename }}</figcaption>
  {% endif %}
  <pre><code class="language-{{ paragraph.field_language.value }}">
    {{- content.field_code -}}
  </code></pre>
</figure>
```

挂载 Prism.js 高亮:

- xedc.libraries.yml 添加 prism 库
- xedc.theme preprocess_paragraph 时 attach ‘xedc/prism’

## 附录 F:常用 Drush 速查

```bash
cd /var/www/html/drupal11
drush cr                                   # 清缓存
drush updb -y                              # 数据库更新
drush cim -y                               # 配置导入
drush cex -y                               # 配置导出
drush en {module} -y                       # 启用模块
drush theme:install xedc                   # 安装主题
drush config:set system.theme default xedc -y
drush sset system.maintenance_mode 1 -y    # 维护模式
drush user:create test --mail=t@t.com --password=xxx
drush sql:dump > /tmp/db-$(date +%F).sql
drush php:eval "print_r(...)"              # 临时执行 PHP
```

## 附录 G:故障排查

|问题                   |处理                                                  |
|---------------------|----------------------------------------------------|
|deploy.sh 卡 git pull |检查到 github 网络,可加 https proxy                        |
|rsync 权限错            |chown -R www-data:www-data web/{themes,modules}     |
|drush cim 失败 UUID 不匹配|第一次同步:先 drush cex 让本地 UUID 对齐                       |
|主题改动不生效              |drush cr;清空 sites/default/files/css/                |
|三模式切换闪屏              |theme-toggle 初始化必须放 <head> 同步执行                     |
|瀑布流错位                |加 ResizeObserver,IntersectionObserver 触发时机          |
|Paragraph 模板不生效      |命名:paragraph–{bundle-with-dash}.html.twig + drush cr|
|Twig Tweak 调用报错      |确认 twig_tweak 模块已 drush en                          |
|midnight 模式图片刺眼      |<html> filter: brightness(0.85) on images           |

## 附录 H:GitHub 网页快速添加文件

不用 clone 也能加文件:

1. 打开 github.com/xxedc/docs
1. 进入 drupal/ 目录(若不存在,根目录 Add file → Create new file,文件名输 `drupal/README.md` 自动建目录)
1. Add file → Create new file
1. 文件名输完整路径如 `themes/xedc/xedc.info.yml`(在 drupal/ 里输会自动拼上)
1. 粘贴 AI 给的代码,Commit changes

进阶:把 .com 改 .dev (github.dev),用 VSCode 网页版批量编辑,效率高。
也可:本地 git clone + VSCode 改完一次性 push。
