# 115 Cookie 获取工具

一个用于获取 115 网盘登录 Cookie 的脚本，通过扫码登录方式自动提取 Cookie，适用于 Alist 挂载或自动化使用。

---

## 功能说明

- 自动启动浏览器访问 115 登录页  
- 生成二维码供手机扫码登录  
- 登录成功后自动提取 Cookie  
- 输出完整 Cookie 字符串  

---

## 运行环境

- Linux / Ubuntu（推荐）
- Python 3.8+
- 可访问公网的服务器

---

## 安装依赖

bash id="c8k2qf" apt update apt install -y python3-pip python3-venv  python3 -m venv venv source venv/bin/activate  pip install playwright playwright install chromium 

---

## 使用方法

### 1. 启动脚本

bash id="x2m9ld" python3 get_115_cookie.py 

---

### 2. 获取二维码

浏览器访问：

text id="n4v8qa" http://你的服务器IP:8899/qr.png 

---

### 3. 手机扫码登录

- 打开 115 App  
- 扫描二维码  
- 点击确认登录  

---

### 4. 获取 Cookie

登录成功后，终端会输出类似内容：

text id="k3p7sd" UID=xxx; CID=xxx; SEID=xxx; ... 

---

## 使用场景

- 挂载 115 到 Alist  
- 自动化脚本调用  
- API 鉴权使用  

---

## 项目结构

bash id="q9d2ma" get_115_cookie.py   # 主脚本 README.md           # 说明文档 

---

## 注意事项

- Cookie 属于敏感信息，请勿泄露  
- 登录失效后需要重新获取  
- 服务器 8899 端口需可访问  
- 建议仅在自用环境运行  

---

## 常见问题

### 无法访问二维码

检查端口是否开放：

bash id="f6l1zx" ufw allow 8899 

---

### 扫码后无输出

- 确认已点击“确认登录”
- 等待几秒钟
- 重新运行脚本

---

### playwright 安装失败

重新执行：

bash id="t8v0pc" playwright install chromium 

---

## License

MIT
