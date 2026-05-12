# Design System（shadcn/ui 风格）

## Tokens
- Colors：`primary / secondary / muted / card / background / foreground`
- Spacing：4px 基线（4/8/12/16/24/32）
- Radius：`rounded-md`（主）、`rounded-lg`（强调）
- Shadows：subtle（sm/md），hover 提升 1 级
- Typography：标题强调层级，正文高可读行高

## Drupal -> UI Token 映射
- `field_cover_image` -> Card Cover
- `title` -> Card Title
- `field_summary/body` -> Card Description
- `field_tags` -> Badge Group
- `field_duration/field_reading_time` -> Meta Badge
- `field_view_count/field_like_count` -> Secondary Meta

## 风格约束
- card-based layout
- neutral color system
- mobile-first
- dark mode soft black
