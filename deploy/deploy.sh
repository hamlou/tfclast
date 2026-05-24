#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  TFC — Deployment Script                                                    ║
# ║  Run this every time you push updates                                       ║
# ║  Usage: chmod +x deploy/deploy.sh && ./deploy/deploy.sh                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

set -euo pipefail

APP_DIR="/var/www/tfc"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  TFC Deploy — $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════════"
echo ""

cd "$APP_DIR"

# ── 1. Pull latest code ─────────────────────────────────────────────────────
echo "▸ [1/6] Pulling latest code..."
git pull origin main

# ── 2. Install frontend dependencies ────────────────────────────────────────
echo "▸ [2/6] Installing frontend dependencies..."
npm ci --production=false

# ── 3. Build React frontend ─────────────────────────────────────────────────
echo "▸ [3/6] Building frontend..."
npm run build

# ── 4. Install backend dependencies ─────────────────────────────────────────
echo "▸ [4/6] Installing backend dependencies..."
cd server
npm ci --production
cd ..

# ── 5. Restart PM2 ──────────────────────────────────────────────────────────
echo "▸ [5/6] Restarting PM2..."
if pm2 describe tfc-api > /dev/null 2>&1; then
    pm2 reload ecosystem.config.js --update-env
else
    pm2 start deploy/ecosystem.config.js
fi
pm2 save

# ── 6. Reload Nginx ─────────────────────────────────────────────────────────
echo "▸ [6/6] Reloading Nginx..."
nginx -t && systemctl reload nginx

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Deployment Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Health check: curl -s https://tfc-event.com/api/health"
echo "  PM2 status:   pm2 status"
echo "  PM2 logs:     pm2 logs tfc-api --lines 50"
echo ""
