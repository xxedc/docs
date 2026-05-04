/**
 * reading-progress.js — 阅读进度（独立文件，供 libraries.yml 引用）
 * 实际逻辑已合并到 article-toc.js，此文件作为占位保留
 */
(function (Drupal) {
  'use strict';
  Drupal.behaviors.xedcReadingProgress = {
    attach: function () {
      // 进度条逻辑已在 article-toc.js 的 initReadingProgress() 中实现
    }
  };
})(Drupal);
