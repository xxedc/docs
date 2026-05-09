<?php

namespace Drupal\xedc_core\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * 推荐关注用户 Block
 *
 * @Block(
 *   id = "xedc_recommend_users",
 *   admin_label = @Translation("XEDC 推荐关注用户"),
 *   category = @Translation("XEDC")
 * )
 */
class RecommendUsersBlock extends BlockBase {

  public function build(): array {
    $currentUid = \Drupal::currentUser()->id();

    // 查询最近活跃的用户（有发布内容的）
    $query = \Drupal::entityQuery('node')
      ->condition('status', 1)
      ->sort('created', 'DESC')
      ->range(0, 20)
      ->accessCheck(TRUE);
    $nids  = $query->execute();
    $nodes = \Drupal::entityTypeManager()->getStorage('node')->loadMultiple($nids);

    $uids = [];
    foreach ($nodes as $node) {
      $uid = (int) $node->getOwnerId();
      if ($uid && $uid !== $currentUid) {
        $uids[$uid] = true;
      }
      if (count($uids) >= 5) break;
    }

    $users = \Drupal::entityTypeManager()
      ->getStorage('user')
      ->loadMultiple(array_keys($uids));

    $items = [];
    foreach ($users as $user) {
      $items[] = [
        'uid'      => $user->id(),
        'name'     => $user->getDisplayName(),
        'url'      => $user->toUrl()->toString(),
        'initials' => mb_substr($user->getDisplayName(), 0, 1),
      ];
    }

    return [
      '#theme' => 'xedc_recommend_users',
      '#items' => $items,
      '#cache' => [
        'contexts' => ['user'],
        'max-age'  => 1800,
      ],
    ];
  }
}
