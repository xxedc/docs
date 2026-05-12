# 组件系统

| 内容类型 | UI组件 |
|---|---|
| Video | VideoCard |
| Image | ImageCard |
| Article | ArticleCard |
| View | FeedGrid |

## VideoCard
- 结构：Cover + Duration Badge + Title + Meta + Tags
- Twig 示例：
```twig
<article class="rounded-lg border bg-card shadow-sm hover:shadow-md">
  <img src="{{ cover }}" alt="{{ title }}" />
  <div class="p-4">
    <h3>{{ title }}</h3>
    <p>{{ duration }}</p>
  </div>
</article>
```
- 状态：hover / loading / skeleton（参考 `components/skeleton/*`）

## ImageCard
- 结构：Responsive Image + Caption + Tag Badges
- 状态：支持 masonry 高度自适应。

## ArticleCard
- 结构：Cover + Title + Summary + ReadingTime + Category
- 状态：阅读模式强调文字对比。

## FeedGrid
- 结构：grid 容器 + card items
- 规则：gap 使用 4px 体系倍数；断点优先移动端。
