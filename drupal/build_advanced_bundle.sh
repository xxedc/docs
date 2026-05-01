#!/bin/bash
# ==========================================
# 高级版 Content Bundle 自动生成脚本
# 功能：自动卸载旧模块、创建带丰富字段的新模块、自动配置视图
# ==========================================

echo "🧹 第一步：正在清理并卸载旧的废弃模块..."
cd /var/www/html/drupal11
php vendor/bin/drush pmu content_bundle -y > /dev/null 2>&1
rm -rf web/modules/custom/content_bundle

echo "🏗️ 第二步：正在创建高级版模块目录..."
MODULE_DIR="web/modules/custom/content_bundle"
CONFIG_DIR="$MODULE_DIR/config/install"
mkdir -p $CONFIG_DIR

# 1. 模块信息文件 (增加了 options 依赖用于布尔开关字段)
cat << 'EOF' > $MODULE_DIR/content_bundle.info.yml
name: 'Content Bundle (高级版图集/视频/专栏)'
type: module
description: '自动创建带置顶、描述等高级字段的内容类型及视图'
core_version_requirement: ^10 || ^11
package: Custom
dependencies:
  - drupal:node
  - drupal:image
  - drupal:link
  - drupal:views
  - drupal:options
  - drupal:text
EOF

# 2. 创建 3 个内容类型：图集、视频、专栏 (post)
cat << 'EOF' > $CONFIG_DIR/node.type.gallery.yml
langcode: zh-hans
status: true
dependencies: {  }
name: '美女图集'
type: gallery
description: '多图写真展示'
new_revision: true
preview_mode: 1
display_submitted: true
EOF

cat << 'EOF' > $CONFIG_DIR/node.type.video.yml
langcode: zh-hans
status: true
dependencies: {  }
name: '精选视频'
type: video
description: '短视频或在线视频'
new_revision: true
preview_mode: 1
display_submitted: true
EOF

cat << 'EOF' > $CONFIG_DIR/node.type.post.yml
langcode: zh-hans
status: true
dependencies: {  }
name: '专栏文章'
type: post
description: '干货教程与资讯'
new_revision: true
preview_mode: 1
display_submitted: true
EOF

# 3. 创建字段存储 (新增了是否推荐、文本描述字段)
cat << 'EOF' > $CONFIG_DIR/field.storage.node.field_cover.yml
langcode: zh-hans
status: true
dependencies: { module: [node, image] }
id: node.field_cover
field_name: field_cover
entity_type: node
type: image
module: image
cardinality: 1
translatable: true
EOF

cat << 'EOF' > $CONFIG_DIR/field.storage.node.field_images.yml
langcode: zh-hans
status: true
dependencies: { module: [node, image] }
id: node.field_images
field_name: field_images
entity_type: node
type: image
module: image
cardinality: -1
translatable: true
EOF

cat << 'EOF' > $CONFIG_DIR/field.storage.node.field_video_url.yml
langcode: zh-hans
status: true
dependencies: { module: [node, link] }
id: node.field_video_url
field_name: field_video_url
entity_type: node
type: link
module: link
cardinality: 1
translatable: true
EOF

cat << 'EOF' > $CONFIG_DIR/field.storage.node.field_is_recommended.yml
langcode: zh-hans
status: true
dependencies: { module: [node, options] }
id: node.field_is_recommended
field_name: field_is_recommended
entity_type: node
type: boolean
module: options
cardinality: 1
settings: { on_label: '是', off_label: '否' }
translatable: true
EOF

cat << 'EOF' > $CONFIG_DIR/field.storage.node.field_intro.yml
langcode: zh-hans
status: true
dependencies: { module: [node, text] }
id: node.field_intro
field_name: field_intro
entity_type: node
type: text_long
module: text
cardinality: 1
translatable: true
EOF

# 4. 将字段绑定到内容类型上 (Instances)
# 图集 (Gallery) 绑定：封面、图集、推荐、简介
cat << 'EOF' > $CONFIG_DIR/field.field.node.gallery.field_cover.yml
langcode: zh-hans
status: true
dependencies: { config: [field.storage.node.field_cover, node.type.gallery] }
id: node.gallery.field_cover
field_name: field_cover
entity_type: node
bundle: gallery
label: '封面海报'
required: true
EOF

cat << 'EOF' > $CONFIG_DIR/field.field.node.gallery.field_images.yml
langcode: zh-hans
status: true
dependencies: { config: [field.storage.node.field_images, node.type.gallery] }
id: node.gallery.field_images
field_name: field_images
entity_type: node
bundle: gallery
label: '上传高清图集'
required: false
EOF

cat << 'EOF' > $CONFIG_DIR/field.field.node.gallery.field_is_recommended.yml
langcode: zh-hans
status: true
dependencies: { config: [field.storage.node.field_is_recommended, node.type.gallery] }
id: node.gallery.field_is_recommended
field_name: field_is_recommended
entity_type: node
bundle: gallery
label: '设为首页推荐'
required: false
EOF

cat << 'EOF' > $CONFIG_DIR/field.field.node.gallery.field_intro.yml
langcode: zh-hans
status: true
dependencies: { config: [field.storage.node.field_intro, node.type.gallery] }
id: node.gallery.field_intro
field_name: field_intro
entity_type: node
bundle: gallery
label: '图集简介'
required: false
EOF

# 视频 (Video) 绑定：封面、视频链接、推荐、简介
cat << 'EOF' > $CONFIG_DIR/field.field.node.video.field_cover.yml
langcode: zh-hans
status: true
dependencies: { config: [field.storage.node.field_cover, node.type.video] }
id: node.video.field_cover
field_name: field_cover
entity_type: node
bundle: video
label: '视频封面'
required: true
EOF

cat << 'EOF' > $CONFIG_DIR/field.field.node.video.field_video_url.yml
langcode: zh-hans
status: true
dependencies: { config: [field.storage.node.field_video_url, node.type.video] }
id: node.video.field_video_url
field_name: field_video_url
entity_type: node
bundle: video
label: '视频播放地址'
required: true
EOF

cat << 'EOF' > $CONFIG_DIR/field.field.node.video.field_is_recommended.yml
langcode: zh-hans
status: true
dependencies: { config: [field.storage.node.field_is_recommended, node.type.video] }
id: node.video.field_is_recommended
field_name: field_is_recommended
entity_type: node
bundle: video
label: '设为首页推荐'
required: false
EOF

# 专栏文章 (Post) 绑定：封面、推荐、简介
cat << 'EOF' > $CONFIG_DIR/field.field.node.post.field_cover.yml
langcode: zh-hans
status: true
dependencies: { config: [field.storage.node.field_cover, node.type.post] }
id: node.post.field_cover
field_name: field_cover
entity_type: node
bundle: post
label: '文章头图'
required: false
EOF

cat << 'EOF' > $CONFIG_DIR/field.field.node.post.field_intro.yml
langcode: zh-hans
status: true
dependencies: { config: [field.storage.node.field_intro, node.type.post] }
id: node.post.field_intro
field_name: field_intro
entity_type: node
bundle: post
label: '文章正文'
required: true
EOF

# 5. 安装钩子：安全创建 Views 视图
cat << 'EOF' > $MODULE_DIR/content_bundle.install
<?php
use Drupal\views\Entity\View;

function content_bundle_install() {
  $views_data = [
    'gallery_view' => ['label' => '首页图集', 'type' => 'gallery', 'limit' => 12, 'style' => 'grid'],
    'video_view' => ['label' => '热门视频', 'type' => 'video', 'limit' => 8, 'style' => 'default'],
    'article_view' => ['label' => '最新文章', 'type' => 'post', 'limit' => 6, 'style' => 'default'],
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

# 修正权限
chown -R www-data:www-data $MODULE_DIR

echo "🚀 第三步：正在启用高级版模块并重置系统..."
php vendor/bin/drush en content_bundle -y
php vendor/bin/drush cr

echo "✅ 恭喜！全自动高级模块安装成功！"
EOF
