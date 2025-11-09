# 🚀 TradePro AI - Automated Crypto Trading Platform

![TradePro AI](https://img.shields.io/badge/TradePro-AI-blueviolet?style=for-the-badge)
![Django](https://img.shields.io/badge/Django-4.2.7-green?style=for-the-badge&logo=django)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![Python](https://img.shields.io/badge/Python-3.9+-yellow?style=for-the-badge&logo=python)

A professional automated cryptocurrency trading platform with DCA strategies, real-time analytics, and intelligent trading automation.

## ✨ Features

- 📊 **Real-Time Trading Dashboard** - Live market data and portfolio tracking
- 🤖 **Automated DCA Strategies** - Dollar Cost Averaging with customizable intervals
- 📈 **P&L Statement** - Comprehensive profit/loss tracking with date filters
- 🎯 **Smart Order Management** - Market and limit orders with exit strategies
- 💼 **Portfolio Management** - Real-time position tracking and performance metrics
- 📰 **Market News Integration** - Live crypto news and market updates
- 🔒 **Paper Trading** - Practice trading with virtual money
- ⚡ **Background Strategy Executor** - Automated trade execution with stop-loss/take-profit

## 🛠️ Tech Stack

### Backend
- **Django 4.2.7** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Production database
- **SQLite** - Development database
- **Celery** - Background task processing
- **Binance API** - Market data

### Frontend
- **React 18** - UI framework
- **Axios** - HTTP client
- **TradingView Charts** - Advanced charting
- **CSS3** - Modern styling with gradients

## 📦 Installation

### Prerequisites

- Python 3.9+
- Node.js 16+
- pip
- npm

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8001
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Start Background Worker

```bash
cd backend
python manage.py run_strategies --interval 60
```

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions to:
- ✅ **Render.com** (Recommended - Free tier available)
- ✅ **Railway.app** (Alternative - $5 free credit)
- ✅ **Heroku** (Paid only)

**Quick Deploy to Render:**

1. Push code to GitHub
2. Create PostgreSQL database on Render
3. Deploy backend as Web Service
4. Deploy worker as Background Worker
5. Deploy frontend as Static Site

Total cost: **FREE** for 90 days, then $7/month for database

## 📱 Usage

### Create Trading Strategy

1. Go to **Strategies** tab
2. Click **"+ New Strategy"**
3. Configure:
   - **Name**: e.g., "BTC Hourly DCA"
   - **Type**: Dollar Cost Averaging
   - **Trading Pair**: BTC/USDT
   - **Amount**: 0.01 BTC
   - **Interval**: Every 1 hour
   - **Stop Loss**: 1%
   - **Take Profit**: 2%
4. Click **"Create Strategy"**
5. Strategy auto-executes every hour!

### Manual Trading

1. Go to **Trade** tab
2. Select trading pair
3. Choose Buy/Sell
4. Enter amount
5. Choose Market or Limit order
6. Execute trade

### View Performance

1. Go to **P&L Statement** tab
2. Filter by:
   - Today
   - Last 7 Days
   - This Month
   - Custom Date Range
3. View metrics:
   - Total P&L
   - Win Rate
   - Best/Worst Trades
   - Volume Statistics

## 🔧 Configuration

### Environment Variables

Create `backend/.env`:

```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgresql://user:pass@localhost/db
FRONTEND_URL=http://localhost:3000
BINANCE_API_KEY=optional
BINANCE_API_SECRET=optional
```

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:8001/api
```

## 📊 Project Structure

```
crypto-trading-app/
├── backend/
│   ├── trading/              # Main trading app
│   ├── authentication/       # User authentication
│   ├── trading_backend/      # Django settings
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API services
│   │   └── utils/           # Utilities
│   ├── public/
│   └── package.json
├── DEPLOYMENT.md            # Deployment guide
└── README.md               # This file
```

## 🎯 Key Components

### Backend

- **Models**: TradingPair, TradingStrategy, Order, PaperTradingPosition
- **Services**: PaperTradingService, StrategyExecutor
- **Management Commands**: run_strategies
- **APIs**: REST endpoints for trading, strategies, P&L

### Frontend

- **TradingDashboard** - Main container
- **OrderForm** - Place trades
- **Holdings** - Portfolio view
- **StrategyManager** - Strategy CRUD
- **PnLStatement** - Performance analytics
- **MarketNews** - News feed

## 🔐 Security Features

- CORS protection
- CSRF tokens
- Secure cookies
- SQL injection prevention
- XSS protection
- SSL/TLS in production

## 📈 Performance

- Real-time updates every 5-10 seconds
- Efficient database queries
- Optimized React rendering
- Background worker for strategy execution
- Caching for static files

## 🐛 Troubleshooting

### Backend won't start
- Check Python version: `python --version`
- Verify dependencies: `pip install -r requirements.txt`
- Check database connection

### Frontend errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Check API URL in `.env`
- Verify backend is running

### Strategy not executing
- Check worker is running
- Verify strategy is active
- Check logs: `tail -f /tmp/strategy_executor.log`

## 📝 API Documentation

API Base URL: `http://localhost:8001/api`

### Endpoints

```
GET  /trading/pairs/                     - List trading pairs
GET  /trading/strategies/                - List strategies
POST /trading/strategies/                - Create strategy
GET  /trading/orders/                    - List orders
POST /trading/orders/                    - Create order
GET  /trading/orders/portfolio/          - Get portfolio
GET  /trading/orders/pnl_statement/      - Get P&L statement
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 🙏 Acknowledgments

- Binance API for market data
- TradingView for charts
- React community
- Django community

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check existing issues
- Review documentation

---

**Made with ❤️ by TradePro AI Team**

⭐ Star this repo if you find it useful!
