# TradePro AI - Deployment Guide

This guide will help you deploy **TradePro AI** to [Render.com](https://render.com) for FREE.

## Prerequisites

1. A GitHub account
2. A Render.com account (free tier available)
3. Git installed on your computer

## Step 1: Prepare Your Code

### 1.1 Initialize Git Repository

```bash
cd /Users/aman/Documents/Trading/crypto-trading-app
git init
git add .
git commit -m "Initial commit - TradePro AI"
```

### 1.2 Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository named `tradepro-ai`
3. **Don't** initialize with README, .gitignore, or license
4. Push your code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/tradepro-ai.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend to Render

### 2.1 Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"PostgreSQL"**
3. Settings:
   - **Name:** `tradepro-db`
   - **Database:** `tradepro_db`
   - **User:** `tradepro_user`
   - **Region:** Choose closest to you
   - **Plan:** Free
4. Click **"Create Database"**
5. **Copy the Internal Database URL** (you'll need this later)

### 2.2 Deploy Backend Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository `tradepro-ai`
3. Settings:
   - **Name:** `tradepro-backend`
   - **Region:** Same as database
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn trading_backend.wsgi:application`
   - **Plan:** Free

4. **Environment Variables** - Click "Advanced" and add:
   ```
   SECRET_KEY=generate-a-random-secret-key-here
   DEBUG=False
   ALLOWED_HOSTS=tradepro-backend.onrender.com
   DATABASE_URL=(paste the Internal Database URL from step 2.1)
   FRONTEND_URL=https://tradepro-frontend.onrender.com
   ```

5. Click **"Create Web Service"**

### 2.3 Deploy Background Worker

1. Click **"New +"** → **"Background Worker"**
2. Connect same repository
3. Settings:
   - **Name:** `tradepro-worker`
   - **Region:** Same as backend
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python manage.py run_strategies --interval 60`
   - **Plan:** Free

4. **Environment Variables** - Add same as backend:
   ```
   SECRET_KEY=(same as backend)
   DEBUG=False
   DATABASE_URL=(same as backend)
   ```

5. Click **"Create Background Worker"**

## Step 3: Deploy Frontend to Render

### 3.1 Update Frontend API URL

Before deploying, update the frontend to use your backend URL:

Edit `frontend/src/services/api.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';
```

Commit and push:
```bash
git add .
git commit -m "Update API URL for production"
git push
```

### 3.2 Deploy Frontend Static Site

1. Click **"New +"** → **"Static Site"**
2. Connect same repository
3. Settings:
   - **Name:** `tradepro-frontend`
   - **Region:** Same as backend
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`
   - **Plan:** Free

4. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://tradepro-backend.onrender.com
   ```

5. Click **"Create Static Site"**

## Step 4: Update CORS Settings

After deployment, update your backend environment variables:

1. Go to your `tradepro-backend` service
2. Update `FRONTEND_URL` to match your actual frontend URL:
   ```
   FRONTEND_URL=https://tradepro-frontend.onrender.com
   ```

## Step 5: Create Initial Data

### 5.1 Create Superuser

1. Go to `tradepro-backend` service
2. Click **"Shell"** tab
3. Run:
   ```bash
   python manage.py createsuperuser
   ```

### 5.2 Add Trading Pairs

1. Run this in the shell:
   ```bash
   python manage.py shell
   ```
   
2. Then execute:
   ```python
   from trading.models import TradingPair
   
   pairs = [
       {'symbol': 'BTCUSDT', 'base_asset': 'BTC', 'quote_asset': 'USDT'},
       {'symbol': 'ETHUSDT', 'base_asset': 'ETH', 'quote_asset': 'USDT'},
       {'symbol': 'SOLUSDT', 'base_asset': 'SOL', 'quote_asset': 'USDT'},
   ]
   
   for pair_data in pairs:
       TradingPair.objects.get_or_create(**pair_data)
   
   print("Trading pairs created!")
   exit()
   ```

## Step 6: Access Your App

Your app is now live!

- **Frontend:** `https://tradepro-frontend.onrender.com`
- **Backend API:** `https://tradepro-backend.onrender.com/api`
- **Admin Panel:** `https://tradepro-backend.onrender.com/admin`

## Important Notes

### Free Tier Limitations

- **Spin down after 15 min of inactivity** - First request will be slow
- **750 hours/month** - Enough for one service
- **Limited RAM** - Services may restart if memory exceeded

### Keeping Services Active

Free services spin down. To keep them active:
1. Use [UptimeRobot](https://uptimerobot.com/) to ping your backend every 14 minutes
2. Or upgrade to paid plan ($7/month per service)

### Database Backups

Free PostgreSQL database expires after 90 days. Options:
1. Upgrade to paid plan ($7/month)
2. Export data regularly
3. Use SQLite in production (not recommended)

## Troubleshooting

### Build Fails

Check build logs:
- Ensure `requirements.txt` has all dependencies
- Check Python version compatibility
- Verify `build.sh` is executable

### Database Connection Error

- Verify `DATABASE_URL` is correct
- Check database is in same region
- Ensure internal URL is used

### CORS Errors

- Update `FRONTEND_URL` in backend env vars
- Check `ALLOWED_HOSTS` includes backend domain
- Verify frontend is using correct API URL

### Strategy Executor Not Running

- Check worker service logs
- Verify environment variables are set
- Ensure DATABASE_URL is accessible

## Monitoring

1. **Logs:** Check service logs in Render dashboard
2. **Metrics:** View CPU/Memory usage
3. **Alerts:** Set up email notifications for service failures

## Cost Optimization

All services can run on free tier:
- Backend: Free web service
- Worker: Free background worker
- Frontend: Free static site
- Database: Free PostgreSQL (90 days)

**Total cost:** $0/month for first 90 days, then $7/month for database

## Alternative: Deploy to Railway.app

If Render doesn't work, try [Railway.app](https://railway.app):

1. Connect GitHub repo
2. Deploy from `backend` folder
3. Add PostgreSQL plugin
4. Set environment variables
5. Deploy frontend from `frontend` folder

Railway offers $5 free credit monthly.

## Support

For issues:
1. Check Render dashboard logs
2. Review Django logs
3. Test locally first
4. Check environment variables

---

**Congratulations!** 🎉 Your TradePro AI is now live and accessible to anyone with the URL!
