<?php
namespace Drupal\xedc_core\Controller;
use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;

class RecommendController extends ControllerBase {
  public function suggest(int $nid): JsonResponse {
    $node = \Drupal::entityTypeManager()->getStorage('node')->load($nid);
    if (!$node) {
      return new JsonResponse(['items' => []]);
    }
    $query = \Drupal::entityQuery('node')
      ->condition('status', 1)
      ->condition('type', $node->bundle())
      ->condition('nid', $nid, '!=')
      ->sort('field_view_count', 'DESC')
      ->range(0, 6)
      ->accessCheck(TRUE);
    $nids = $query->execute();
    $nodes = \Drupal::entityTypeManager()->getStorage('node')->loadMultiple($nids);
    $items = [];
    foreach ($nodes as $n) {
      $items[] = ['title' => $n->getTitle(), 'url' => $n->toUrl()->toString()];
    }
    return new JsonResponse(['items' => $items]);
  }
}
