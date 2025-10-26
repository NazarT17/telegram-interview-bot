# Telegram Interview Bot - Render.com Deployment

## Deploy to Render (Free Tier)

### Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Render**

   - Go to [https://render.com](https://render.com)
   - Sign up/Login with GitHub
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render will automatically detect `render.yaml`

3. **Set Environment Variable**
   - After creation, go to your service dashboard
   - Navigate to "Environment" tab
   - Set `TELEGRAM_BOT_TOKEN` with your bot token

### Option 2: Manual Setup

1. **Push code to GitHub** (same as above)

2. **Create Background Worker**

   - Go to [https://dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Background Worker"
   - Connect your repository
   - Configure:
     - **Name**: telegram-interview-bot
     - **Region**: Oregon (US West)
     - **Branch**: main
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: Free

3. **Add Environment Variables**

   - Click "Advanced" or go to "Environment" tab
   - Add variable:
     - Key: `TELEGRAM_BOT_TOKEN`
     - Value: Your Telegram bot token

4. **Deploy**
   - Click "Create Background Worker"
   - Wait for deployment to complete

## Important Notes

- ⚠️ **Free tier limitations**: May spin down after 15 minutes of inactivity
- 🔄 **Auto-deploy**: Render auto-deploys on git push to main branch
- 📊 **Logs**: View logs in Render dashboard under "Logs" tab
- 💰 **Cost**: Completely free (750 hours/month on free tier)

## Troubleshooting

- **Bot not responding**: Check logs in Render dashboard
- **Build fails**: Ensure all dependencies are in `package.json`
- **Environment variable issues**: Verify `TELEGRAM_BOT_TOKEN` is set correctly

## Local Development

```bash
npm install
npm run dev
```
