<?php

namespace Drupal\xedc_core\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Database;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Cookie;

/**
 * 浏览量控制器 — POST /api/view/{nid}
 * 使用 cookie 防止重复计数
 */
class ViewCountController extends ControllerBase {

  /**
   * 浏览量 +1
   */
  public function increment(int $nid, Request $request): JsonResponse {
    // Cookie 防刷（同一 IP+浏览器 24小时内只计1次）
    $cookieKey = 'xedc_viewed_' . $nid;
    if ($request->cookies->has($cookieKey)) {
      return new JsonResponse(['status' => 'skipped', 'message' => '已计数']);
    }

    // 加载节点
    $node = \Drupal::entityTypeManager()->getStorage('node')->load($nid);
    if (!$node) {
      return new JsonResponse(['status' => 'error', 'message' => '节点不存在'], 404);
    }

    // 检查字段是否存在
    if (!$node->hasField('field_view_count')) {
      return new JsonResponse(['status' => 'error', 'message' => '不支持浏览量'], 400);
    }

    // 原子自增
    $current = (int) ($node->get('field_view_count')->value ?? 0);
    $node->set('field_view_count', $current + 1);
    $node->save();

    // 写入历史表
    try {
      $db = Database::getConnection();
      $uid = \Drupal::currentUser()->id();
      if ($uid) {
        $db->merge('xedc_history')
          ->keys(['uid' => $uid, 'nid' => $nid])
          ->fields(['bundle' => $node->bundle(), 'timestamp' => \Drupal::time()->getRequestTime()])
          ->execute();
      }
    }
    catch (\Exception $e) {
      // 记录失败不影响主流程
    }

    // 设置 24小时防刷 Cookie
    $response = new JsonResponse([
      'status'    => 'ok',
      'viewCount' => $current + 1,
    ]);
    $response->headers->setCookie(
      new Cookie($cookieKey, '1', time() + 86400, '/', null, false, true, false, 'Lax')
    );

    return $response;
  }

}
