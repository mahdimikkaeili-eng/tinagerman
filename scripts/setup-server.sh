#!/bin/bash
# ============================================================
# اسکریپت راه‌اندازی سرور - Server Setup Script
# Deutsch mit Tina - tinagerman.com
# ============================================================
# این اسکریپت سرور Ubuntu را برای دیپلوی آماده می‌کند
# This script prepares an Ubuntu VPS for deployment
# ============================================================
# استفاده: sudo bash scripts/setup-server.sh
# ============================================================

set -e # توقف در صورت خطا - Stop on error

# === رنگ‌ها - Colors ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# === بررسی روت - Check root ===
if [ "$EUID" -ne 0 ]; then
    log_error "این اسکریپت باید با sudo اجرا شود - This script must be run as root/sudo"
    exit 1
fi

echo ""
echo "=============================================="
echo "  🖥️  Server Setup - Deutsch mit Tina"
echo "  tinagerman.com"
echo "=============================================="
echo ""

# === مرحله ۱: آپدیت سیستم - Step 1: Update system ===
log_info "Step 1: Updating system packages..."
apt update && apt upgrade -y
log_success "System packages updated"

# نصب ابزارهای پایه - Install basic tools
log_info "Installing basic tools..."
apt install -y curl wget git unzip software-properties-common ufw
log_success "Basic tools installed"

# === مرحله ۲: نصب Node.js - Step 2: Install Node.js ===
log_info "Step 2: Installing Node.js 20.x..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    log_warn "Node.js already installed: $NODE_VERSION"
else
    # نصب از طریق NodeSource - Install via NodeSource
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    log_success "Node.js $(node -v) installed"
fi

# === مرحله ۳: نصب Bun - Step 3: Install Bun ===
log_info "Step 3: Installing Bun runtime..."
if command -v bun &> /dev/null; then
    BUN_VERSION=$(bun -v)
    log_warn "Bun already installed: $BUN_VERSION"
else
    curl -fsSL https://bun.sh/install | bash
    # اضافه کردن bun به PATH - Add bun to PATH
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    # اضافه کردن به bashrc برای کاربر tinagerman - Add to bashrc for tinagerman user
    log_success "Bun $(bun -v) installed"
fi

# === مرحله ۴: نصب PM2 - Step 4: Install PM2 ===
log_info "Step 4: Installing PM2 process manager..."
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 -v)
    log_warn "PM2 already installed: $PM2_VERSION"
else
    npm install -g pm2
    log_success "PM2 installed"
fi

# === مرحله ۵: ساخت کاربر و دایرکتوری - Step 5: Create user and directory ===
log_info "Step 5: Setting up application directory..."

# ساخت کاربر tinagerman - Create tinagerman user
if id "tinagerman" &>/dev/null; then
    log_warn "User tinagerman already exists"
else
    useradd -m -s /bin/bash tinagerman
    log_success "User tinagerman created"
fi

# ساخت دایرکتوری‌ها - Create directories
mkdir -p /home/tinagerman/app
mkdir -p /home/tinagerman/logs
mkdir -p /home/tinagerman/backups

# تنظیم مالکیت - Set ownership
chown -R tinagerman:tinagerman /home/tinagerman
log_success "Directories created at /home/tinagerman/"

# === مرحله ۶: تنظیم فایروال - Step 6: Configure firewall ===
log_info "Step 6: Configuring UFW firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
# پورت‌های داخلی فقط از طریق nginx دسترسی دارند - Internal ports only accessible via nginx
# ufw allow 3000  # فقط اگر مستقیم نیاز بود - Only if direct access needed
ufw --force enable
log_success "Firewall configured (SSH + Nginx allowed)"

# === مرحله ۷: نصب Nginx - Step 7: Install Nginx ===
log_info "Step 7: Installing and configuring Nginx..."
apt install -y nginx
log_success "Nginx installed"

# === مرحله ۸: تنظیم Nginx Reverse Proxy - Step 8: Nginx config ===
log_info "Step 8: Creating Nginx reverse proxy configuration..."
cat > /etc/nginx/sites-available/tinagerman.com << 'NGINX_CONF'
# ============================================================
# Nginx Reverse Proxy Config - Deutsch mit Tina
# tinagerman.com
# ============================================================

# ریدایرکت HTTP به HTTPS - Redirect HTTP to HTTPS
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

    # گواهینامه SSL - SSL certificates (by certbot)
    ssl_certificate /etc/letsencrypt/live/tinagerman.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tinagerman.com/privkey.pem;

    # تنظیمات SSL - SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # هدرهای امنیتی - Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # لاگ‌ها - Logs
    access_log /var/log/nginx/tinagerman_access.log;
    error_log /var/log/nginx/tinagerman_error.log;

    # محدودیت آپلود - Upload limit
    client_max_body_size 10M;

    # پراکسی برای Next.js - Proxy to Next.js
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

    # فایل‌های استاتیک با کش - Static files with cache
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # فایل‌های پابلیک - Public files
    location /robots.txt {
        proxy_pass http://127.0.0.1:3000;
        expires 1d;
    }
}
NGINX_CONF

# فعال‌سازی سایت - Enable site
ln -sf /etc/nginx/sites-available/tinagerman.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# بررسی تنظیمات - Test config
nginx -t
log_success "Nginx configured for tinagerman.com"

# === مرحله ۹: نصب Certbot برای SSL - Step 9: Install Certbot ===
log_info "Step 9: Installing Certbot for SSL..."
apt install -y certbot python3-certbot-nginx
log_success "Certbot installed"
log_warn "Run 'certbot --nginx -d tinagerman.com -d www.tinagerman.com' after DNS is configured"

# === مرحله ۱۰: تنظیم PM2 Startup - Step 10: PM2 startup ===
log_info "Step 10: Setting up PM2 startup service..."
sudo -u tinagerman bash -c 'export PATH="$HOME/.bun/bin:$PATH"; pm2 startup systemd -u tinagerman --hp /home/tinagerman'
log_success "PM2 startup configured"

# === مرحله ۱۱: ریستارت Nginx - Step 11: Restart Nginx ===
log_info "Step 11: Restarting Nginx..."
systemctl restart nginx
systemctl enable nginx
log_success "Nginx restarted and enabled"

# === نمایش مراحل بعدی - Show next steps ===
echo ""
echo "=============================================="
echo "  ✅ Server Setup Complete!"
echo "=============================================="
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "  1. کپی فایل‌های پروژه - Copy project files:"
echo "     scp -r ./ tinagerman@your-server:/home/tinagerman/app/"
echo ""
echo "  2. تنظیم DNS - Configure DNS:"
echo "     Point tinagerman.com A record to this server's IP"
echo ""
echo "  3. تنظیم فایل محیطی - Set up environment:"
echo "     cd /home/tinagerman/app"
echo "     cp .env.example .env"
echo "     nano .env  # Edit values"
echo ""
echo "  4. دریافت گواهینامه SSL - Get SSL certificate:"
echo "     certbot --nginx -d tinagerman.com -d www.tinagerman.com"
echo ""
echo "  5. اجرای اسکریپت دیپلوی - Run deployment:"
echo "     cd /home/tinagerman/app"
echo "     chmod +x deploy.sh"
echo "     ./deploy.sh"
echo ""
echo -e "${BLUE}Directory Structure:${NC}"
echo "  /home/tinagerman/app/     - Application files"
echo "  /home/tinagerman/logs/    - PM2 & app logs"
echo "  /home/tinagerman/backups/ - Database backups"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  pm2 status               - Check process status"
echo "  pm2 logs                 - View logs"
echo "  pm2 monit                - Monitor resources"
echo "  nginx -t                 - Test nginx config"
echo "  systemctl status nginx   - Check nginx status"
echo "  ufw status               - Check firewall"
echo ""
