# 🚀 115 Cookie 获取工具

一个基于 Playwright 的自动化脚本，用于快速获取 115 网盘登录 Cookie，支持扫码登录，适用于 Alist、自动化脚本等场景。

---

## 📌 项目简介

本工具通过浏览器自动化打开 115 登录页面，生成二维码，并在扫码登录后自动提取完整 Cookie。

适合以下用户：

- 使用 Alist 挂载 115 网盘
- 编写自动化脚本
- 需要长期维护 Cookie 的用户

---

## ✨ 功能特性

- 📷 自动生成登录二维码
- 📱 支持手机扫码登录
- 🍪 自动提取完整 Cookie（非精简版）
- ⚡ 无需手动抓包
- 🧩 可直接用于多种工具

---

## 🖥️ 运行环境

- Linux / Ubuntu（推荐）
- Python 3.8+
- 服务器需可访问公网

---

## 📦 安装步骤

### 1️⃣ 安装基础环境

bash apt update apt install -y python3-pip python3-venv 

### 2️⃣ 创建虚拟环境

bash python3 -m venv venv source venv/bin/activate 

### 3️⃣ 安装依赖

bash pip install playwright playwright install --with-deps chromium 

---

## 🚀 使用方法

bash python3 get_115_cookie.py 

运行后：

### ① 打开二维码

浏览器访问：

bash http://你的服务器IP:8899/qr.png 

### ② 使用 115 App 扫码

- 打开 115 App
- 扫描二维码
- 确认登录

### ③ 获取 Cookie

终端会输出：

text UID=xxx; CID=xxx; SEID=xxx; ... 

---

## 📌 Cookie 用途

获取的 Cookie 可用于：

- 挂载 Alist
- 自动化下载 / 转存脚本
- API 请求认证

---

## 📁 项目结构

bash . ├── get_115_cookie.py   # 主脚本 ├── install.sh          # 一键安装（可选） ├── qr.png              # 临时二维码 └── README.md 

---

## ⚠️ 注意事项

- Cookie 属于敏感信息，请勿泄露
- 登录状态可能失效，需要重新获取
- 建议在私人服务器运行
- 若无法访问二维码，请检查端口（默认 8899）

---

## 🔧 常见问题

### ❓ 无法打开二维码？

检查端口是否开放：

bash ufw allow 8899 

---

### ❓ 扫码后没有反应？

- 确认手机已点击“确认登录”
- 等待几秒（Cookie 有延迟）
- 可重新运行脚本

---

### ❓ 浏览器安装失败？

尝试重新执行：

bash playwright install chromium 

---

## 🔒 安全说明

本工具不会上传任何数据，所有操作均在本地/服务器完成。

---

## 📄 License

MIT License

---

## ⭐ 使用建议

建议搭配：

- Alist 使用
- 定时脚本（自动更新 Cookie）
- 多账号管理

---

## 🚀 后续可扩展

- 自动保存 Cookie 到文件
- 定时刷新登录
- Web 面板版本
- API 接口封
