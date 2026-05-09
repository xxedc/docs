<?php

namespace Drupal\xedc_core\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * 相关内容推荐 Block
 *
 * @Block(
 *   id = "xedc_related_content",
 *   admin_label = @Translation("XEDC 相关推荐"),
 *   category = @Translation("XEDC")
 * )
 */
class RelatedContentBlock extends BlockBase {

  public function build(): array {
    $node = \Drupal::routeMatch()->getParameter('node');
    if (!$node) return [];

    $bundle = $node->bundle();
    $nid    = $node->id();

    // 查同类型其他内容
    $query = \Drupal::entityQuery('node')
      ->condition('status', 1)
      ->condition('type', $bundle)
      ->condition('nid', $nid, '!=')
      ->sort('field_view_count', 'DESC')
      ->range(0, 6)
      ->accessCheck(TRUE);

    // 尝试匹配同分类
    if ($node->hasField('field_category') && !$node->get('field_category')->isEmpty()) {
      $catId = $node->get('field_category')->target_id;
      $query->condition('field_category', $catId);
    }

    $nids  = $query->execute();
    $nodes = \Drupal::entityTypeManager()->getStorage('node')->loadMultiple($nids);

    if (empty($nodes)) {
      // 退回：不限分类
      $fallback = \Drupal::entityQuery('node')
        ->condition('status', 1)
        ->condition('type', $bundle)
        ->condition('nid', $nid, '!=')
        ->sort('field_view_count', 'DESC')
        ->range(0, 6)
        ->accessCheck(TRUE)
        ->execute();
      $nodes = \Drupal::entityTypeManager()->getStorage('node')->loadMultiple($fallback);
    }

    $items = [];
    foreach ($nodes as $n) {
      $items[] = [
        'title'      => $n->getTitle(),
        'url'        => $n->toUrl()->toString(),
        'bundle'     => $n->bundle(),
        'view_count' => $n->hasField('field_view_count')
          ? (int) $n->get('field_view_count')->value : 0,
      ];
    }

    return [
      '#theme' => 'xedc_related_content',
      '#items' => $items,
      '#cache' => [
        'contexts' => ['route'],
        'max-age'  => 600,
      ],
    ];
  }
}
