# Views 系统（重点）

已识别关键视图：
- 视频列表：`views.view.video_list.yml`
- 图片瀑布流：`views.view.image_waterfall.yml`
- 文章列表：`views.view.article_list.yml`
- 首页/推荐：`views.view.frontpage.yml`、`views.view.front_recommend.yml`
- 热榜：`views.view.hot_rank.yml`

## Feed 抽象
所有列表型 view 可统一映射为：
- 数据输入：View Query + Filters + Sort
- UI 输出：FeedGrid（Card 集合）
- 分页策略：pager / infinite scroll（主题含 `js/infinite-scroll.js`）

## 建议映射
- `video_list` -> `FeedGrid<VideoCard>`
- `image_waterfall` -> `FeedGrid<ImageCard>(masonry/waterfall)`
- `article_list` -> `FeedGrid<ArticleCard>`
