<?php

namespace Drupal\xedc_core\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Database;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * 点赞控制器 — POST /api/like/{nid}
 */
class LikeController extends ControllerBase {

  public function toggle(int $nid, Request $request): JsonResponse {
    // 验证 CSRF Token
    $token = $request->headers->get('X-CSRF-Token') ?? '';
    if (!\Drupal::csrfToken()->validate($token, 'xedc-api')) {
      return new JsonResponse(['status' => 'error', 'message' => 'CSRF验证失败'], 403);
    }

    $uid = \Drupal::currentUser()->id();
    if (!$uid) {
      return new JsonResponse(['status' => 'error', 'message' => '请先登录'], 401);
    }

    $node = \Drupal::entityTypeManager()->getStorage('node')->load($nid);
    if (!$node || !$node->hasField('field_like_count')) {
      return new JsonResponse(['status' => 'error', 'message' => '节点不存在'], 404);
    }

    $db = Database::getConnection();

    // 检查是否已点赞
    $existing = $db->select('xedc_likes', 'l')
      ->fields('l', ['id'])
      ->condition('uid', $uid)
      ->condition('nid', $nid)
      ->execute()
      ->fetchField();

    $currentCount = (int) ($node->get('field_like_count')->value ?? 0);

    if ($existing) {
      // 取消点赞
      $db->delete('xedc_likes')
        ->condition('uid', $uid)
        ->condition('nid', $nid)
        ->execute();
      $newCount = max(0, $currentCount - 1);
      $liked = false;
    }
    else {
      // 点赞
      $db->insert('xedc_likes')
        ->fields(['uid' => $uid, 'nid' => $nid, 'timestamp' => time()])
        ->execute();
      $newCount = $currentCount + 1;
      $liked = true;
    }

    // 更新节点计数
    $node->set('field_like_count', $newCount);
    $node->save();

    return new JsonResponse([
      'status'    => 'ok',
      'liked'     => $liked,
      'likeCount' => $newCount,
    ]);
  }

}
