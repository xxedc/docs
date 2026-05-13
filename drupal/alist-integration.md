# Drupal + Alist 集成指南

**生产级 Alist 作为 Drupal 外部媒体存储方案**

本文档基于 xxedc/docs 仓库实际部署经验，与 `drupal/DC.md` 、`drupal-alist-vpn-helper` 技能完全对齐。

## 1. 为什么选择 Alist + Drupal？

- 支持海量视频/图片存储（超过本地文件系统限制）
- 快速预览、缓存、CDN 加速
- WebDAV / API 双重支持
- 与 Drupal Media / File 模块无缝集成
- 安全、可回滚、自动化同步

## 2. 集成方案对比（推荐顺序）

### 方案一：Alist WebDAV + Drupal File System（最简单，推荐新项目）

1. Alist 面板创建 Token
2. Drupal `settings.php` 配置：
```php
$settings['file_public_path'] = 'sites/default/files';
$settings['file_private_path'] = 'private://';
```
3. 安装自定义模块 `xedc_alist`，配置 WebDAV 端点

### 方案二：自定义模块 + Alist API（最灵活，推荐生产环境）

- 提供文件选择器、签名下载链接、批量迁移
- 支持 Alist 搜索、预览图、元数据同步

### 方案三：Views + REST Export

直接暴露 Alist 内容，适合非媒体类型数据展示。

## 3. Docker Compose 示例（推荐）

```yaml
version: '3.8'
services:
  drupal:
    image: drupal:11-fpm
    volumes:
      - ./web:/var/www/html
  alist:
    image: xhofe/alist:latest
    ports:
      - "5244:5244"
    volumes:
      - ./alist:/opt/alist/data
  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
```

## 4. 关键配置与脚本

- 模块列表参考 `drupal/DC.md`（包含 image_widget_crop、responsive_image、file_mdm 等）
- 部署脚本：`drupal/scripts/deploy.sh` 支持 Alist 同步
- 同步脚本示例：
  ```bash
  # 批量上传到 Alist
  python scripts/alist_sync.py --direction local-to-alist --dry-run
  ```

## 5. 安全与最佳实践

- 所有 Alist 访问使用 HTTPS + Token
- 下载链接加签名防盗链
- 与 `drupal-alist-vpn-helper` 结合使用，统一管理内容网站 + 代理/VPN

## 6. 相关文档

- 详细内容模型与模块配置 → `drupal/DC.md`
- 项目结构与部署 → `drupal/README.md`
- 反向工程与数据模型 → `skills/drupal-reverse-engineering-skill.md`

**更新日期**：2026-05-13 | 与 docs 仓库实时同步