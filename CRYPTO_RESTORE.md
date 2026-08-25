# Crypto Payments Restoration Guide

## Status: DISABLED (August 2026)

Crypto payments via NOWPayments have been temporarily disabled. 

---

## To Restore Crypto Payments

**2 files to change:**

### 1. Backend (server/server.js)
Find line ~73:
```javascript
const CRYPTO_PAYMENTS_ENABLED = false;
```
Change to:
```javascript
const CRYPTO_PAYMENTS_ENABLED = true;
```

### 2. Frontend (src/pages/Subscription.jsx)
Find line ~253:
```jsx
{false && (
```
Change to:
```jsx
{true && (
```

Then:
```bash
npm run build
pm2 restart tfc-api
nginx -s reload
```

---

*Last updated: 2026-08-25*
