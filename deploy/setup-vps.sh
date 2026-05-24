#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  TFC — First-Time VPS Setup Script (Ubuntu 22.04 / 24.04)                  ║
# ║  Run this ONCE on a fresh OVH VPS                                          ║
# ║  Usage: chmod +x setup-vps.sh && sudo ./setup-vps.sh                       ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

set -euo pipefail

DOMAIN="tfc-event.com"
APP_DIR="/var/www/tfc"
PM2_LOG_DIR="/var/log/pm2"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  TFC VPS Setup — $DOMAIN"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── 1. System Update ─────────────────────────────────────────────────────────
echo "▸ [1/7] Updating system packages..."
apt update && apt upgrade -y

# ── 2. Install Node.js 20 LTS ───────────────────────────────────────────────
echo "▸ [2/7] Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo "  Node: $(node -v)  |  NPM: $(npm -v)"

# ── 3. Install PM2 ──────────────────────────────────────────────────────────
echo "▸ [3/7] Installing PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root
mkdir -p "$PM2_LOG_DIR"

# ── 4. Install Nginx ────────────────────────────────────────────────────────
echo "▸ [4/7] Installing Nginx..."
apt install -y nginx
systemctl enable nginx

# ── 5. Install Certbot (SSL) ────────────────────────────────────────────────
echo "▸ [5/7] Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# ── 6. Create App Directory ─────────────────────────────────────────────────
echo "▸ [6/7] Creating application directory..."
mkdir -p "$APP_DIR"

# ── 7. Firewall Setup ───────────────────────────────────────────────────────
echo "▸ [7/7] Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ VPS Setup Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Next steps:"
echo "  1. Upload your project to $APP_DIR"
echo "  2. Copy .env.production.example → .env and fill in real values"
echo "  3. Run: chmod +x deploy/deploy.sh && ./deploy/deploy.sh"
echo "  4. Set up SSL: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "  5. Copy Nginx config: cp deploy/nginx.conf /etc/nginx/sites-available/tfc"
echo "     ln -s /etc/nginx/sites-available/tfc /etc/nginx/sites-enabled/"
echo "     rm /etc/nginx/sites-enabled/default"
echo "     nginx -t && systemctl reload nginx"
echo ""
