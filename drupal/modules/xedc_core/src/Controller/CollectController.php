<?php

namespace Drupal\xedc_core\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Database;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * 收藏控制器 — POST /api/collect/{nid}
 */
class CollectController extends ControllerBase {

  public function toggle(int $nid, Request $request): JsonResponse {
    $token = $request->headers->get('X-CSRF-Token') ?? '';
    if (!\Drupal::csrfToken()->validate($token, 'xedc-api')) {
      return new JsonResponse(['status' => 'error', 'message' => 'CSRF验证失败'], 403);
    }

    $uid = \Drupal::currentUser()->id();
    if (!$uid) {
      return new JsonResponse(['status' => 'error', 'message' => '请先登录'], 401);
    }

    $node = \Drupal::entityTypeManager()->getStorage('node')->load($nid);
    if (!$node) {
      return new JsonResponse(['status' => 'error', 'message' => '节点不存在'], 404);
    }

    $db = Database::getConnection();

    $existing = $db->select('xedc_collects', 'c')
      ->fields('c', ['id'])
      ->condition('uid', $uid)
      ->condition('nid', $nid)
      ->execute()
      ->fetchField();

    if ($existing) {
      $db->delete('xedc_collects')
        ->condition('uid', $uid)
        ->condition('nid', $nid)
        ->execute();
      $collected = false;
    }
    else {
      $db->insert('xedc_collects')
        ->fields(['uid' => $uid, 'nid' => $nid, 'timestamp' => time()])
        ->execute();
      $collected = true;
    }

    return new JsonResponse([
      'status'    => 'ok',
      'collected' => $collected,
    ]);
  }

}
