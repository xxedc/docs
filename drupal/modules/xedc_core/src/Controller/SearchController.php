<?php
namespace Drupal\xedc_core\Controller;
use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class SearchController extends ControllerBase {
  public function suggest(Request $request): JsonResponse {
    $q = $request->query->get('q', '');
    if (strlen($q) < 1) {
      return new JsonResponse(['suggestions' => []]);
    }
    $query = \Drupal::entityQuery('node')
      ->condition('status', 1)
      ->condition('title', '%' . $q . '%', 'LIKE')
      ->range(0, 8)
      ->accessCheck(TRUE);
    $nids = $query->execute();
    $nodes = \Drupal::entityTypeManager()->getStorage('node')->loadMultiple($nids);
    $suggestions = [];
    foreach ($nodes as $node) {
      $suggestions[] = [
        'title' => $node->getTitle(),
        'url'   => $node->toUrl()->toString(),
        'type'  => $node->bundle(),
      ];
    }
    return new JsonResponse(['suggestions' => $suggestions]);
  }
}
