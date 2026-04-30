import time
import subprocess
import os
import socket
from playwright.sync_api import sync_playwright

def get_local_ip():
    """获取服务器外网/本地 IP 以生成访问链接"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "YOUR_SERVER_IP"

def main():
    PORT = "8899"
    IP = get_local_ip()
    
    print("🚀 115 全量 Cookie 自动化提取工具启动...")
    
    # 启动临时 HTTP 服务供手机查看二维码
    print(f"📡 启动临时文件服务在端口 {PORT}...")
    httpd = subprocess.Popen(
        ["python3", "-m", "http.server", PORT],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    with sync_playwright() as p:
        print("🌐 正在初始化 Chromium 浏览器...")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        print("🔗 正在加载 115 登录页面并生成二维码...")
        try:
            page.goto("https://115.com", timeout=60000, wait_until="domcontentloaded")
            time.sleep(5)  # 等待二维码渲染
            
            # 截图二维码
            page.screenshot(path="qr.png")
            print("\n" + "="*50)
            print("✅ 二维码已刷新！请按照以下步骤操作：")
            print(f"1. 浏览器打开: http://{IP}:{PORT}/qr.png")
            print("2. 手机 115 App 扫码并确认登录")
            print("="*50 + "\n")
            
        except Exception as e:
            print(f"❌ 页面加载失败: {e}")
            httpd.terminate()
            return

        print("⏳ 正在监控登录状态 (最长等待 3 分钟)...")
        success = False
        
        # 轮询检查 Cookie，直到发现 UID
        for i in range(60):  # 3秒一次，共180秒
            time.sleep(3)
            cookies = context.cookies()
            c_dict = {c['name']: c['value'] for c in cookies}
            
            if 'UID' in c_dict:
                # 提取标准全量 Cookie 字符串
                full_cookie = "; ".join([f"{c['name']}={c['value']}" for c in cookies])
                
                print("\n🎉 登录成功！抓取到全量标准 Cookie：")
                print("-" * 80)
                print(full_cookie)
                print("-" * 80)
                print("\n💡 提示: 请完整复制上方内容填入 Alist 或其他工具。")
                
                success = True
                break
                
        if not success:
            print("\n❌ 抓取超时：未检测到登录成功信号，请确认手机端是否点击确认。")
        
        # 清理
        browser.close()
        httpd.terminate()
        if os.path.exists("qr.png"):
            os.remove("qr.png")
        print("\n👋 任务结束，临时服务已关闭。")

if __name__ == "__main__":
    main()
