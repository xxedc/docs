<?php
namespace Drupal\xedc_core\Controller;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Database;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class FollowController extends ControllerBase {
  public function toggle(int $uid, Request $request): JsonResponse {
    $token = $request->headers->get('X-CSRF-Token') ?? '';
    if (!\Drupal::csrfToken()->validate($token, 'xedc-api')) {
      return new JsonResponse(['status' => 'error', 'message' => 'CSRF验证失败'], 403);
    }
    $currentUid = \Drupal::currentUser()->id();
    if (!$currentUid) {
      return new JsonResponse(['status' => 'error', 'message' => '请先登录'], 401);
    }
    if ($currentUid == $uid) {
      return new JsonResponse(['status' => 'error', 'message' => '不能关注自己'], 400);
    }
    $db = Database::getConnection();
    $existing = $db->select('xedc_follows', 'f')
      ->fields('f', ['id'])
      ->condition('follower_id', $currentUid)
      ->condition('followee_id', $uid)
      ->execute()->fetchField();
    if ($existing) {
      $db->delete('xedc_follows')
        ->condition('follower_id', $currentUid)
        ->condition('followee_id', $uid)
        ->execute();
      $following = false;
    } else {
      $db->insert('xedc_follows')
        ->fields(['follower_id' => $currentUid, 'followee_id' => $uid, 'timestamp' => time()])
        ->execute();
      $following = true;
    }
    return new JsonResponse(['status' => 'ok', 'following' => $following]);
  }
}
