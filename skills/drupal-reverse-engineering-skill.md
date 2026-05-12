# drupal-reverse-engineering-skill

核心能力：
- 从 `drupal/config/sync` 反推结构
- 自动识别 content types
- 自动识别 field relationship（storage + field instance + display）
- 构建数据模型图（内容类型 -> 字段 -> taxonomy/views）

路径纪律：
- 仓库根目录已经是 `xxedc/docs`，不要额外创建 `docs/docs/`。
- Drupal 配置源只读 `drupal/config/sync`。
- Drupal 文档输出到 `docs/drupal/`。
- Drupal 代码输出到 `drupal/`。
