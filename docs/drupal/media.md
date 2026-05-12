# Media 系统

相关配置线索：
- `field.storage.media.field_media_image.yml`
- `field.field.node.video.field_video_file.yml`
- `field.field.node.image_post.field_media.yml`

结论：
- 平台混用 Node 字段与 Media 引用。
- Video 既支持 `field_video_file`（站内）又支持 `field_video_url`（外链）。
- Image 内容同时存在 `field_image` 与 `field_media`，可做兼容读取顺序。
