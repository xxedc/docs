# 🚀 115 Cookie Extractor

<p align="center">
  <b>扫码即得 Cookie · 无抓包 · 自动化 · 稳定可复用</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.8%2B-blue.svg">
  <img src="https://img.shields.io/badge/Playwright-Chromium-green.svg">
  <img src="https://img.shields.io/badge/Platform-Linux%20%7C%20Ubuntu-lightgrey.svg">
  <img src="https://img.shields.io/badge/License-MIT-orange.svg">
  <img src="https://img.shields.io/badge/Status-Active-success.svg">
</p>

---

## ✨ 特性

- 📷 自动生成 115 登录二维码  
- 📱 手机扫码登录（官方流程，无需抓包）  
- 🍪 输出完整 Cookie（可直接复用）  
- ⚡ 轻量、快速、稳定  
- 🧩 适配 Alist / 自动化脚本 / API 调用  

---

## 🎬 演示（示意）

> 将下面图片替换为你实际截图（文件名保持一致即可）

<p align="center">
  <img src="./assets/preview.png" width="720" alt="preview">
</p>

<p align="center">
  <img src="./assets/qr.png" width="360" alt="qr">
</p>

---

## 📦 快速开始

### 1️⃣ 安装环境

bash id="b9r1xk" apt update apt install -y python3-pip python3-venv  python3 -m venv venv source venv/bin/activate  pip install playwright playwright install --with-deps chromium 

---

### 2️⃣ 运行脚本

bash id="g6x3mp" python3 get_115_cookie.py 

---

### 3️⃣ 扫码登录

浏览器打开：

bash id="3i2q7v" http://你的服务器IP:8899/qr.png 

使用 115 App 扫码并确认登录。

---

### 4️⃣ 获取 Cookie

终端输出示例：

text id="3w8y0p" UID=xxx; CID=xxx; SEID=xxx; ... 

---

## 📌 使用场景

- 🗂 挂载 Alist  
- 🤖 自动化脚本（转存 / 下载 / 同步）  
- 🔌 API 请求认证  
- 🧠 自建工具集成  

---

## 📁 项目结构

bash id="2s4l9n" . ├── get_115_cookie.py   # 主程序 ├── install.sh          # 一键安装（可选） ├── assets/ │   ├── preview.png     # 展示图（自行替换） │   └── qr.png          # 示例二维码 └── README.md 

---

## ⚙️ 可选：一键安装

bash id="0qz7y6" bash install.sh 

---

## 🔧 常见问题

### ❓ 无法访问二维码？

bash id="1c4u8t" ufw allow 8899 

确保服务器端口已开放。

---

### ❓ 扫码后无输出？

- 确认手机已点击“确认登录”  
- 等待 3–10 秒（Cookie 写入有延迟）  
- 重新运行脚本再试  

---

### ❓ 浏览器依赖安装失败？

bash id="q2d9me" playwright install chromium 

---

## 🔒 安全说明

- Cookie 属于敏感凭证，请勿泄露  
- 建议仅在私人服务器运行  
- 登录失效需重新获取  

---

## 🚀 Roadmap

- [ ] 自动保存 Cookie 到文件  
- [ ] 定时刷新（防过期）  
- [ ] Web 面板（扫码即用）  
- [ ] 多账号管理  

---

## 🤝 贡献

欢迎提交 Issue / PR 改进脚本或补充场景。

---

## ⭐ Star History

如果这个项目对你有帮助，点个 ⭐ 支持一下。

---

## 📄 License

MIT
