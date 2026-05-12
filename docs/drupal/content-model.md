# Content Model（自动推断）

> 仅基于 `drupal/config/sync` 反推，不做人工 schema 预设。

## 识别到的核心内容类型
- `video`（`node.type.video.yml`）
- `image_post`（`node.type.image_post.yml`）
- `article`（`node.type.article.yml`）

## Video 模型
来源：`field.field.node.video.*.yml`
- 视频主体：`field_video_file` / `field_video_url`
- 展示：`field_cover_image`（required）
- 元数据：`field_duration`、`field_quality`
- 分发：`field_category`、`field_tags`
- 互动：`field_like_count`、`field_view_count`、`field_allow_comment`

## Image 模型（image_post）
来源：`field.field.node.image_post.*.yml`
- 图片主体：`field_image`、`field_media`
- 展示：`field_cover_image`（required）
- 元数据：`field_orientation`
- 分发：`field_category`、`field_tags`
- 互动：`field_like_count`、`field_view_count`、`field_allow_download`

## Article 模型
来源：`field.field.node.article.*.yml`
- 文本主体：`body`、`field_body_paragraphs`、`field_summary`
- 展示：`field_cover_image`（required）、`field_image`
- 分发：`field_category`、`field_tags`
- 阅读属性：`field_reading_time`
- 互动：`field_like_count`、`field_view_count`、`comment`、`field_allow_comment`
