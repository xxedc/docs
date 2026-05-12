# image-skill

能力：
- 理解 gallery system（`image_post` + `image_waterfall`）
- 生成 ImageCard 与瀑布流布局
- 做 media optimization（封面优先、懒加载、占位）

字段规则：
- `image_post.field_image` 是图片内容的直接图片字段。
- `image_post.field_media` 是引用 `media:image` 的多媒体字段，图片文件来自 media entity 的 `field_media_image`。
- 图集详情页必须合并展示 `field_image` 与 `field_media.field_media_image`，不得只在侧栏以“关联媒体”原始字段形式展示。
- 字段定义必须以 `drupal/config/sync/field.field.node.image_post.*` 和 media image display 配置为准。
