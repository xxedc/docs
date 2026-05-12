# 系统架构总览

## 目标
把当前 Drupal 多媒体站点抽象成 AI 可理解平台，包含：
- 数据层：基于 `drupal/config/sync` 自动推断内容模型。
- 表现层：基于 `drupal/themes/xedc` 统一为 shadcn/ui 风格。
- 能力层：以 `skills/*.md` 组织可复用 AI 能力。

## 扫描范围
- `drupal/config/sync/`
- `drupal/modules/xedc_core/`
- `drupal/themes/xedc/`

## 分层
1. **Drupal Model Layer**：content type、field storage、field instance、display、taxonomy、views。
2. **Feed Layer**：将不同 views 统一映射成 FeedGrid / Card 流。
3. **UI Layer**：token + component + page template（shadcn 风格）。
4. **AI Skill Layer**：按 video/image/article/feed/ui/drupal-re 组织任务能力。
