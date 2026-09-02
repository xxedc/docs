#!/bin/bash

# ============================================================
# sing-box 一键安装脚本
#
# 协议:
#   1. VLESS + Reality + Vision
#   2. Hysteria2 + TLS
#   3. Shadowsocks 2022
#
# 端口:
#   VLESS Reality : 8843 TCP
#   Hysteria2     : 8844 UDP
#   Shadowsocks   : 8846 TCP
#
# 域名:
#   i.gitxx.xyz
#
# SSL:
#   Let's Encrypt
#   自动申请
#   自动续期
#   证书更新后自动重启 sing-box
#
# sing-box:
#   自动安装最新版
#
# ============================================================

set -Eeuo pipefail

# ============================================================
# 颜色
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

trap 'error "脚本执行失败，行号：$LINENO"' ERR

# ============================================================
# 基础配置
# ============================================================

DOMAIN="i.gitxx.xyz"

VLESS_PORT=8843
HY2_PORT=8844
SS_PORT=8846

REALITY_SNI_1="gstatic.com"
REALITY_SNI_2="gateway.icloud.com"

SINGBOX_DIR="/etc/sing-box"
CONFIG_FILE="${SINGBOX_DIR}/config.json"

CLIENT_DIR="/root/sing-box-client"
CLIENT_CONFIG="${CLIENT_DIR}/config.json"
LINK_FILE="${CLIENT_DIR}/links.txt"

BACKUP_DIR="${SINGBOX_DIR}/backup"

CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
LE_CERT="${CERT_DIR}/fullchain.pem"
LE_KEY="${CERT_DIR}/privkey.pem"

# ============================================================
# Root
# ============================================================

if [ "$(id -u)" -ne 0 ]; then
    error "请使用 root 权限运行"
    exit 1
fi

# ============================================================
# 开始
# ============================================================

clear

echo
echo -e "${CYAN}"
echo "============================================================"
echo "             sing-box 三协议一键安装"
echo "============================================================"
echo -e "${NC}"

echo -e "${GREEN}协议:${NC}"
echo "  VLESS + Reality + Vision   TCP 8843"
echo "  Hysteria2 + TLS            UDP 8844"
echo "  Shadowsocks 2022           TCP 8846"
echo
echo -e "${GREEN}域名:${NC} ${DOMAIN}"
echo
echo "============================================================"
echo

# ============================================================
# Reality SNI
# ============================================================

read -r -p \
"请选择 Reality 伪装域名 [1=gstatic.com, 2=gateway.icloud.com] (默认1): " \
SNI_CHOICE

if [ "${SNI_CHOICE}" = "2" ]; then
    REALITY_SNI="${REALITY_SNI_2}"
else
    REALITY_SNI="${REALITY_SNI_1}"
fi

success "Reality SNI: ${REALITY_SNI}"

# ============================================================
# 1. 安装依赖
# ============================================================

echo
info "[1/8] 安装系统依赖..."

export DEBIAN_FRONTEND=noninteractive

apt-get update -y

apt-get install -y \
    curl \
    wget \
    jq \
    openssl \
    ca-certificates \
    uuid-runtime \
    qrencode \
    net-tools \
    socat \
    dnsutils \
    certbot \
    iproute2

success "系统依赖安装完成"

# ============================================================
# 2. 获取服务器 IP
# ============================================================

echo
info "[2/8] 获取服务器公网 IPv4..."

SERVER_IP=""

SERVER_IP="$(curl -4 -s --max-time 10 https://api.ipify.org || true)"

if [ -z "${SERVER_IP}" ]; then
    SERVER_IP="$(curl -4 -s --max-time 10 https://ifconfig.me || true)"
fi

if [ -z "${SERVER_IP}" ]; then
    SERVER_IP="$(curl -4 -s --max-time 10 https://icanhazip.com || true)"
fi

if [ -z "${SERVER_IP}" ]; then
    SERVER_IP="$(hostname -I | awk '{print $1}')"
fi

if [ -z "${SERVER_IP}" ]; then
    error "无法获取服务器公网 IPv4"
    exit 1
fi

echo
echo "服务器 IPv4: ${SERVER_IP}"
echo

# ============================================================
# 3. DNS 检查
# ============================================================

info "[3/8] 检查 DNS..."

DOMAIN_IP="$(dig +short A "${DOMAIN}" | tail -n1 || true)"

if [ -z "${DOMAIN_IP}" ]; then

    error "${DOMAIN} 当前无法解析"

    echo
    echo "请添加 DNS："
    echo
    echo "类型：A"
    echo "主机：i"
    echo "值：  ${SERVER_IP}"
    echo

    exit 1
fi

echo "域名解析: ${DOMAIN_IP}"
echo "服务器IP: ${SERVER_IP}"

if [ "${DOMAIN_IP}" != "${SERVER_IP}" ]; then

    error "DNS 没有指向当前服务器"

    echo
    echo "当前服务器：${SERVER_IP}"
    echo "DNS 解析：  ${DOMAIN_IP}"
    echo

    exit 1
fi

success "DNS 检查通过"

# ============================================================
# 4. Let's Encrypt
# ============================================================

echo
info "[4/8] 配置 Let's Encrypt..."

mkdir -p /etc/letsencrypt

CERT_EXISTS=0

if [ -f "${LE_CERT}" ] && [ -f "${LE_KEY}" ]; then
    CERT_EXISTS=1
fi

# ------------------------------------------------------------
# 已存在证书
# ------------------------------------------------------------

if [ "${CERT_EXISTS}" -eq 1 ]; then

    success "检测到已有 Let's Encrypt 证书"

    echo
    openssl x509 \
        -in "${LE_CERT}" \
        -noout \
        -subject \
        -issuer \
        -dates

    echo

else

    info "没有检测到 ${DOMAIN} 的 Let's Encrypt 证书"

    # --------------------------------------------------------
    # 检查 80
    # --------------------------------------------------------

    if ss -lntp | grep -q ':80 '; then

        warn "检测到 TCP 80 正在使用"

        ss -lntp | grep ':80 ' || true

        echo
        info "尝试停止 Nginx / Apache..."

        systemctl stop nginx 2>/dev/null || true
        systemctl stop apache2 2>/dev/null || true
        systemctl stop httpd 2>/dev/null || true

        sleep 2

    fi

    # --------------------------------------------------------
    # 防火墙 80
    # --------------------------------------------------------

    if command -v ufw >/dev/null 2>&1; then
        ufw allow 80/tcp >/dev/null 2>&1 || true
    fi

    if command -v firewall-cmd >/dev/null 2>&1; then
        firewall-cmd --permanent --add-port=80/tcp \
            >/dev/null 2>&1 || true

        firewall-cmd --reload \
            >/dev/null 2>&1 || true
    fi

    # --------------------------------------------------------
    # 申请证书
    # --------------------------------------------------------

    echo
    info "开始申请 Let's Encrypt：${DOMAIN}"

    certbot certonly \
        --standalone \
        --preferred-challenges http \
        --non-interactive \
        --agree-tos \
        --register-unsafely-without-email \
        --keep-until-expiring \
        -d "${DOMAIN}"

    # --------------------------------------------------------
    # 检查
    # --------------------------------------------------------

    if [ ! -f "${LE_CERT}" ]; then
        error "Let's Encrypt 证书申请失败"
        exit 1
    fi

    if [ ! -f "${LE_KEY}" ]; then
        error "Let's Encrypt 私钥不存在"
        exit 1
    fi

    success "Let's Encrypt 证书申请成功"

    echo
    openssl x509 \
        -in "${LE_CERT}" \
        -noout \
        -subject \
        -issuer \
        -dates

fi

# ============================================================
# 5. 安装 sing-box
# ============================================================

echo
info "[5/8] 安装 sing-box..."

if command -v sing-box >/dev/null 2>&1; then

    success "sing-box 已经安装"

else

    info "开始安装 sing-box..."

    if ! bash -c \
        "$(curl -fsSL https://sing-box.app/deb-install.sh)"
    then

        warn "官方安装脚本失败，尝试 GitHub 安装"

        ARCH="$(dpkg --print-architecture)"

        case "${ARCH}" in
            amd64)
                SB_ARCH="amd64"
                ;;
            arm64)
                SB_ARCH="arm64"
                ;;
            armhf)
                SB_ARCH="armv7"
                ;;
            *)
                error "不支持的 CPU 架构：${ARCH}"
                exit 1
                ;;
        esac

        LATEST="$(
            curl -fsSL \
            https://api.github.com/repos/SagerNet/sing-box/releases/latest \
            | jq -r '.tag_name' \
            | sed 's/^v//'
        )"

        if [ -z "${LATEST}" ] || [ "${LATEST}" = "null" ]; then
            error "无法获取 sing-box 最新版本"
            exit 1
        fi

        wget -q \
            "https://github.com/SagerNet/sing-box/releases/download/v${LATEST}/sing-box_${LATEST}_linux_${SB_ARCH}.deb" \
            -O /tmp/sing-box.deb

        dpkg -i /tmp/sing-box.deb \
            || apt-get install -f -y

    fi

fi

if ! command -v sing-box >/dev/null 2>&1; then
    error "sing-box 安装失败"
    exit 1
fi

echo
sing-box version
echo

# ============================================================
# Reality 检查
# ============================================================

info "检查 Reality 支持..."

if ! sing-box generate reality-keypair >/dev/null 2>&1; then

    error "当前 sing-box 不支持 Reality"

    exit 1
fi

success "Reality 支持正常"

# ============================================================
# 6. 生成密钥
# ============================================================

echo
info "[6/8] 生成节点密钥..."

UUID="$(sing-box generate uuid 2>/dev/null || cat /proc/sys/kernel/random/uuid)"

REALITY_KEYPAIR="$(sing-box generate reality-keypair)"

REALITY_PRIVATE="$(
    echo "${REALITY_KEYPAIR}" |
    awk '/PrivateKey/ {print $2}'
)"

REALITY_PUBLIC="$(
    echo "${REALITY_KEYPAIR}" |
    awk '/PublicKey/ {print $2}'
)"

REALITY_SHORTID="$(openssl rand -hex 4)"

HY2_PASSWORD="$(openssl rand -hex 16)"

HY2_OBFS="$(openssl rand -hex 8)"

SS_PASSWORD="$(openssl rand -base64 32 | tr -d '\n')"

if [ -z "${REALITY_PRIVATE}" ] || \
   [ -z "${REALITY_PUBLIC}" ]; then

    error "Reality 密钥生成失败"

    echo "${REALITY_KEYPAIR}"

    exit 1
fi

success "节点密钥生成完成"

# ============================================================
# 7. BBR
# ============================================================

info "配置 TCP BBR..."

cat > /etc/sysctl.d/99-singbox-bbr.conf <<EOF
net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr
EOF

sysctl --system >/dev/null 2>&1 || true

CURRENT_CC="$(
    sysctl -n \
    net.ipv4.tcp_congestion_control \
    2>/dev/null || echo "unknown"
)"

echo "TCP 拥塞控制：${CURRENT_CC}"

# ============================================================
# 防火墙
# ============================================================

info "配置防火墙..."

if command -v ufw >/dev/null 2>&1; then

    ufw allow 80/tcp >/dev/null 2>&1 || true

    ufw allow "${VLESS_PORT}/tcp" \
        >/dev/null 2>&1 || true

    ufw allow "${HY2_PORT}/udp" \
        >/dev/null 2>&1 || true

    ufw allow "${SS_PORT}/tcp" \
        >/dev/null 2>&1 || true

fi

if command -v firewall-cmd >/dev/null 2>&1; then

    firewall-cmd --permanent \
        --add-port=80/tcp >/dev/null 2>&1 || true

    firewall-cmd --permanent \
        --add-port="${VLESS_PORT}/tcp" \
        >/dev/null 2>&1 || true

    firewall-cmd --permanent \
        --add-port="${HY2_PORT}/udp" \
        >/dev/null 2>&1 || true

    firewall-cmd --permanent \
        --add-port="${SS_PORT}/tcp" \
        >/dev/null 2>&1 || true

    firewall-cmd --reload \
        >/dev/null 2>&1 || true

fi

success "防火墙规则配置完成"

# ============================================================
# 创建目录
# ============================================================

mkdir -p "${SINGBOX_DIR}"
mkdir -p "${CLIENT_DIR}"
mkdir -p "${BACKUP_DIR}"

chmod 700 "${CLIENT_DIR}"

# ============================================================
# 备份旧配置
# ============================================================

if [ -f "${CONFIG_FILE}" ]; then

    BACKUP_FILE="${BACKUP_DIR}/config-$(date +%Y%m%d-%H%M%S).json"

    cp "${CONFIG_FILE}" "${BACKUP_FILE}"

    success "旧配置备份：${BACKUP_FILE}"

fi

# ============================================================
# 生成服务端配置
# ============================================================

echo
info "[7/8] 生成 sing-box 服务端配置..."

jq -n \
    --arg domain "${DOMAIN}" \
    --arg uuid "${UUID}" \
    --arg reality_sni "${REALITY_SNI}" \
    --arg reality_private "${REALITY_PRIVATE}" \
    --arg reality_shortid "${REALITY_SHORTID}" \
    --arg hy2_password "${HY2_PASSWORD}" \
    --arg hy2_obfs "${HY2_OBFS}" \
    --arg ss_password "${SS_PASSWORD}" \
    --arg cert_path "${LE_CERT}" \
    --arg key_path "${LE_KEY}" \
    --argjson vless_port "${VLESS_PORT}" \
    --argjson hy2_port "${HY2_PORT}" \
    --argjson ss_port "${SS_PORT}" \
'
{
  "log": {
    "level": "warn",
    "timestamp": true
  },

  "inbounds": [

    {
      "type": "vless",
      "tag": "VLESS-Reality",
      "listen": "::",
      "listen_port": $vless_port,

      "users": [
        {
          "uuid": $uuid,
          "flow": "xtls-rprx-vision"
        }
      ],

      "tls": {
        "enabled": true,
        "server_name": $reality_sni,

        "reality": {
          "enabled": true,

          "handshake": {
            "server": $reality_sni,
            "server_port": 443
          },

          "private_key": $reality_private,

          "short_id": [
            $reality_shortid
          ]
        }
      }
    },

    {
      "type": "hysteria2",
      "tag": "Hysteria2",
      "listen": "::",
      "listen_port": $hy2_port,

      "users": [
        {
          "password": $hy2_password
        }
      ],

      "tls": {
        "enabled": true,
        "server_name": $domain,
        "alpn": [
          "h3"
        ],
        "certificate_path": $cert_path,
        "key_path": $key_path
      },

      "obfs": {
        "type": "salamander",
        "password": $hy2_obfs
      }
    },

    {
      "type": "shadowsocks",
      "tag": "Shadowsocks-2022",
      "listen": "::",
      "listen_port": $ss_port,

      "network": "tcp",

      "method": "2022-blake3-aes-256-gcm",

      "password": $ss_password
    }

  ],

  "outbounds": [

    {
      "type": "direct",
      "tag": "direct"
    },

    {
      "type": "block",
      "tag": "block"
    }

  ]
}
' > "${CONFIG_FILE}"

chmod 600 "${CONFIG_FILE}"

# ============================================================
# 配置检查
# ============================================================

echo
info "检查 sing-box 配置..."

sing-box check -c "${CONFIG_FILE}"

success "配置检查通过"

# ============================================================
# systemd
# ============================================================

info "配置 sing-box systemd..."

cat > /etc/systemd/system/sing-box.service <<EOF
[Unit]
Description=sing-box service
Documentation=https://sing-box.sagernet.org/
After=network-online.target nss-lookup.target
Wants=network-online.target

[Service]
Type=simple

ExecStart=/usr/bin/sing-box run -c ${CONFIG_FILE}

Restart=on-failure
RestartSec=3

LimitNOFILE=1048576

NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

systemctl enable sing-box >/dev/null 2>&1

systemctl restart sing-box

sleep 3

if ! systemctl is-active --quiet sing-box; then

    error "sing-box 启动失败"

    journalctl \
        -u sing-box \
        --no-pager \
        -n 50

    exit 1
fi

success "sing-box 启动成功"

# ============================================================
# 自动续期 Hook
# ============================================================

info "配置 Let's Encrypt 自动续期..."

mkdir -p \
    /etc/letsencrypt/renewal-hooks/deploy

cat > \
/etc/letsencrypt/renewal-hooks/deploy/restart-sing-box.sh \
<<'EOF'
#!/bin/bash

LOG="/var/log/sing-box-cert-renew.log"

echo "============================================" >> "$LOG"
echo "$(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG"
echo "Let's Encrypt certificate renewed" >> "$LOG"

systemctl restart sing-box >> "$LOG" 2>&1

sleep 3

if systemctl is-active --quiet sing-box; then
    echo "sing-box restart SUCCESS" >> "$LOG"
else
    echo "sing-box restart FAILED" >> "$LOG"
    systemctl status sing-box --no-pager >> "$LOG" 2>&1
fi
EOF

chmod +x \
    /etc/letsencrypt/renewal-hooks/deploy/restart-sing-box.sh

# ============================================================
# Certbot Timer
# ============================================================

cat > /etc/systemd/system/certbot-singbox-renew.service <<'EOF'
[Unit]
Description=Certbot automatic renewal for sing-box

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet
EOF

cat > /etc/systemd/system/certbot-singbox-renew.timer <<'EOF'
[Unit]
Description=Automatic Let's Encrypt renewal

[Timer]
OnCalendar=*-*-* 03:15:00
OnCalendar=*-*-* 15:15:00
RandomizedDelaySec=1800
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload

systemctl enable --now certbot-singbox-renew.timer

success "自动续期 Timer 已启用"

# ============================================================
# 生成客户端配置
# ============================================================

info "生成客户端配置..."

cat > "${CLIENT_CONFIG}" <<EOF
{
  "log": {
    "level": "warn"
  },

  "inbounds": [
    {
      "type": "mixed",
      "tag": "mixed-in",
      "listen": "127.0.0.1",
      "listen_port": 7890
    }
  ],

  "outbounds": [

    {
      "type": "selector",
      "tag": "proxy",

      "outbounds": [
        "VLESS-Reality",
        "Hysteria2",
        "SS2022",
        "direct"
      ],

      "default": "VLESS-Reality"
    },

    {
      "type": "vless",
      "tag": "VLESS-Reality",

      "server": "${SERVER_IP}",
      "server_port": ${VLESS_PORT},

      "uuid": "${UUID}",

      "flow": "xtls-rprx-vision",

      "tls": {
        "enabled": true,
        "server_name": "${REALITY_SNI}",

        "utls": {
          "enabled": true,
          "fingerprint": "chrome"
        },

        "reality": {
          "enabled": true,
          "public_key": "${REALITY_PUBLIC}",
          "short_id": "${REALITY_SHORTID}"
        }
      }
    },

    {
      "type": "hysteria2",
      "tag": "Hysteria2",

      "server": "${SERVER_IP}",
      "server_port": ${HY2_PORT},

      "password": "${HY2_PASSWORD}",

      "tls": {
        "enabled": true,
        "server_name": "${DOMAIN}",
        "alpn": [
          "h3"
        ]
      },

      "obfs": {
        "type": "salamander",
        "password": "${HY2_OBFS}"
      }
    },

    {
      "type": "shadowsocks",
      "tag": "SS2022",

      "server": "${SERVER_IP}",
      "server_port": ${SS_PORT},

      "method": "2022-blake3-aes-256-gcm",

      "password": "${SS_PASSWORD}"
    },

    {
      "type": "direct",
      "tag": "direct"
    },

    {
      "type": "block",
      "tag": "block"
    }

  ],

  "route": {
    "auto_detect_interface": true,
    "final": "proxy"
  }
}
EOF

chmod 600 "${CLIENT_CONFIG}"

# ============================================================
# 分享链接
# ============================================================

VLESS_LINK="vless://${UUID}@${SERVER_IP}:${VLESS_PORT}?encryption=none&security=reality&sni=${REALITY_SNI}&fp=chrome&pbk=${REALITY_PUBLIC}&sid=${REALITY_SHORTID}&flow=xtls-rprx-vision&type=tcp#VLESS-Reality"

HY2_LINK="hysteria2://${HY2_PASSWORD}@${SERVER_IP}:${HY2_PORT}?sni=${DOMAIN}&alpn=h3&obfs=salamander&obfs-password=${HY2_OBFS}#Hysteria2"

SS_USERINFO="2022-blake3-aes-256-gcm:${SS_PASSWORD}"

SS_B64="$(
    printf '%s' "${SS_USERINFO}" |
    base64 -w 0 |
    tr '+/' '-_' |
    tr -d '='
)"

SS_LINK="ss://${SS_B64}@${SERVER_IP}:${SS_PORT}#Shadowsocks-2022"

cat > "${LINK_FILE}" <<EOF
============================================================
sing-box 节点信息
============================================================

服务器 IP:
${SERVER_IP}

域名:
${DOMAIN}

============================================================
VLESS + Reality + Vision
============================================================

${VLESS_LINK}

============================================================
Hysteria2
============================================================

${HY2_LINK}

============================================================
Shadowsocks 2022
============================================================

${SS_LINK}

============================================================
EOF

chmod 600 "${LINK_FILE}"

# ============================================================
# 证书自动续期测试
# ============================================================

echo
info "检查 Certbot..."

certbot certificates || true

echo
info "执行 Certbot dry-run 测试..."

if certbot renew --dry-run; then
    success "Certbot 自动续期测试通过"
else
    warn "Certbot dry-run 测试失败，请检查 Let's Encrypt 日志"
fi

# ============================================================
# 端口检查
# ============================================================

echo
info "检查监听端口..."

ss -lntup | grep -E \
":${VLESS_PORT}|:${HY2_PORT}|:${SS_PORT}" \
|| true

# ============================================================
# 最终输出
# ============================================================

echo
echo
echo -e "${PURPLE}"
echo "============================================================"
echo "              sing-box 安装完成"
echo "============================================================"
echo -e "${NC}"

echo -e "${GREEN}服务器 IP:${NC}"
echo "  ${SERVER_IP}"

echo
echo -e "${GREEN}域名:${NC}"
echo "  ${DOMAIN}"

echo
echo -e "${GREEN}Let's Encrypt:${NC}"
echo "  ${LE_CERT}"
echo "  ${LE_KEY}"

echo
echo -e "${GREEN}协议:${NC}"
echo "  VLESS + Reality + Vision : TCP ${VLESS_PORT}"
echo "  Hysteria2 + TLS           : UDP ${HY2_PORT}"
echo "  Shadowsocks 2022          : TCP ${SS_PORT}"

echo
echo -e "${GREEN}BBR:${NC}"
echo "  ${CURRENT_CC}"

echo
echo -e "${GREEN}自动续期:${NC}"
echo "  每天自动检查"
echo "  证书更新后自动重启 sing-box"

echo
echo -e "${GREEN}配置文件:${NC}"
echo "  ${CONFIG_FILE}"

echo
echo -e "${GREEN}客户端配置:${NC}"
echo "  ${CLIENT_CONFIG}"

echo
echo -e "${GREEN}节点链接:${NC}"
echo "  ${LINK_FILE}"

echo
echo -e "${CYAN}"
echo "============================================================"
echo "VLESS + Reality + Vision"
echo "============================================================"
echo -e "${NC}"

echo "${VLESS_LINK}"

echo
echo -e "${CYAN}"
echo "============================================================"
echo "Hysteria2"
echo "============================================================"
echo -e "${NC}"

echo "${HY2_LINK}"

echo
echo -e "${CYAN}"
echo "============================================================"
echo "Shadowsocks 2022"
echo "============================================================"
echo -e "${NC}"

echo "${SS_LINK}"

echo
echo -e "${PURPLE}"
echo "============================================================"
echo "常用命令"
echo "============================================================"
echo -e "${NC}"

echo "查看状态:"
echo "systemctl status sing-box --no-pager"

echo
echo "查看日志:"
echo "journalctl -u sing-box -f"

echo
echo "重启:"
echo "systemctl restart sing-box"

echo
echo "检查配置:"
echo "sing-box check -c /etc/sing-box/config.json"

echo
echo "查看证书:"
echo "certbot certificates"

echo
echo "查看续期 Timer:"
echo "systemctl status certbot-singbox-renew.timer --no-pager"

echo
echo "查看证书续期日志:"
echo "cat /var/log/sing-box-cert-renew.log"

echo
echo -e "${GREEN}"
echo "============================================================"
echo "                    全部完成"
echo "============================================================"
echo -e "${NC}"
