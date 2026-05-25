#!/bin/bash
# ============================================================
# اسکریپت دیپلوی Deutsch mit Tina - Deployment Script
# tinagerman.com
# ============================================================
# استفاده: ./deploy.sh
# این اسکریپت پروژه Next.js را بیلد و دیپلوی می‌کند
# ============================================================

set -e # توقف در صورت خطا - Stop on error

# === تنظیمات - Configuration ===
APP_DIR="/home/tinagerman/app"
LOG_DIR="/home/tinagerman/logs"
BRANCH="main"
BACKUP_DIR="/home/tinagerman/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# رنگ‌ها برای خروجی - Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # بدون رنگ - No Color

# === توابع کمکی - Helper functions ===
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# === شروع دیپلوی - Start deployment ===
echo ""
echo "=============================================="
echo "  🚀 Deutsch mit Tina - Deployment"
echo "  tinagerman.com"
echo "=============================================="
echo ""

# مرحله ۱: بررسی پیش‌نیازها - Step 1: Check prerequisites
log_info "Checking prerequisites..."

if ! command -v bun &> /dev/null; then
    log_error "Bun is not installed! Install it first: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    log_error "PM2 is not installed! Install it first: npm install -g pm2"
    exit 1
fi

if [ ! -d "$APP_DIR" ]; then
    log_error "App directory not found: $APP_DIR"
    log_info "Run scripts/setup-server.sh first to set up the server."
    exit 1
fi

log_success "Prerequisites OK"

# مرحله ۲: ورود به دایرکتوری پروژه - Step 2: Enter project directory
cd "$APP_DIR"
log_info "Working directory: $(pwd)"

# مرحله ۳: بکاپ از دیتابیس - Step 3: Backup database
log_info "Backing up database..."
mkdir -p "$BACKUP_DIR"
if [ -f "db/custom.db" ]; then
    cp "db/custom.db" "$BACKUP_DIR/custom_${TIMESTAMP}.db"
    log_success "Database backed up to $BACKUP_DIR/custom_${TIMESTAMP}.db"
    # حذف بکاپ‌های قدیمی‌تر از ۷ روز - Delete backups older than 7 days
    find "$BACKUP_DIR" -name "custom_*.db" -mtime +7 -delete 2>/dev/null || true
else
    log_warn "No database file found at db/custom.db"
fi

# مرحله ۴: دریافت کد جدید از گیت - Step 4: Pull latest code
log_info "Pulling latest code from git (branch: $BRANCH)..."
if [ -d ".git" ]; then
    git fetch origin
    git reset --hard "origin/$BRANCH"
    log_success "Code updated from git"
else
    log_warn "Not a git repository. Skipping git pull."
    log_info "Make sure files are up to date manually."
fi

# مرحله ۵: نصب وابستگی‌ها - Step 5: Install dependencies
log_info "Installing dependencies with bun..."
bun install --frozen-lockfile 2>/dev/null || bun install
log_success "Dependencies installed"

# نصب وابستگی‌های چت سرویس - Install chat service dependencies
log_info "Installing chat service dependencies..."
cd mini-services/chat-service
bun install --frozen-lockfile 2>/dev/null || bun install
cd "$APP_DIR"
log_success "Chat service dependencies installed"

# مرحله ۶: تولید Prisma Client - Step 6: Generate Prisma client
log_info "Generating Prisma client..."
bunx prisma generate
log_success "Prisma client generated"

# مرحله ۷: اعمال تغییرات دیتابیس - Step 7: Push database schema
log_info "Pushing database schema changes..."
bunx prisma db push
log_success "Database schema updated"

# مرحله ۸: بیلد پروژه Next.js - Step 8: Build Next.js app
log_info "Building Next.js application..."
bun run build
log_success "Next.js build completed"

# مرحله ۹: کپی فایل‌های استاتیک و پابلیک - Step 9: Copy static and public files
log_info "Copying static files and public folder to standalone output..."
STANDALONE_DIR=".next/standalone"

if [ -d "$STANDALONE_DIR" ]; then
    # کپی فایل‌های استاتیک - Copy static files
    cp -r .next/static "$STANDALONE_DIR/.next/"
    log_success "Static files copied"

    # کپی پوشه پابلیک - Copy public folder
    cp -r public "$STANDALONE_DIR/"
    log_success "Public folder copied"

    # کپی فایل دیتابیس اگر وجود ندارد - Copy database if not exists
    if [ ! -d "$STANDALONE_DIR/db" ]; then
        mkdir -p "$STANDALONE_DIR/db"
    fi
    if [ -f "db/custom.db" ] && [ ! -f "$STANDALONE_DIR/db/custom.db" ]; then
        cp "db/custom.db" "$STANDALONE_DIR/db/"
        log_success "Database copied to standalone"
    fi

    # کپی فایل .env - Copy .env file
    if [ -f ".env" ] && [ ! -f "$STANDALONE_DIR/.env" ]; then
        cp ".env" "$STANDALONE_DIR/"
        log_success ".env file copied to standalone"
    fi

    # کپی پوشه prisma - Copy prisma schema
    if [ -d "prisma" ]; then
        mkdir -p "$STANDALONE_DIR/prisma"
        cp -r prisma/* "$STANDALONE_DIR/prisma/"
        log_success "Prisma schema copied"
    fi
else
    log_error "Standalone directory not found: $STANDALONE_DIR"
    log_error "Build may have failed. Check the build output above."
    exit 1
fi

# مرحله ۱۰: ساخت پوشه لاگ - Step 10: Create log directory
mkdir -p "$LOG_DIR"
log_success "Log directory ready: $LOG_DIR"

# مرحله ۱۱: ریستارت PM2 - Step 11: Restart PM2 processes
log_info "Restarting PM2 processes..."

# بررسی اینکه آیا پروسه‌ها از قبل وجود دارند - Check if processes already exist
if pm2 describe tinagerman-web &> /dev/null; then
    pm2 restart tinagerman-web
    log_success "tinagerman-web restarted"
else
    pm2 start ecosystem.config.js --only tinagerman-web
    log_success "tinagerman-web started"
fi

if pm2 describe tinagerman-chat &> /dev/null; then
    pm2 restart tinagerman-chat
    log_success "tinagerman-chat restarted"
else
    pm2 start ecosystem.config.js --only tinagerman-chat
    log_success "tinagerman-chat started"
fi

# ذخیره تنظیمات PM2 - Save PM2 configuration
pm2 save
log_success "PM2 configuration saved"

# مرحله ۱۲: نمایش وضعیت - Step 12: Show status
echo ""
echo "=============================================="
echo "  ✅ Deployment Complete!"
echo "=============================================="
echo ""

pm2 status

echo ""
log_info "Useful PM2 commands:"
echo "  pm2 logs                - View all logs"
echo "  pm2 logs tinagerman-web - View web logs"
echo "  pm2 logs tinagerman-chat - View chat logs"
echo "  pm2 monit               - Monitor processes"
echo "  pm2 restart all         - Restart all"
echo "  pm2 stop all            - Stop all"
echo ""
log_info "Website should be live at: https://tinagerman.com"
echo ""
