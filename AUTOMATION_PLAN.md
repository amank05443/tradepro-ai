# Crypto Trading Automation - Complete Plan

## Overview
This document outlines the complete architecture for automated crypto trading based on user-defined strategies.

---

## 1. System Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  - Strategy Creation UI                                 │
│  - Real-time Chart Display                              │
│  - Order Management Dashboard                           │
│  - Trade History & Analytics                            │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
                    REST API (HTTP)
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│                 Backend (Django)                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Strategy Engine (Celery)               │  │
│  │  - Strategy Evaluation                           │  │
│  │  - Signal Generation                             │  │
│  │  - Risk Management                               │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Trading Execution Engine                 │  │
│  │  - Order Placement                               │  │
│  │  - Order Tracking                                │  │
│  │  - Portfolio Management                          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
                  Exchange API (Binance)
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│              External Services                           │
│  - Binance Exchange (Live Trading)                      │
│  - Binance Testnet (Paper Trading)                      │
│  - WebSocket for Real-time Data                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Strategy Types Implementation

### A. Manual Trading Strategy
**User Behavior**: User sets specific buy/sell prices
**Automation Logic**:
```python
def execute_manual_strategy(strategy):
    current_price = get_current_price(strategy.trading_pair)

    # Check BUY condition
    if strategy.buy_price and current_price <= strategy.buy_price:
        if check_balance_sufficient(strategy.amount):
            place_buy_order(strategy)

    # Check SELL condition
    if strategy.sell_price and current_price >= strategy.sell_price:
        if check_position_exists(strategy.trading_pair):
            place_sell_order(strategy)

    # Check STOP LOSS
    if strategy.stop_loss and current_price <= strategy.stop_loss:
        emergency_sell(strategy)

    # Check TAKE PROFIT
    if strategy.take_profit and current_price >= strategy.take_profit:
        place_sell_order(strategy)
```

### B. Dollar Cost Averaging (DCA)
**User Behavior**: User sets amount to invest periodically
**Automation Logic**:
```python
def execute_dca_strategy(strategy):
    # Buy fixed amount at regular intervals
    interval = strategy.interval  # e.g., daily, weekly

    if should_execute_now(interval):
        place_market_buy_order(
            pair=strategy.trading_pair,
            amount=strategy.amount
        )

        log_dca_purchase(strategy, current_price)
```

### C. Grid Trading
**User Behavior**: User sets price range and grid levels
**Automation Logic**:
```python
def execute_grid_strategy(strategy):
    price_range = strategy.price_range  # e.g., $40,000 - $50,000
    grid_levels = strategy.grid_levels  # e.g., 10 levels

    # Create buy/sell orders at each grid level
    for level in calculate_grid_levels(price_range, grid_levels):
        # Place buy order below current price
        if level.type == 'BUY':
            place_limit_buy(level.price, strategy.amount_per_grid)

        # Place sell order above current price
        if level.type == 'SELL':
            place_limit_sell(level.price, strategy.amount_per_grid)

    # Monitor and replace filled orders
    monitor_grid_orders(strategy)
```

### D. Scalping Strategy
**User Behavior**: User sets small profit targets for quick trades
**Automation Logic**:
```python
def execute_scalping_strategy(strategy):
    # Fast-paced trading with small profit margins
    profit_percentage = 0.5  # 0.5% profit target

    # Analyze recent price action
    price_movement = analyze_short_term_trend(strategy.trading_pair)

    if price_movement == 'BULLISH':
        place_buy_order(strategy)

        # Set take profit at 0.5% above
        take_profit_price = current_price * 1.005
        monitor_position(strategy, take_profit_price)

    # Exit quickly if price moves against
    if position_loss > 0.3%:
        emergency_exit(strategy)
```

---

## 3. Background Task System (Celery)

### Task: Strategy Monitor
```python
# backend/trading/tasks.py

from celery import shared_task
from .models import TradingStrategy
from .binance_service import BinanceService

@shared_task
def monitor_all_strategies():
    """
    Runs every 10 seconds to check all active strategies
    """
    active_strategies = TradingStrategy.objects.filter(is_active=True)

    for strategy in active_strategies:
        try:
            execute_strategy(strategy)
        except Exception as e:
            log_error(f"Strategy {strategy.id} failed: {e}")
            notify_user(strategy.user, error=str(e))

def execute_strategy(strategy):
    """
    Execute strategy based on its type
    """
    if strategy.strategy_type == 'manual':
        execute_manual_strategy(strategy)
    elif strategy.strategy_type == 'dca':
        execute_dca_strategy(strategy)
    elif strategy.strategy_type == 'grid':
        execute_grid_strategy(strategy)
    elif strategy.strategy_type == 'scalping':
        execute_scalping_strategy(strategy)
```

### Celery Configuration
```python
# backend/trading_backend/celery.py

from celery import Celery
from celery.schedules import crontab

app = Celery('trading_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')

app.conf.beat_schedule = {
    'monitor-strategies-every-10-seconds': {
        'task': 'trading.tasks.monitor_all_strategies',
        'schedule': 10.0,  # Every 10 seconds
    },
    'update-market-data-every-minute': {
        'task': 'trading.tasks.update_market_data',
        'schedule': 60.0,  # Every minute
    },
    'check-pending-orders-every-5-seconds': {
        'task': 'trading.tasks.check_pending_orders',
        'schedule': 5.0,  # Every 5 seconds
    },
}
```

---

## 4. Order Execution Engine

### File: `backend/trading/execution_engine.py`

```python
from .binance_service import BinanceService
from .models import Order, TradeHistory

class ExecutionEngine:
    def __init__(self):
        self.binance = BinanceService()

    def place_buy_order(self, strategy):
        """
        Place a buy order on Binance
        """
        try:
            # Create order in database
            order = Order.objects.create(
                user=strategy.user,
                trading_pair=strategy.trading_pair,
                order_type='buy',
                price=strategy.buy_price,
                amount=strategy.amount,
                status='pending'
            )

            # Place order on Binance
            binance_order = self.binance.place_order(
                symbol=strategy.trading_pair.symbol,
                side='BUY',
                order_type='LIMIT' if strategy.buy_price else 'MARKET',
                quantity=strategy.amount,
                price=strategy.buy_price
            )

            # Update order with Binance order ID
            order.exchange_order_id = binance_order['orderId']
            order.status = 'submitted'
            order.save()

            return order

        except Exception as e:
            order.status = 'failed'
            order.error_message = str(e)
            order.save()
            raise

    def place_sell_order(self, strategy):
        """
        Place a sell order on Binance
        """
        # Similar to place_buy_order but for selling
        pass

    def cancel_order(self, order):
        """
        Cancel an order on Binance
        """
        try:
            self.binance.cancel_order(
                symbol=order.trading_pair.symbol,
                order_id=order.exchange_order_id
            )

            order.status = 'cancelled'
            order.save()

        except Exception as e:
            raise

    def check_order_status(self, order):
        """
        Check if order was filled on Binance
        """
        try:
            status = self.binance.get_order_status(
                symbol=order.trading_pair.symbol,
                order_id=order.exchange_order_id
            )

            if status['status'] == 'FILLED':
                order.status = 'filled'
                order.filled_price = float(status['price'])
                order.filled_amount = float(status['executedQty'])
                order.save()

                # Create trade history record
                TradeHistory.objects.create(
                    user=order.user,
                    trading_pair=order.trading_pair,
                    order=order,
                    executed_price=order.filled_price,
                    amount=order.filled_amount,
                    side=order.order_type
                )

        except Exception as e:
            raise
```

---

## 5. Risk Management

### File: `backend/trading/risk_manager.py`

```python
class RiskManager:
    def __init__(self, user):
        self.user = user
        self.settings = user.settings

    def check_balance_sufficient(self, amount, trading_pair):
        """
        Check if user has enough balance
        """
        balance = self.get_balance(trading_pair.quote_asset)
        required = amount * self.get_current_price(trading_pair)

        return balance >= required

    def calculate_position_size(self, strategy):
        """
        Calculate safe position size based on risk settings
        """
        account_balance = self.get_total_balance()
        max_risk_per_trade = account_balance * 0.02  # 2% max risk

        stop_loss_distance = abs(
            strategy.buy_price - strategy.stop_loss
        )

        if stop_loss_distance == 0:
            return strategy.amount

        # Calculate position size based on risk
        position_size = max_risk_per_trade / stop_loss_distance

        return min(position_size, strategy.amount)

    def check_daily_loss_limit(self):
        """
        Stop trading if daily loss limit reached
        """
        daily_pnl = self.calculate_daily_pnl()
        max_daily_loss = self.settings.max_daily_loss

        if daily_pnl < -max_daily_loss:
            self.disable_all_strategies()
            self.notify_user("Daily loss limit reached!")
            return False

        return True
```

---

## 6. Real-time Data Stream

### WebSocket Connection to Binance

```python
# backend/trading/websocket_handler.py

import websocket
import json
from threading import Thread

class BinanceWebSocket:
    def __init__(self):
        self.ws = None
        self.price_cache = {}

    def start(self, symbols):
        """
        Start WebSocket connection for real-time prices
        """
        streams = '/'.join([f"{s.lower()}@ticker" for s in symbols])
        ws_url = f"wss://stream.binance.com:9443/stream?streams={streams}"

        self.ws = websocket.WebSocketApp(
            ws_url,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close
        )

        Thread(target=self.ws.run_forever).start()

    def on_message(self, ws, message):
        """
        Handle incoming price updates
        """
        data = json.loads(message)

        if 'data' in data:
            symbol = data['data']['s']
            price = float(data['data']['c'])

            # Update price cache
            self.price_cache[symbol] = price

            # Trigger strategy checks
            self.check_strategies_for_symbol(symbol, price)

    def get_price(self, symbol):
        """
        Get latest price from cache
        """
        return self.price_cache.get(symbol, 0)
```

---

## 7. Database Models Update

### Add fields for automation

```python
# backend/trading/models.py

class TradingStrategy(models.Model):
    # Existing fields...

    # New automation fields
    interval = models.CharField(max_length=20, blank=True)  # For DCA
    grid_levels = models.IntegerField(default=10)  # For Grid
    price_range_low = models.DecimalField(max_digits=20, decimal_places=8, null=True)
    price_range_high = models.DecimalField(max_digits=20, decimal_places=8, null=True)
    amount_per_grid = models.DecimalField(max_digits=20, decimal_places=8, null=True)
    last_executed = models.DateTimeField(null=True, blank=True)
    total_profit = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    total_trades = models.IntegerField(default=0)

class UserSettings(models.Model):
    # Existing fields...

    # Risk management
    max_daily_loss = models.DecimalField(max_digits=20, decimal_places=2, default=1000)
    max_position_size = models.DecimalField(max_digits=20, decimal_places=8, default=0.1)
    use_testnet = models.BooleanField(default=True)  # Paper trading vs live
    binance_api_key = models.CharField(max_length=200, blank=True)
    binance_api_secret = models.CharField(max_length=200, blank=True)
```

---

## 8. Implementation Steps

### Phase 1: Core Setup (Week 1)
1. ✅ Setup Celery and Redis
2. ✅ Create basic task scheduler
3. ✅ Implement Binance API integration
4. ✅ Add WebSocket for real-time data

### Phase 2: Strategy Engines (Week 2)
1. ✅ Implement Manual Trading strategy
2. ✅ Implement DCA strategy
3. ✅ Implement Grid Trading strategy
4. ✅ Implement Scalping strategy

### Phase 3: Order Execution (Week 3)
1. ✅ Build execution engine
2. ✅ Implement order tracking
3. ✅ Add order cancellation
4. ✅ Test with Binance Testnet

### Phase 4: Risk Management (Week 4)
1. ✅ Add position size calculator
2. ✅ Implement stop-loss automation
3. ✅ Add daily loss limits
4. ✅ Build emergency shutdown

### Phase 5: User Interface (Week 5)
1. ✅ Add strategy configuration UI
2. ✅ Show real-time order status
3. ✅ Display profit/loss analytics
4. ✅ Add notification system

---

## 9. Safety Features

### Paper Trading Mode
- Use Binance Testnet by default
- Switch to live trading only when user confirms
- Display clear indicator of trading mode

### Emergency Stop
- Big red "STOP ALL TRADING" button
- Cancels all orders
- Disables all strategies
- Notifies user

### Notifications
- Email alerts for filled orders
- SMS for large losses
- In-app notifications for strategy status

---

## 10. Next Steps for Implementation

### Immediate Actions:
1. Install Celery and Redis
2. Update models with automation fields
3. Create execution engine
4. Build first strategy (Manual Trading)
5. Test with small amounts on testnet

### Commands to Run:

```bash
# Install dependencies
pip install celery redis python-binance websocket-client

# Start Redis
redis-server

# Start Celery worker
celery -A trading_backend worker -l info

# Start Celery beat (scheduler)
celery -A trading_backend beat -l info

# Start Django
python manage.py runserver 8001
```

---

## Summary

This plan creates a complete automated trading system where:
1. Users create strategies through the UI
2. Background tasks monitor market conditions 24/7
3. Orders are automatically placed when conditions are met
4. Risk management protects user funds
5. Real-time updates keep users informed

The system is modular, scalable, and safe with paper trading mode by default.
