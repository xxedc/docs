<?php
namespace Drupal\xedc_core\Controller;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Database;
use Symfony\Component\HttpFoundation\JsonResponse;

class NotificationController extends ControllerBase {
  public function unreadCount(): JsonResponse {
    $uid = \Drupal::currentUser()->id();
    if (!$uid) {
      return new JsonResponse(['count' => 0]);
    }
    try {
      $count = Database::getConnection()
        ->select('xedc_notifications', 'n')
        ->condition('uid', $uid)
        ->condition('is_read', 0)
        ->countQuery()->execute()->fetchField();
    } catch (\Exception $e) {
      $count = 0;
    }
    return new JsonResponse(['count' => (int) $count]);
  }
}
