<?php

namespace Drupal\xedc_core\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\Core\Session\AccountInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * 文章互动栏 Block（点赞/收藏/分享/字数）
 *
 * @Block(
 *   id = "xedc_article_actions",
 *   admin_label = @Translation("XEDC 文章互动栏"),
 *   category = @Translation("XEDC")
 * )
 */
class ArticleActionsBlock extends BlockBase implements ContainerFactoryPluginInterface {

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    protected RouteMatchInterface $routeMatch,
    protected AccountInterface $currentUser,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
  }

  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition): static {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('current_route_match'),
      $container->get('current_user'),
    );
  }

  public function build(): array {
    $node = $this->routeMatch->getParameter('node');
    if (!$node || $node->bundle() !== 'article') {
      return [];
    }

    return [
      '#type'       => 'markup',
      '#markup'     => '',
      '#attached'   => ['library' => ['xedc_core/interactions']],
      'actions'     => [
        '#theme'      => 'xedc_article_actions',
        '#node'       => $node,
        '#nid'        => $node->id(),
        '#like_count' => $node->hasField('field_like_count') ? (int) $node->get('field_like_count')->value : 0,
        '#is_logged_in' => $this->currentUser->isAuthenticated(),
      ],
    ];
  }

  public function getCacheMaxAge(): int {
    return 0; // 不缓存，每次按用户状态渲染
  }
}
