from django.db import models
from django.contrib.auth.models import User


class TradingPair(models.Model):
    """Cryptocurrency trading pair (e.g., BTC/USDT)"""
    symbol = models.CharField(max_length=20, unique=True)
    base_asset = models.CharField(max_length=10)
    quote_asset = models.CharField(max_length=10)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.symbol


class TradingStrategy(models.Model):
    """User-defined trading strategy"""
    STRATEGY_TYPES = [
        ('manual', 'Manual Trading'),
        ('dca', 'Dollar Cost Averaging'),
        ('grid', 'Grid Trading'),
        ('scalping', 'Scalping'),
        ('custom', 'Custom Strategy'),
    ]

    INTERVAL_CHOICES = [
        ('15min', '15 Minutes'),
        ('30min', '30 Minutes'),
        ('1h', '1 Hour'),
        ('4h', '4 Hours'),
        ('1d', '1 Day'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='strategies')
    name = models.CharField(max_length=100)
    strategy_type = models.CharField(max_length=20, choices=STRATEGY_TYPES, default='manual')
    trading_pair = models.ForeignKey(TradingPair, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=False)

    # Strategy Parameters
    buy_price = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    sell_price = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    stop_loss_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)  # 1% default
    take_profit_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=2.0)  # 2% default

    # Legacy fields (for backward compatibility)
    stop_loss = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    take_profit = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)

    # Automated execution
    execution_interval = models.CharField(max_length=10, choices=INTERVAL_CHOICES, default='1h')
    last_executed_at = models.DateTimeField(null=True, blank=True)
    next_execution_at = models.DateTimeField(null=True, blank=True)
    total_executions = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Trading strategies'

    def __str__(self):
        return f"{self.name} - {self.trading_pair.symbol}"


class Order(models.Model):
    """Trading order"""
    ORDER_TYPES = [
        ('market', 'Market Order'),
        ('limit', 'Limit Order'),
        ('stop_loss', 'Stop Loss'),
        ('take_profit', 'Take Profit'),
    ]

    ORDER_SIDES = [
        ('buy', 'Buy'),
        ('sell', 'Sell'),
    ]

    ORDER_STATUS = [
        ('pending', 'Pending'),
        ('filled', 'Filled'),
        ('partially_filled', 'Partially Filled'),
        ('cancelled', 'Cancelled'),
        ('failed', 'Failed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    strategy = models.ForeignKey(TradingStrategy, on_delete=models.SET_NULL, null=True, blank=True)
    trading_pair = models.ForeignKey(TradingPair, on_delete=models.CASCADE)

    order_type = models.CharField(max_length=20, choices=ORDER_TYPES)
    order_side = models.CharField(max_length=10, choices=ORDER_SIDES)
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='pending')

    price = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    filled_amount = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    filled_price = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)

    is_paper_trade = models.BooleanField(default=True)  # True for paper trading
    exchange_order_id = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    filled_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{'[PAPER] ' if self.is_paper_trade else ''}{self.order_side.upper()} {self.amount} {self.trading_pair.symbol} @ {self.price or 'MARKET'}"


class TradeHistory(models.Model):
    """Completed trades history"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trades')
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    trading_pair = models.ForeignKey(TradingPair, on_delete=models.CASCADE)

    side = models.CharField(max_length=10)
    price = models.DecimalField(max_digits=20, decimal_places=8)
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    total = models.DecimalField(max_digits=20, decimal_places=8)
    fee = models.DecimalField(max_digits=20, decimal_places=8, default=0)

    profit_loss = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)

    executed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Trade histories'

    def __str__(self):
        return f"{self.side.upper()} {self.amount} {self.trading_pair.symbol}"


class UserSettings(models.Model):
    """User trading settings and API keys"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='trading_settings')

    # Exchange API Credentials (encrypted in production)
    binance_api_key = models.CharField(max_length=200, blank=True)
    binance_api_secret = models.CharField(max_length=200, blank=True)
    use_testnet = models.BooleanField(default=True)

    # Paper Trading Virtual Balance
    paper_trading_mode = models.BooleanField(default=True)
    paper_balance_usdt = models.DecimalField(max_digits=20, decimal_places=8, default=10000)  # Start with $10,000

    # Trading Preferences
    auto_trading_enabled = models.BooleanField(default=False)
    default_trade_amount = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    risk_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)

    # Notifications
    email_notifications = models.BooleanField(default=True)
    trade_notifications = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'User settings'

    def __str__(self):
        return f"Settings for {self.user.username}"


class PriceAlert(models.Model):
    """Price alerts for cryptocurrencies"""
    ALERT_CONDITIONS = [
        ('above', 'Price Above'),
        ('below', 'Price Below'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='price_alerts')
    trading_pair = models.ForeignKey(TradingPair, on_delete=models.CASCADE)

    condition = models.CharField(max_length=10, choices=ALERT_CONDITIONS)
    target_price = models.DecimalField(max_digits=20, decimal_places=8)

    is_active = models.BooleanField(default=True)
    triggered = models.BooleanField(default=False)
    triggered_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.trading_pair.symbol} {self.condition} {self.target_price}"


class PaperTradingPosition(models.Model):
    """Virtual cryptocurrency holdings for paper trading"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='paper_positions')
    trading_pair = models.ForeignKey(TradingPair, on_delete=models.CASCADE)

    amount = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    average_buy_price = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    total_invested = models.DecimalField(max_digits=20, decimal_places=8, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'trading_pair']
        verbose_name_plural = 'Paper trading positions'

    def __str__(self):
        return f"{self.user.username} - {self.amount} {self.trading_pair.base_asset}"
