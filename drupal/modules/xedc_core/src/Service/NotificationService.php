<?php

namespace Drupal\xedc_core\Service;

use Drupal\Core\Database\Connection;
use Drupal\Core\Session\AccountInterface;

/**
 * 通知服务
 */
class NotificationService {

  public function __construct(
    protected Connection $database,
    protected AccountInterface $currentUser,
  ) {}

  /**
   * 创建通知
   *
   * @param int    $uid      接收通知的用户ID
   * @param string $type     通知类型：like/comment/follow/system
   * @param string $message  通知内容
   * @param int    $entityId 相关内容ID（可选）
   * @param int    $actorId  触发者用户ID（可选）
   */
  public function create(int $uid, string $type, string $message, int $entityId = 0, int $actorId = 0): void {
    // 不给自己发通知
    if ($uid === (int) $this->currentUser->id()) return;

    try {
      $this->database->insert('xedc_notifications')
        ->fields([
          'uid'       => $uid,
          'type'      => $type,
          'message'   => $message,
          'entity_id' => $entityId ?: NULL,
          'actor_id'  => $actorId ?: NULL,
          'is_read'   => 0,
          'timestamp' => time(),
        ])
        ->execute();
    }
    catch (\Exception $e) {}
  }

  /**
   * 获取用户通知列表
   */
  public function getNotifications(int $uid, bool $unreadOnly = false, int $limit = 20): array {
    try {
      $query = $this->database->select('xedc_notifications', 'n')
        ->fields('n')
        ->condition('uid', $uid)
        ->orderBy('timestamp', 'DESC')
        ->range(0, $limit);

      if ($unreadOnly) {
        $query->condition('is_read', 0);
      }

      return $query->execute()->fetchAll() ?: [];
    }
    catch (\Exception $e) {
      return [];
    }
  }

  /**
   * 标记已读
   */
  public function markRead(int $uid, ?int $notificationId = null): void {
    try {
      $query = $this->database->update('xedc_notifications')
        ->fields(['is_read' => 1])
        ->condition('uid', $uid);

      if ($notificationId) {
        $query->condition('id', $notificationId);
      }

      $query->execute();
    }
    catch (\Exception $e) {}
  }

  /**
   * 获取未读数量
   */
  public function getUnreadCount(int $uid): int {
    try {
      return (int) $this->database->select('xedc_notifications', 'n')
        ->condition('uid', $uid)
        ->condition('is_read', 0)
        ->countQuery()
        ->execute()
        ->fetchField();
    }
    catch (\Exception $e) {
      return 0;
    }
  }
}
