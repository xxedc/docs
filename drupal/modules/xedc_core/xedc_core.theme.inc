<?php

/**
 * @file
 * xedc_core.theme.inc — 注册自定义 Twig 模板
 */

/**
 * 实现 hook_theme()
 */
function xedc_core_theme(): array {
  return [
    // 热榜
    'xedc_hot_rank' => [
      'variables' => ['items' => []],
      'template'  => 'xedc-hot-rank',
    ],
    // 分类导航
    'xedc_category_nav' => [
      'variables' => ['items' => []],
      'template'  => 'xedc-category-nav',
    ],
    // 文章互动栏
    'xedc_article_actions' => [
      'variables' => ['node' => NULL, 'nid' => 0, 'like_count' => 0, 'is_logged_in' => FALSE],
      'template'  => 'xedc-article-actions',
    ],
    // 相关推荐
    'xedc_related_content' => [
      'variables' => ['items' => []],
      'template'  => 'xedc-related-content',
    ],
    // 推荐关注用户
    'xedc_recommend_users' => [
      'variables' => ['items' => []],
      'template'  => 'xedc-recommend-users',
    ],
  ];
}
