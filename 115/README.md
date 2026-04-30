# 🚀 115 Cookie 获取脚本

一个基于 Playwright 的自动化脚本，用于获取 115 网盘登录 Cookie（支持扫码登录）。

---

## ✨ 功能

- 📷 自动生成二维码
- 📱 手机扫码登录
- 🍪 自动提取完整 Cookie
- ⚡ 适配 Alist / 自动化脚本

---

## 📦 环境安装

```bash
apt update
apt install -y python3-pip python3-venv

python3 -m venv venv
source venv/bin/activate

pip install playwright
playwright install --with-deps chromium
