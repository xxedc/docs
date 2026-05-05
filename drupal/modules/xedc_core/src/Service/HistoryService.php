<?php

namespace Drupal\xedc_core\Service;

use Drupal\Core\Database\Connection;
use Drupal\Core\Session\AccountInterface;

/**
 * 历史记录服务
 */
class HistoryService {

  public function __construct(
    protected Connection $database,
    protected AccountInterface $currentUser,
  ) {}

  /**
   * 记录浏览历史
   */
  public function record(int $nid, string $bundle): void {
    $uid = $this->currentUser->id();
    if (!$uid) return;

    try {
      $this->database->merge('xedc_history')
        ->keys(['uid' => $uid, 'nid' => $nid])
        ->fields([
          'bundle'    => $bundle,
          'timestamp' => time(),
        ])
        ->execute();
    }
    catch (\Exception $e) {
      // 静默失败，不影响主流程
    }
  }

  /**
   * 获取用户历史记录
   */
  public function getHistory(int $uid, int $limit = 20, int $offset = 0): array {
    try {
      $result = $this->database->select('xedc_history', 'h')
        ->fields('h', ['nid', 'bundle', 'timestamp'])
        ->condition('uid', $uid)
        ->orderBy('timestamp', 'DESC')
        ->range($offset, $limit)
        ->execute()
        ->fetchAll();
      return $result ?: [];
    }
    catch (\Exception $e) {
      return [];
    }
  }

  /**
   * 清空用户历史
   */
  public function clearHistory(int $uid): void {
    try {
      $this->database->delete('xedc_history')
        ->condition('uid', $uid)
        ->execute();
    }
    catch (\Exception $e) {}
  }
}
