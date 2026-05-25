#!/bin/bash
# ============================================================
# راهنمای تنظیم CyberPanel - CyberPanel Setup Guide
# Deutsch mit Tina - tinagerman.com
# ============================================================
# این اسکریپت راهنمای تنظیم سایت در CyberPanel را نشان می‌دهد
# This script shows the CyberPanel setup guide and configures
# the reverse proxy from CyberPanel to Node.js
# ============================================================
# استفاده: sudo bash scripts/cyberpanel-setup.sh
# ============================================================

set -e

# === رنگ‌ها - Colors ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo "=============================================="
echo "  🌐 CyberPanel Setup Guide"
echo "  Deutsch mit Tina - tinagerman.com"
echo "=============================================="
echo ""

# === مرحله ۱: ساخت وب‌سایت در CyberPanel - Step 1 ===
echo -e "${CYAN}━━━ Step 1: Create Website in CyberPanel ━━━${NC}"
echo ""
echo "  1. Login to CyberPanel: https://your-server-ip:8090"
echo "  2. Go to: Websites → Create Website"
echo "  3. Fill in the form:"
echo "     - Select Package: Default"
echo "     - Select Owner: admin"
echo "     - Domain Name: tinagerman.com"
echo "     - Email: your-email@example.com"
echo "     - PHP: Leave default (we won't use PHP)"
echo "  4. Click 'Create Website'"
echo ""
echo -e "${YELLOW}⚠️  Important: Do NOT enable PHP for this site${NC}"
echo ""

# === مرحله ۲: تنظیم DNS - Step 2 ===
echo -e "${CYAN}━━━ Step 2: Configure DNS ━━━${NC}"
echo ""
echo "  Point your domain DNS to the server:"
echo "     - tinagerman.com    → A Record → Server IP"
echo "     - www.tinagerman.com → A Record → Server IP"
echo ""
echo "  If using CyberPanel's DNS:"
echo "     1. Go to: DNS → Create DNS Zone"
echo "     2. Add A records for tinagerman.com and www"
echo ""

# === مرحله ۳: تنظیم Reverse Proxy - Step 3 ===
echo -e "${CYAN}━━━ Step 3: Configure Reverse Proxy in CyberPanel ━━━${NC}"
echo ""
echo "  Option A: Using CyberPanel's Conf Editor"
echo "  ------------------------------------------"
echo "  1. Go to: Websites → List Websites"
echo "  2. Click 'Manage' next to tinagerman.com"
echo "  3. Click 'Configurations' → 'vHosts'"
echo "  4. Find the tinagerman.com vhost file"
echo "  5. Replace the entire configuration with the content below"
echo ""

# تولید تنظیمات vhost - Generate vhost config
DOMAIN_VHOST_PATH="/etc/nginx/sites-available/tinagerman.com"

echo -e "${BLUE}=== Nginx vHost Configuration ===${NC}"
cat << 'VHOST_CONFIG'
# ============================================================
# CyberPanel Nginx vHost - Deutsch mit Tina
# tinagerman.com
# ============================================================
# این فایل را در CyberPanel → Configurations → vHosts قرار دهید
# Place this file in CyberPanel → Configurations → vHosts
# ============================================================

server {
    listen 80;
    listen [::]:80;
    server_name tinagerman.com www.tinagerman.com;

    # ریدایرکت به HTTPS - Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tinagerman.com www.tinagerman.com;

    # گواهینامه SSL - SSL certificates
    # CyberPanel معمولاً SSL را مدیریت می‌کند
    # CyberPanel usually manages SSL
    ssl_certificate /etc/letsencrypt/live/tinagerman.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tinagerman.com/privkey.pem;

    # تنظیمات SSL - SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # هدرهای امنیتی - Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # لاگ‌ها - Logs
    access_log /home/tinagerman/logs/nginx_access.log;
    error_log /home/tinagerman/logs/nginx_error.log;

    # محدودیت آپلود - Upload limit
    client_max_body_size 10M;

    # ریشه وب - Web root (CyberPanel needs this)
    root /home/tinagerman.app/public_html;
    index index.html;

    # پراکسی برای Next.js - Proxy to Next.js app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # پراکسی WebSocket برای چت - WebSocket proxy for chat
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # فایل‌های استاتیک با کش طولانی - Static files with long cache
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # ربات‌ها - Robots
    location /robots.txt {
        proxy_pass http://127.0.0.1:3000;
        expires 1d;
    }

    # بستن دسترسی به فایل‌های مخفی - Block hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
VHOST_CONFIG

echo ""

# === مرحله ۴: SSL - Step 4 ===
echo -e "${CYAN}━━━ Step 4: Setup SSL in CyberPanel ━━━${NC}"
echo ""
echo "  Option A: Using CyberPanel's built-in SSL"
echo "  ------------------------------------------"
echo "  1. Go to: SSL → Manage SSL"
echo "  2. Select tinagerman.com"
echo "  3. Click 'Issue SSL'"
echo ""
echo "  Option B: Using Certbot (alternative)"
echo "  -------------------------------------"
echo "  certbot --nginx -d tinagerman.com -d www.tinagerman.com"
echo ""

# === مرحله ۵: فایل .htaccess (اگر OpenLiteSpeed) - Step 5 ===
echo -e "${CYAN}━━━ Step 5: If using OpenLiteSpeed (CyberPanel default) ━━━${NC}"
echo ""
echo "  CyberPanel uses OpenLiteSpeed by default, not Nginx."
echo "  If using OpenLiteSpeed, add rewrite rules instead:"
echo ""
echo -e "${BLUE}=== OpenLiteSpeed Rewrite Rules ===${NC}"
cat << 'OLS_REWRITE'
# OpenLiteSpeed rewrite rules for Next.js
# Add in CyberPanel → Rewrite Rules → tinagerman.com

RewriteEngine On

# ریدایرکت به HTTPS - Redirect to HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# پراکسی به Node.js - Proxy to Node.js
RewriteRule ^(.*)$ http://127.0.0.1:3000$1 [P,L]

# WebSocket برای چت - WebSocket for chat
# در OpenLiteSpeed نیاز به تنظیم جداگانه WebSocket دارد
# OpenLiteSpeed needs separate WebSocket configuration
OLS_REWRITE

echo ""
echo -e "${YELLOW}⚠️  For WebSocket support in OpenLiteSpeed:${NC}"
echo "  You need to enable WebSocket in the virtual host settings:"
echo "  1. Go to: Websites → List Websites → Manage tinagerman.com"
echo "  2. Click 'Configurations' → 'vHosts'"
echo "  3. Add WebSocket proxy in the 'Context' section"
echo "  4. Set URI: /socket.io/ and Backend: http://127.0.0.1:3003"
echo ""

# === مرحله ۶: راه‌اندازی - Step 6 ===
echo -e "${CYAN}━━━ Step 6: Deploy the Application ━━━${NC}"
echo ""
echo "  1. Copy project files to the server:"
echo "     scp -r ./ tinagerman@your-server:/home/tinagerman/app/"
echo ""
echo "  2. Set up environment:"
echo "     cd /home/tinagerman/app"
echo "     cp .env.example .env"
echo "     nano .env"
echo ""
echo "  3. Run deployment:"
echo "     chmod +x deploy.sh"
echo "     ./deploy.sh"
echo ""
echo "  4. Restart web server after vhost changes:"
echo "     For Nginx:      systemctl restart nginx"
echo "     For OpenLiteSpeed: systemctl restart lsws"
echo ""

# === مرحله ۷: نصب خودکار (اختیاری) - Step 7: Auto setup (optional) ===
echo -e "${CYAN}━━━ Step 7: Automatic Nginx Config (Optional) ━━━${NC}"
echo ""
echo -e "${YELLOW}Do you want to automatically configure Nginx now? (y/n)${NC}"
read -r AUTO_CONFIG

if [ "$AUTO_CONFIG" = "y" ] || [ "$AUTO_CONFIG" = "Y" ]; then
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}Need root/sudo for auto-configuration${NC}"
    else
        echo "Configuring Nginx..."

        # ساخت دایرکتوری‌ها - Create directories
        mkdir -p /home/tinagerman/app
        mkdir -p /home/tinagerman/logs
        mkdir -p /home/tinagerman/backups

        # نصب nginx اگر نصب نیست - Install nginx if not installed
        if ! command -v nginx &> /dev/null; then
            apt update && apt install -y nginx
        fi

        # نوشتن تنظیمات - Write config
        cat > /etc/nginx/sites-available/tinagerman.com << 'NGINX_VHOST'
server {
    listen 80;
    listen [::]:80;
    server_name tinagerman.com www.tinagerman.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tinagerman.com www.tinagerman.com;

    ssl_certificate /etc/letsencrypt/live/tinagerman.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tinagerman.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    access_log /home/tinagerman/logs/nginx_access.log;
    error_log /home/tinagerman/logs/nginx_error.log;
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_VHOST

        # فعال‌سازی - Enable
        ln -sf /etc/nginx/sites-available/tinagerman.com /etc/nginx/sites-enabled/
        nginx -t
        systemctl reload nginx

        echo -e "${GREEN}✅ Nginx configured!${NC}"
        echo -e "${YELLOW}Remember to get SSL: certbot --nginx -d tinagerman.com -d www.tinagerman.com${NC}"
    fi
fi

echo ""
echo "=============================================="
echo "  Setup guide complete!"
echo "=============================================="
echo ""
echo "For more help, see the project README."
echo ""
