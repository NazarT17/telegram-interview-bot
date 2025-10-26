# Railway.app Deployment Guide

## 🚂 Deploy to Railway.app (Free Tier)

### Quick Setup:

1. **Go to Railway**

   - Visit: https://railway.app
   - Click "Login" → Sign in with GitHub

2. **Create New Project**

   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose: `NazarT17/telegram-interview-bot`

3. **Add Environment Variable**

   - After deployment starts, click on your service
   - Go to "Variables" tab
   - Click "New Variable"
   - Add:
     - **Variable:** `TELEGRAM_BOT_TOKEN`
     - **Value:** Your bot token from BotFather
   - Click "Add"

4. **Deploy!**
   - Railway will automatically detect Node.js
   - It will run `npm install && npm run build`
   - Then start with `npm start`
   - Bot will be live in ~2 minutes! 🎉

### Features:

- ✅ 500 hours/month free (always-on if you verify with credit card - no charges)
- ✅ Auto-deploys on git push
- ✅ Great logs and monitoring
- ✅ No sleeping/downtime

### Check Status:

- View logs in Railway dashboard
- Look for: `🤖 Bot is starting...`

### Troubleshooting:

- **Build fails**: Check logs in Railway dashboard
- **Bot doesn't respond**: Verify `TELEGRAM_BOT_TOKEN` is set
- **Need more hours**: Add credit card (no charge, just verification) for unlimited free hours

## That's it! Your bot will be running 24/7 on Railway! 🚀
