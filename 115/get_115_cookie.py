from playwright.sync_api import sync_playwright
import time
import subprocess

SERVER_PORT = 8899

def start_http_server():
    return subprocess.Popen(["python3", "-m", "http.server", str(SERVER_PORT)])

def main():
    print("🚀 启动【115 Cookie 提取脚本（完整版）】...")
    
    httpd = start_http_server()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
        )
        page = context.new_page()

        print("🌐 正在打开 115 登录页...")
        try:
            page.goto("https://115.com", timeout=60000, wait_until="domcontentloaded")
            page.wait_for_timeout(5000)
        except:
            print("⚠️ 页面加载异常，继续执行...")

        # 截图二维码
        page.screenshot(path="qr.png")
        print("\n✅ 二维码已生成！")
        print(f"👉 打开查看：http://你的服务器IP:{SERVER_PORT}/qr.png\n")

        print("⏳ 等待扫码登录（最多3分钟）...")

        success = False
        for _ in range(60):
            time.sleep(3)
            cookies = context.cookies()
            c_dict = {c['name']: c['value'] for c in cookies}

            if 'UID' in c_dict:
                full_cookie = "; ".join([f"{c['name']}={c['value']}" for c in cookies])

                print("\n🎉 登录成功！获取 Cookie：\n")
                print("=" * 60)
                print(full_cookie)
                print("=" * 60)

                print("\n✅ 可直接用于 Alist / 自动化脚本")
                success = True
                break

        if not success:
            print("\n❌ 未检测到登录，请确认手机已点击确认")

        browser.close()
        httpd.terminate()

if __name__ == "__main__":
    main()
