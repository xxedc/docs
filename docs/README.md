# AI Media Platform System（Drupal + Video + Image + Article + shadcn/ui）

本目录是该仓库的 **AI 系统入口**。目标是让 AI 通过反向工程 Drupal 配置，自动理解内容结构、Feed 结构与 UI 组件系统，并统一到 shadcn/ui 设计语言。

## 读取顺序（强烈建议）
1. `ai/rules.md`（全局行为约束）
2. `ai/drupal-rules.md` / `ai/ui-rules.md`
3. `docs/architecture.md`
4. `docs/drupal/*.md`
5. `docs/ui/*.md`
6. `skills/*.md`

## Skills 优先级
1. `drupal-reverse-engineering-skill.md`：先抽取结构，再做生成。
2. `feed-skill.md`：将 Views 统一抽象为 Feed System。
3. `video-skill.md` / `image-skill.md` / `article-skill.md`：按内容类型生成能力。
4. `ui-shadcn-skill.md`：收敛到统一 shadcn/ui token 与组件规则。

## 子系统导航
- Drupal 反向工程：`docs/drupal/`
- UI 系统：`docs/ui/`
- AI Rules：`ai/`
- Skills：`skills/`
