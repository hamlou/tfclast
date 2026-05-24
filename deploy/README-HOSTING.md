# TFC — Production Hosting Guide (OVH VPS)

Complete step-by-step guide to deploy TFC on an OVH VPS running Ubuntu 22.04/24.04.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| OVH VPS | Ubuntu 22.04 or 24.04 LTS |
| Domain | `tfc-event.com` pointed to your VPS IP |
| SSH access | Root or sudo user |
| Git repo | Your TFC project pushed to GitHub |

---

## Step 1 — Point Your Domain

In your OVH DNS manager (or wherever `tfc-event.com` is registered):

| Type | Name | Value |
|------|------|-------|
| A | `@` | `YOUR_VPS_IP` |
| A | `www` | `YOUR_VPS_IP` |

Wait 5–30 minutes for DNS propagation. Verify with:
```bash
ping tfc-event.com
```

---

## Step 2 — Initial VPS Setup

SSH into your VPS and run the setup script:

```bash
ssh root@YOUR_VPS_IP

# Upload or clone your project
cd /var/www
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git tfc
cd tfc

# Run the first-time setup
chmod +x deploy/setup-vps.sh
sudo ./deploy/setup-vps.sh
```

This installs: **Node.js 20**, **PM2**, **Nginx**, **Certbot**, and configures the firewall.

---

## Step 3 — Configure Environment Variables

```bash
cd /var/www/tfc
cp deploy/.env.production.example .env
nano .env
```

Fill in ALL values with your **real production keys**. Critical ones:

| Variable | Where to get it |
|----------|----------------|
| `STRIPE_SECRET_KEY` | [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks (create endpoint first) |
| `FIREBASE_PRIVATE_KEY` | Firebase Console → Project Settings → Service Accounts → Generate Key |
| `NOWPAYMENTS_API_KEY` | [NOWPayments Dashboard](https://account.nowpayments.io/) |
| `RESEND_API_KEY` | [Resend Dashboard](https://resend.com/api-keys) |
| `IMGBB_API_KEY` | [ImgBB API](https://api.imgbb.com/) |

---

## Step 4 — Deploy

```bash
cd /var/www/tfc
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

This will: install deps → build React → start PM2 → reload Nginx.

---

## Step 5 — Configure Nginx

```bash
# Copy our config
sudo cp deploy/nginx.conf /etc/nginx/sites-available/tfc

# Enable it
sudo ln -sf /etc/nginx/sites-available/tfc /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 6 — SSL Certificate (HTTPS)

```bash
sudo certbot --nginx -d tfc-event.com -d www.tfc-event.com
```

Follow the prompts. Certbot will auto-renew via systemd timer.

Verify auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

## Step 7 — Configure Stripe Webhooks

Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks):

1. Click **Add endpoint**
2. URL: `https://tfc-event.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
4. Copy the **Signing secret** → paste into `.env` as `STRIPE_WEBHOOK_SECRET`
5. Restart PM2: `pm2 reload tfc-api`

---

## Step 8 — Configure NOWPayments IPN

Go to [NOWPayments Settings](https://account.nowpayments.io/):

1. Set IPN URL to: `https://tfc-event.com/api/webhooks/nowpayments`
2. Copy your **IPN Secret Key** → paste into `.env` as `NOWPAYMENTS_IPN_SECRET`
3. Restart PM2: `pm2 reload tfc-api`

---

## Step 9 — Verify Deployment

```bash
# Check PM2 is running
pm2 status

# Check health endpoint
curl -s https://tfc-event.com/api/health | python3 -m json.tool

# Check Nginx is serving
curl -I https://tfc-event.com

# View logs
pm2 logs tfc-api --lines 50
```

---

## Updating the Site

Every time you push changes to GitHub:

```bash
cd /var/www/tfc
./deploy/deploy.sh
```

Or manually:
```bash
git pull origin main
npm ci && npm run build
cd server && npm ci --production && cd ..
pm2 reload tfc-api
```

---

## 🔑 API Key Rotation Steps

> **CRITICAL:** If your keys were ever exposed (committed to Git, leaked, etc.), rotate them immediately:

### Stripe
1. Go to [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
2. Click **Roll key** next to the secret key
3. Update `.env` with the new `sk_live_...` key
4. For webhooks: delete the old endpoint, create a new one, update `STRIPE_WEBHOOK_SECRET`

### Firebase
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click **Generate new private key**
3. Copy the new `private_key` and `client_email` into `.env`
4. The old key is automatically invalidated

### NOWPayments
1. Go to [NOWPayments Settings](https://account.nowpayments.io/)
2. Regenerate your API key and IPN secret
3. Update both values in `.env`

### Resend
1. Go to [Resend API Keys](https://resend.com/api-keys)
2. Delete the old key, create a new one
3. Update `RESEND_API_KEY` in `.env`

### ImgBB
1. Go to [ImgBB API](https://api.imgbb.com/)
2. Generate a new key
3. Update `IMGBB_API_KEY` in `.env`

**After rotating any key:**
```bash
pm2 reload tfc-api
```

---

## Monitoring & Troubleshooting

| Command | Purpose |
|---------|---------|
| `pm2 status` | Check if app is running |
| `pm2 logs tfc-api --lines 100` | View recent logs |
| `pm2 monit` | Real-time CPU/memory monitor |
| `pm2 reload tfc-api` | Zero-downtime restart |
| `pm2 restart tfc-api` | Hard restart |
| `sudo nginx -t` | Test Nginx config |
| `sudo systemctl reload nginx` | Reload Nginx |
| `sudo certbot renew` | Renew SSL certificates |
| `df -h` | Check disk space |
| `htop` | System resource monitor |

### Common Issues

**502 Bad Gateway**
→ PM2 is not running. Check: `pm2 status` and `pm2 logs tfc-api`

**Webhook signature validation fails**
→ Make sure `STRIPE_WEBHOOK_SECRET` matches the endpoint secret in Stripe Dashboard

**CORS errors in browser console**
→ Check `FRONTEND_URL` in `.env` matches exactly (including `https://`)

**SSL certificate expired**
→ Run `sudo certbot renew` and `sudo systemctl reload nginx`
