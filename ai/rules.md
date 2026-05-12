# AI 全局规则

1. 必须先 reverse engineering，再做模型抽象。
2. 字段结构必须来自 `config/sync`，禁止猜测与 hardcode。
3. 输出内容需中文解释，术语保留英文。
4. UI 统一走 shadcn/ui 风格与 token。

## 路径规则

- 仓库根目录是 `github.com/xxedc/docs`，本地根目录通常是 `/workspace/docs`。
- `docs/` 是仓库根目录下的文档目录；不要把仓库名 `docs` 当成需要再创建的子目录。
- Drupal 文档写入 `docs/drupal/`，UI 文档写入 `docs/ui/`。
- 禁止生成 `docs/docs/`、`docs/docs/drupal/`、`docs/docs/ui/` 这类重复目录。
- Drupal 站点代码、主题、模块和配置写入根目录下的 `drupal/`，不是 `docs/drupal/`。
