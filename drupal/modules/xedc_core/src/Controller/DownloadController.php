<?php
namespace Drupal\xedc_core\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class DownloadController extends ControllerBase {
  private function safeBasename(string $title): string {
    $name = preg_replace('/[^\pL\pN\-_ ]+/u', '', $title);
    $name = trim((string) $name);
    if ($name === '') {
      $name = 'images';
    }
    if (mb_strlen($name) > 80) {
      $name = mb_substr($name, 0, 80);
    }
    return $name;
  }

  private function createZipPath(): string {
    $dir = sys_get_temp_dir();
    return rtrim($dir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'xedc_' . bin2hex(random_bytes(16)) . '.zip';
  }

  private function addImagePostToZip(\ZipArchive $zip, $node, string $folder): void {
    if (!$node || !$node->hasField('field_image') || $node->get('field_image')->isEmpty()) {
      return;
    }

    $file_system = \Drupal::service('file_system');
    $i = 1;
    foreach ($node->get('field_image') as $item) {
      $file = $item->entity;
      if (!$file) {
        continue;
      }
      $path = $file_system->realpath($file->getFileUri());
      if (!$path || !is_file($path)) {
        continue;
      }
      $base = basename($path);
      $zipName = $folder . '/' . sprintf('%03d-%s', $i, $base);
      $zip->addFile($path, $zipName);
      $i++;
    }
  }

  public function imagePostZip(int $nid): BinaryFileResponse {
    $node = \Drupal::entityTypeManager()->getStorage('node')->load($nid);
    if (!$node || $node->bundle() !== 'image_post' || !$node->access('view')) {
      throw new NotFoundHttpException();
    }
    if (!$node->hasField('field_allow_download') || !$node->get('field_allow_download')->value) {
      throw new AccessDeniedHttpException();
    }

    $title = $this->safeBasename((string) $node->getTitle());
    $zipPath = $this->createZipPath();

    $zip = new \ZipArchive();
    $ok = $zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
    if ($ok !== true) {
      throw new NotFoundHttpException();
    }

    $this->addImagePostToZip($zip, $node, $title);
    $zip->close();

    $response = new BinaryFileResponse($zipPath);
    $response->headers->set('Content-Type', 'application/zip');
    $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT, $title . '.zip');
    $response->deleteFileAfterSend(true);
    return $response;
  }

  public function imagePostsZip(Request $request): BinaryFileResponse {
    $raw = (string) $request->query->get('ids', '');
    $parts = array_filter(array_map('trim', explode(',', $raw)));
    $ids = [];
    foreach ($parts as $p) {
      if (ctype_digit($p)) {
        $ids[] = (int) $p;
      }
      if (count($ids) >= 50) {
        break;
      }
    }

    if (!$ids) {
      throw new NotFoundHttpException();
    }

    $nodes = \Drupal::entityTypeManager()->getStorage('node')->loadMultiple($ids);
    if (!$nodes) {
      throw new NotFoundHttpException();
    }

    $zipPath = $this->createZipPath();
    $zip = new \ZipArchive();
    $ok = $zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
    if ($ok !== true) {
      throw new NotFoundHttpException();
    }

    $added = 0;
    foreach ($ids as $nid) {
      $node = $nodes[$nid] ?? NULL;
      if (!$node || $node->bundle() !== 'image_post' || !$node->access('view')) {
        continue;
      }
      if (!$node->hasField('field_allow_download') || !$node->get('field_allow_download')->value) {
        continue;
      }
      $folder = $this->safeBasename((string) $node->getTitle()) . '-' . (int) $node->id();
      $this->addImagePostToZip($zip, $node, $folder);
      $added++;
    }

    $zip->close();

    if ($added === 0) {
      @unlink($zipPath);
      throw new AccessDeniedHttpException();
    }

    $response = new BinaryFileResponse($zipPath);
    $response->headers->set('Content-Type', 'application/zip');
    $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT, 'images.zip');
    $response->deleteFileAfterSend(true);
    return $response;
  }
}

