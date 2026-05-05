<?php

namespace Drupal\xedc_core\TwigExtension;

use Drupal\Core\Datetime\DateFormatterInterface;
use Drupal\Core\Session\AccountInterface;
use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;

/**
 * XEDC 自定义 Twig 过滤器
 *
 * 用法：
 *   {{ node.field_view_count.value|view_count_format }}  → "1.2k"
 *   {{ node.field_reading_time.value|reading_time }}     → "5 分钟"
 *   {{ node.getCreatedTime()|relative_time }}            → "3 分钟前"
 */
class XedcExtension extends AbstractExtension {

  public function __construct(
    protected AccountInterface $currentUser,
    protected DateFormatterInterface $dateFormatter,
  ) {}

  public function getFilters(): array {
    return [
      // 播放量/阅读量格式化：1200 → "1.2k"，34000 → "3.4w"
      new TwigFilter('view_count_format', [$this, 'formatViewCount']),
      // 阅读时长：字符数 → 估算分钟
      new TwigFilter('reading_time', [$this, 'estimateReadingTime']),
      // 相对时间："3 分钟前"
      new TwigFilter('relative_time', [$this, 'relativeTime']),
    ];
  }

  /**
   * 数字格式化：1200 → 1.2k，34000 → 3.4w，12000000 → 1.2m
   */
  public function formatViewCount(mixed $count): string {
    $count = (int) $count;
    if ($count >= 10_000_000) {
      return round($count / 1_000_000, 1) . 'm';
    }
    if ($count >= 10_000) {
      return round($count / 10_000, 1) . 'w';
    }
    if ($count >= 1_000) {
      return round($count / 1_000, 1) . 'k';
    }
    return (string) $count;
  }

  /**
   * 根据字符数估算阅读时长（中文阅读速度约500字/分钟）
   */
  public function estimateReadingTime(mixed $text): int {
    if (empty($text)) return 1;
    $len = mb_strlen(strip_tags((string) $text));
    return max(1, (int) ceil($len / 500));
  }

  /**
   * 相对时间显示
   */
  public function relativeTime(mixed $timestamp): string {
    $timestamp = (int) $timestamp;
    $now = time();
    $diff = $now - $timestamp;

    if ($diff < 60)      return '刚刚';
    if ($diff < 3600)    return (int)($diff / 60) . ' 分钟前';
    if ($diff < 86400)   return (int)($diff / 3600) . ' 小时前';
    if ($diff < 2592000) return (int)($diff / 86400) . ' 天前';
    if ($diff < 31536000) return (int)($diff / 2592000) . ' 个月前';
    return (int)($diff / 31536000) . ' 年前';
  }

  public function getName(): string {
    return 'xedc_core';
  }

}
