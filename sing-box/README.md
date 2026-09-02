sing-box 三协议快速指南

一、安装和使用脚本

将安装脚本上传到服务器后，执行：

chmod +x install.sh
sudo ./install.sh

如果脚本文件名不同，请替换为实际文件名：

chmod +x 脚本文件名.sh
sudo ./脚本文件名.sh

安装完成后，脚本会自动安装并配置 sing-box 服务，同时生成客户端配置和节点链接。

节点链接文件位置：

cat /root/sing-box-client/links.txt

客户端配置文件位置：

/root/sing-box-client/config.json

服务端配置文件位置：

/etc/sing-box/config.json

安装完成后，可以使用以下命令查看服务状态：

systemctl status sing-box --no-pager

如果显示：

active (running)

说明 sing-box 已正常运行。

⸻

二、协议和端口

协议	端口	类型	客户端
VLESS	8843/TCP	Reality + Vision	Shadowrocket
Hysteria2	8844/UDP	TLS + Salamander	Shadowrocket
Shadowsocks 2022	8846/TCP	2022-blake3-aes-256-gcm	Shadowrocket

域名：

i.gitxx.xyz

VLESS Reality 伪装域名：

gstatic.com

端口对应关系：

8843/TCP：VLESS Reality
8844/UDP：Hysteria2
8846/TCP：Shadowsocks 2022

⸻

三、在 Shadowrocket 中使用

安装完成后，复制节点链接文件中的完整链接：

cat /root/sing-box-client/links.txt

然后在 Shadowrocket 中点击右上角的 +，选择对应协议，将复制的节点链接粘贴或导入即可。

支持的协议：

VLESS Reality
Hysteria2
Shadowsocks 2022

⸻

四、重新打印节点连接信息

查看全部节点链接：

cat /root/sing-box-client/links.txt

为了方便以后查看，可以创建快捷命令：

cat >/usr/local/bin/singbox-info <<'EOF'
#!/bin/sh
cat /root/sing-box-client/links.txt
EOF
chmod +x /usr/local/bin/singbox-info

以后只需要执行：

singbox-info

即可重新打印所有节点连接链接。

如果忘记了节点参数，也可以直接查看：

cat /root/sing-box-client/links.txt

⸻

五、常用服务命令

查看 sing-box 状态：

systemctl status sing-box --no-pager

检查配置文件：

sing-box check -c /etc/sing-box/config.json

重启 sing-box：

systemctl restart sing-box

查看运行日志：

journalctl -u sing-box -n 100 --no-pager

实时查看日志：

journalctl -u sing-box -f

按 Ctrl+C 退出实时日志。

查看端口监听情况：

ss -lntup | grep -E ':8843|:8844|:8846'

查看服务器 IP：

curl -4 ifconfig.me

查看域名解析：

getent hosts i.gitxx.xyz

或：

dig +short i.gitxx.xyz
