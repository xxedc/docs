<?php

namespace Drupal\xedc_core\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * 视频互动栏 Block
 *
 * @Block(
 *   id = "xedc_video_actions",
 *   admin_label = @Translation("XEDC 视频互动栏"),
 *   category = @Translation("XEDC")
 * )
 */
class VideoActionsBlock extends BlockBase {

  public function build(): array {
    $node = \Drupal::routeMatch()->getParameter('node');
    if (!$node || $node->bundle() !== 'video') {
      return [];
    }

    return [
      '#attached' => ['library' => ['xedc_core/interactions']],
      '#markup'   => sprintf(
        '<div class="xedc-video-actions" data-nid="%d"></div>',
        $node->id()
      ),
    ];
  }

  public function getCacheMaxAge(): int {
    return 0;
  }
}
