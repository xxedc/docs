# Feed System

## 统一规则
- Grid：视频/文章采用规则栅格；图片支持 waterfall。
- 数据来源：Drupal Views（video_list/image_waterfall/article_list）。
- 分页：优先 pager，可切换 infinite scroll（已有 `js/infinite-scroll.js`）。
- 响应式：mobile 1 列 -> tablet 2~3 列 -> desktop 4+ 列。

## Card Layout Rules
- 优先展示封面（media priority #1）
- 次级展示标题与摘要
- 最后展示互动指标与标签

## Media Priority Rules
1. `field_cover_image`
2. `field_image` / `field_media`
3. 默认占位 skeleton
