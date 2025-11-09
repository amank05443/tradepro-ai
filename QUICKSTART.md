# Quick Start Guide

## Getting Started in 5 Minutes

### Option 1: Automated Setup (Recommended)

Run the setup script:
```bash
./setup.sh
```

This will:
- Install all Python dependencies
- Run database migrations
- Create a superuser
- Set up initial trading pairs

### Option 2: Manual Setup

**Terminal 1 - Backend:**
```bash
cd crypto-trading-app/backend
source ../venv/bin/activate
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd crypto-trading-app/frontend
npm install
npm start
```

## First Steps

1. **Access the App**
   - Frontend: http://localhost:3000
   - Backend Admin: http://localhost:8000/admin

2. **Login to Admin Panel**
   - Go to http://localhost:8000/admin
   - Login with the superuser credentials you created
   - Navigate to "User settings" and add your user settings

3. **Add Trading Pairs** (if not done automatically)
   - In admin, go to "Trading pairs"
   - Add pairs like BTCUSDT, ETHUSDT, etc.

4. **Configure Binance API** (Optional - for live trading)
   - Get API keys from Binance
   - Add them in User Settings in admin panel
   - Keep "Use testnet" enabled for testing

5. **Start Trading**
   - Go to http://localhost:3000
   - View real-time charts
   - Create trading strategies
   - Place manual orders

## Testing Without Binance Account

The app works without Binance API keys:
- Charts will load from Binance public API
- Orders will be saved in database but not executed on exchange
- Good for testing the UI and functionality

## Common Issues

**Backend won't start:**
```bash
cd backend
source ../venv/bin/activate
python manage.py migrate
```

**Frontend won't start:**
```bash
cd frontend
rm -rf node_modules
npm install
npm start
```

**Database errors:**
```bash
cd backend
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

## Default Credentials

After running setup, you'll create a superuser with your chosen credentials.

## Next Steps

1. Read the full [README.md](README.md) for detailed documentation
2. Explore the Django admin panel
3. Create your first trading strategy
4. Test with small amounts on testnet
5. Monitor the charts and orders

## Safety First

- Always use testnet first
- Never share API keys
- Test strategies with small amounts
- Use stop losses
- Understand the risks

---

**You're all set! Happy trading!**
