# Drupal Rules

- 必须基于 `drupal/config/sync`
- 不允许猜字段
- 不允许 hardcode schema
- 必须 reverse engineering content type / fields / views / taxonomy

## 路径约束

- 读取配置：`drupal/config/sync`。
- 修改 Drupal 代码：`drupal/modules/`、`drupal/themes/`、`drupal/config/`。
- 撰写 Drupal 说明文档：`docs/drupal/`。
- 不得把 Drupal 代码写入 `docs/drupal/`，也不得创建 `docs/docs/drupal/`。
