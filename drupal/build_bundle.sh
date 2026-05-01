#!/bin/bash
# 自动生成 content_bundle 模块及所有配置
MODULE_DIR="/var/www/html/drupal11/web/modules/custom/content_bundle"
CONFIG_DIR="$MODULE_DIR/config/install"

echo "开始创建模块目录..."
mkdir -p $CONFIG_DIR

# 1. 模块信息文件
cat << 'EOF' > $MODULE_DIR/content_bundle.info.yml
name: 'Content Bundle (图集/视频/文章)'
type: module
description: '自动创建内容类型及视图：图集、视频、文章'
core_version_requirement: ^10 || ^11
package: Custom
dependencies:
  - drupal:node
  - drupal:image
  - drupal:link
  - drupal:views
EOF

# 2. 创建内容类型 (Node Types)
# 图集
cat << 'EOF' > $CONFIG_DIR/node.type.gallery.yml
langcode: zh-hans
status: true
dependencies: {  }
name: '图集'
type: gallery
description: '美女写真图集'
help: ''
new_revision: true
preview_mode: 1
display_submitted: true
EOF

# 视频
cat << 'EOF' > $CONFIG_DIR/node.type.video.yml
langcode: zh-hans
status: true
dependencies: {  }
name: '视频'
type: video
description: '短视频或视频资源'
help: ''
new_revision: true
preview_mode: 1
display_submitted: true
EOF

# 文章
cat << 'EOF' > $CONFIG_DIR/node.type.article.yml
langcode: zh-hans
status: true
dependencies: {  }
name: '文章'
type: article
description: '图文文章'
help: ''
new_revision: true
preview_mode: 1
display_submitted: true
EOF

# 3. 创建字段存储 (Field Storage)
# field_cover (封面图 - 通用)
cat << 'EOF' > $CONFIG_DIR/field.storage.node.field_cover.yml
langcode: zh-hans
status: true
dependencies:
  module: [node, image]
id: node.field_cover
field_name: field_cover
entity_type: node
type: image
settings: { target_type: file }
module: image
locked: false
cardinality: 1
translatable: true
EOF

# field_images (图集多图)
cat << 'EOF' > $CONFIG_DIR/field.storage.node.field_images.yml
langcode: zh-hans
status: true
dependencies:
  module: [node, image]
id: node.field_images
field_name: field_images
entity_type: node
type: image
settings: { target_type: file }
module: image
locked: false
cardinality: -1
translatable: true
EOF

# field_video_url (视频链接)
cat << 'EOF' > $CONFIG_DIR/field.storage.node.field_video_url.yml
langcode: zh-hans
status: true
dependencies:
  module: [node, link]
id: node.field_video_url
field_name: field_video_url
entity_type: node
type: link
settings: { }
module: link
locked: false
cardinality: 1
translatable: true
EOF

# 4. 创建字段实例 (Field Instances) - 仅列出核心绑定，具体表单显示由系统补全
# Gallery Cover
cat << 'EOF' > $CONFIG_DIR/field.field.node.gallery.field_cover.yml
langcode: zh-hans
status: true
dependencies:
  config: [field.storage.node.field_cover, node.type.gallery]
id: node.gallery.field_cover
field_name: field_cover
entity_type: node
bundle: gallery
label: '封面图'
required: true
EOF

# Gallery Images
cat << 'EOF' > $CONFIG_DIR/field.field.node.gallery.field_images.yml
langcode: zh-hans
status: true
dependencies:
  config: [field.storage.node.field_images, node.type.gallery]
id: node.gallery.field_images
field_name: field_images
entity_type: node
bundle: gallery
label: '图片集'
required: false
EOF

# Video Cover & URL
cat << 'EOF' > $CONFIG_DIR/field.field.node.video.field_cover.yml
langcode: zh-hans
status: true
dependencies:
  config: [field.storage.node.field_cover, node.type.video]
id: node.video.field_cover
field_name: field_cover
entity_type: node
bundle: video
label: '封面图'
required: true
EOF

cat << 'EOF' > $CONFIG_DIR/field.field.node.video.field_video_url.yml
langcode: zh-hans
status: true
dependencies:
  config: [field.storage.node.field_video_url, node.type.video]
id: node.video.field_video_url
field_name: field_video_url
entity_type: node
bundle: video
label: '视频链接'
required: true
EOF

# Article Cover
cat << 'EOF' > $CONFIG_DIR/field.field.node.article.field_cover.yml
langcode: zh-hans
status: true
dependencies:
  config: [field.storage.node.field_cover, node.type.article]
id: node.article.field_cover
field_name: field_cover
entity_type: node
bundle: article
label: '封面图'
required: false
EOF

# 5. 为了确保 Views 不会在安装时报错，我们使用模块安装钩子 (install hook) 动态生成 Views
# 这样能100%避免 Drupal 严格的 YAML 校验导致白屏
cat << 'EOF' > $MODULE_DIR/content_bundle.install
<?php
use Drupal\views\Entity\View;

/**
 * Implements hook_install().
 * 模块安装后自动创建 Views，这种低代码方式比导入几千行YAML更稳定安全。
 */
function content_bundle_install() {
  $views_data = [
    'gallery_view' => ['label' => '首页图集', 'type' => 'gallery', 'limit' => 12, 'style' => 'grid'],
    'video_view' => ['label' => '热门视频', 'type' => 'video', 'limit' => 8, 'style' => 'default'],
    'article_view' => ['label' => '最新文章', 'type' => 'article', 'limit' => 6, 'style' => 'default'],
  ];

  foreach ($views_data as $id => $info) {
    if (!View::load($id)) {
      $view = View::create([
        'id' => $id,
        'label' => $info['label'],
        'base_table' => 'node_field_data',
        'base_field' => 'nid',
        'core' => '10.0',
        'display' => [
          'default' => [
            'display_plugin' => 'default',
            'id' => 'default',
            'display_title' => 'Master',
            'position' => 1,
            'display_options' => [
              'title' => $info['label'],
              'style' => ['type' => $info['style']],
              'row' => ['type' => 'entity:node', 'options' => ['view_mode' => 'teaser']],
              'pager' => ['type' => 'some', 'options' => ['items_per_page' => $info['limit']]],
              'filters' => [
                'status' => ['field' => 'status', 'table' => 'node_field_data', 'value' => '1', 'plugin_id' => 'boolean'],
                'type' => ['field' => 'type', 'table' => 'node_field_data', 'value' => [$info['type'] => $info['type']], 'plugin_id' => 'bundle'],
              ],
              'sorts' => [
                'created' => ['field' => 'created', 'table' => 'node_field_data', 'order' => 'DESC', 'plugin_id' => 'date'],
              ],
            ],
          ],
          'block_1' => [
            'display_plugin' => 'block',
            'id' => 'block_1',
            'display_title' => 'Block',
            'position' => 2,
            'display_options' => ['display_extenders' => []],
          ],
        ],
      ]);
      $view->save();
    }
  }
}
EOF

# 设置权限确保正常读取
chown -R www-data:www-data $MODULE_DIR
echo "模块 content_bundle 构建完成！准备启用..."
EOF
