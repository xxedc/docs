# 页面系统

## Video List Page
- 数据：`views.view.video_list.yml`
- 组件：`FeedGrid<VideoCard>`
- 交互：筛选（分类/标签）+ 分页/无限滚动

## Image Gallery Page
- 数据：`views.view.image_waterfall.yml`
- 组件：`FeedGrid<ImageCard>`（waterfall）
- 交互：懒加载 + 比例自适应

## Article Feed Page
- 数据：`views.view.article_list.yml`
- 组件：`FeedGrid<ArticleCard>`
- 交互：摘要阅读 + 阅读时长标记
