<?php

namespace Drupal\xedc_core\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * 分类导航 Block
 *
 * @Block(
 *   id = "xedc_category_nav",
 *   admin_label = @Translation("XEDC 分类导航"),
 *   category = @Translation("XEDC")
 * )
 */
class CategoryNavBlock extends BlockBase {

  public function build(): array {
    // 从 categories 词汇表获取词条
    $terms = \Drupal::entityTypeManager()
      ->getStorage('taxonomy_term')
      ->loadByProperties(['vid' => 'categories', 'status' => 1]);

    $items = [];

    // 固定导航项
    $items[] = ['label' => '视频', 'url' => '/videos', 'icon' => '🎬'];
    $items[] = ['label' => '图片', 'url' => '/images', 'icon' => '🖼️'];
    $items[] = ['label' => '文章', 'url' => '/articles', 'icon' => '📝'];

    // 动态分类词条
    foreach ($terms as $term) {
      $items[] = [
        'label' => $term->getName(),
        'url'   => '/articles?category=' . $term->id(),
        'icon'  => '🏷️',
        'tid'   => $term->id(),
      ];
    }

    return [
      '#theme'  => 'xedc_category_nav',
      '#items'  => $items,
      '#cache'  => [
        'tags'    => ['taxonomy_term_list:categories'],
        'max-age' => 3600,
      ],
    ];
  }
}
