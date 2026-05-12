# Field 系统（自动反推）

## 方法
分析对象：
- `field.storage.*`
- `field.field.*`
- `core.entity_view_display.*`
- `core.entity_form_display.*`

## 关键字段清单（示例）
| 来源文件 | 类型 | 关联内容 | AI 用途解释 |
|---|---|---|---|
| `field.storage.node.field_video_url.yml` + `field.field.node.video.field_video_url.yml` | link/string 类 | video | 提供外链播放入口，用于 VideoCard 的播放按钮逻辑。 |
| `field.storage.node.field_video_file.yml` + `field.field.node.video.field_video_file.yml` | media/file 引用 | video | 提供站内视频源，供播放器优先加载本地资源。 |
| `field.storage.node.field_cover_image.yml` + `field.field.node.*.field_cover_image.yml` | image/media 引用 | video/image_post/article | 统一卡片封面字段，映射 UI 的 Card Cover 区。 |
| `field.storage.node.field_duration.yml` + `field.field.node.video.field_duration.yml` | string/int | video | 用于 VideoCard 时长 badge。 |
| `field.storage.node.field_reading_time.yml` + `field.field.node.article.field_reading_time.yml` | int | article | 用于文章阅读时长标签。 |
| `field.storage.node.field_orientation.yml` + `field.field.node.image_post.field_orientation.yml` | list/string | image_post | 用于瀑布流比例与裁剪策略。 |
| `field.storage.node.field_tags.yml` + `field.field.node.*.field_tags.yml` | taxonomy term 引用 | 全内容 | 作为推荐、过滤、语义检索向量标签。 |
| `field.storage.node.field_category.yml` + `field.field.node.*.field_category.yml` | taxonomy term 引用 | 全内容 | 作为主 feed 分区维度。 |
| `field.storage.node.field_view_count.yml` + `field.field.node.*.field_view_count.yml` | int | 全内容 | 排序信号（热度）。 |
| `field.storage.node.field_like_count.yml` + `field.field.node.*.field_like_count.yml` | int | 全内容 | 互动权重信号。 |

## Display 推断
- 视图显示：`core.entity_view_display.node.video.default.yml`、`...teaser.yml`、`article.*`、`image_post.*`
- 表单显示：`core.entity_form_display.node.video.default.yml`、`article.default.yml`、`image_post.default.yml`

AI 可据此区分：编辑字段优先级（form）与消费展示优先级（view）。
