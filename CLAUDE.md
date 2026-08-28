# TFC Project Instructions

## Deployment
- VPS: `root@62.171.159.136`
- Path: `/var/www/tfc/dist`
- Domain: `tfc.events`

## Commands
```bash
npm run build
scp -r dist root@62.171.159.136:/var/www/tfc/
ssh root@62.171.159.136 "nginx -s reload"
```

## Rules
- ALWAYS commit before making changes
- NEVER modify without `git status` first
- Tag stable versions: `git tag -a v1.x-description -m "message"`

## Current stable tag
`v1.0-mobile-hamburger` - Hamburger menu left, white logo right, sponsor in BottomNav

## Restore command
```bash
git checkout v1.0-mobile-hamburger
```
