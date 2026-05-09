<?php

namespace Drupal\xedc_core\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Cache\Cache;

/**
 * 热门榜单 Block
 *
 * @Block(
 *   id = "xedc_hot_rank",
 *   admin_label = @Translation("XEDC 热门榜单"),
 *   category = @Translation("XEDC")
 * )
 */
class HotRankBlock extends BlockBase {

  public function build(): array {
    // 查询浏览量最高的10篇内容
    $query = \Drupal::entityQuery('node')
      ->condition('status', 1)
      ->condition('type', ['video', 'image_post', 'article'], 'IN')
      ->sort('field_view_count', 'DESC')
      ->range(0, 10)
      ->accessCheck(TRUE);

    $nids = $query->execute();
    $nodes = \Drupal::entityTypeManager()
      ->getStorage('node')
      ->loadMultiple($nids);

    $items = [];
    foreach ($nodes as $node) {
      $items[] = [
        'title'      => $node->getTitle(),
        'url'        => $node->toUrl()->toString(),
        'view_count' => $node->hasField('field_view_count')
          ? (int) $node->get('field_view_count')->value
          : 0,
        'bundle'     => $node->bundle(),
      ];
    }

    return [
      '#theme'   => 'xedc_hot_rank',
      '#items'   => $items,
      '#cache'   => ['max-age' => 300], // 5分钟缓存
    ];
  }

  public function getCacheMaxAge(): int {
    return 300;
  }

}
