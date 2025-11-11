"""
Paper Trading Service
Simulates cryptocurrency trading without using real money
"""
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from .models import Order, TradeHistory, UserSettings, PaperTradingPosition
import requests


class PaperTradingService:
    """Handles all paper trading operations"""

    def get_current_price(self, symbol):
        """
        Fetch real-time price from appropriate API
        Args:
            symbol: Trading pair symbol (e.g., 'BTCUSDT', 'XAUUSD')
        Returns:
            Decimal: Current price
        """
        try:
            # For commodities (Gold, Silver, Crude Oil)
            if symbol in ['XAUUSD', 'XAGUSD', 'XTIUSD']:
                return self._get_commodity_price(symbol)

            # For cryptocurrencies - use Binance
            url = f'https://api.binance.com/api/v3/ticker/price?symbol={symbol}'
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            return Decimal(str(data['price']))
        except Exception as e:
            print(f"Error fetching price for {symbol}: {e}")
            # Return simulated price if API fails (for paper trading demo)
            return self._get_simulated_crypto_price(symbol)

    def _get_simulated_crypto_price(self, symbol):
        """
        Return simulated crypto prices for demo/paper trading when API fails
        """
        import random

        # Base prices (approximate market prices)
        base_prices = {
            'BTCUSDT': Decimal('89000.00'),
            'ETHUSDT': Decimal('3200.00'),
            'SOLUSDT': Decimal('210.00'),
            'BNBUSDT': Decimal('620.00'),
            'ADAUSDT': Decimal('0.95'),
        }

        base_price = base_prices.get(symbol, Decimal('100.00'))
        # Add small random variation (±1%)
        variation = float(base_price) * random.uniform(-0.01, 0.01)
        simulated_price = base_price + Decimal(str(variation))

        print(f"Using simulated price for {symbol}: {simulated_price}")
        return simulated_price

    def _get_commodity_price(self, symbol):
        """
        Get commodity prices (Gold, Silver, Crude Oil)
        Using approximate current market prices for simulation
        """
        # Approximate current prices (you can integrate real API later)
        commodity_prices = {
            'XAUUSD': Decimal('2650.00'),    # Gold ~$2,650/oz
            'XAGUSD': Decimal('31.50'),      # Silver ~$31.50/oz
            'XTIUSD': Decimal('72.50'),      # WTI Crude ~$72.50/barrel
        }

        # Add small random variation for simulation (±0.5%)
        import random
        base_price = commodity_prices.get(symbol, Decimal('0'))
        if base_price > 0:
            variation = float(base_price) * random.uniform(-0.005, 0.005)
            return base_price + Decimal(str(variation))

        return Decimal('0')

    def get_user_balance(self, user):
        """Get user's paper trading balance"""
        settings, created = UserSettings.objects.get_or_create(
            user=user,
            defaults={'paper_balance_usdt': Decimal('10000.00000000')}
        )
        return settings.paper_balance_usdt

    def get_user_position(self, user, trading_pair):
        """Get user's position for a trading pair"""
        position, created = PaperTradingPosition.objects.get_or_create(
            user=user,
            trading_pair=trading_pair,
            defaults={
                'amount': Decimal('0'),
                'average_buy_price': Decimal('0'),
                'total_invested': Decimal('0')
            }
        )
        return position

    @transaction.atomic
    def execute_market_buy(self, user, trading_pair, amount):
        """
        Execute a market buy order (paper trading)
        Args:
            user: User object
            trading_pair: TradingPair object
            amount: Amount to buy (in base currency, e.g., BTC)
        Returns:
            Order object
        """
        # Get current market price
        current_price = self.get_current_price(trading_pair.symbol)
        if current_price == 0:
            raise ValueError(f"Could not fetch price for {trading_pair.symbol}")

        # Calculate total cost
        total_cost = Decimal(str(amount)) * current_price

        # Check if user has enough balance
        settings = UserSettings.objects.select_for_update().get(user=user)
        if settings.paper_balance_usdt < total_cost:
            raise ValueError(
                f"Insufficient balance. Required: {total_cost:.2f} USDT, "
                f"Available: {settings.paper_balance_usdt:.2f} USDT"
            )

        # Create order
        order = Order.objects.create(
            user=user,
            trading_pair=trading_pair,
            order_type='market',
            order_side='buy',
            amount=Decimal(str(amount)),
            price=None,  # Market order
            filled_price=current_price,
            filled_amount=Decimal(str(amount)),
            status='filled',
            is_paper_trade=True,
            filled_at=timezone.now()
        )

        # Deduct from balance
        settings.paper_balance_usdt -= total_cost
        settings.save()

        # Update or create position
        position = self.get_user_position(user, trading_pair)
        old_total = position.amount * position.average_buy_price
        new_total = old_total + total_cost
        position.amount += Decimal(str(amount))
        position.average_buy_price = new_total / position.amount if position.amount > 0 else current_price
        position.total_invested += total_cost
        position.save()

        # Create trade history
        TradeHistory.objects.create(
            user=user,
            order=order,
            trading_pair=trading_pair,
            side='buy',
            price=current_price,
            amount=Decimal(str(amount)),
            total=total_cost,
            fee=Decimal('0')  # No fees for paper trading
        )

        return order

    @transaction.atomic
    def execute_market_sell(self, user, trading_pair, amount):
        """
        Execute a market sell order (paper trading)
        Args:
            user: User object
            trading_pair: TradingPair object
            amount: Amount to sell (in base currency, e.g., BTC)
        Returns:
            Order object
        """
        # Get current market price
        current_price = self.get_current_price(trading_pair.symbol)
        if current_price == 0:
            raise ValueError(f"Could not fetch price for {trading_pair.symbol}")

        # Check if user has enough position
        position = self.get_user_position(user, trading_pair)
        if position.amount < Decimal(str(amount)):
            raise ValueError(
                f"Insufficient position. Trying to sell: {amount} {trading_pair.base_asset}, "
                f"Available: {position.amount} {trading_pair.base_asset}"
            )

        # Calculate total proceeds
        total_proceeds = Decimal(str(amount)) * current_price

        # Create order
        order = Order.objects.create(
            user=user,
            trading_pair=trading_pair,
            order_type='market',
            order_side='sell',
            amount=Decimal(str(amount)),
            price=None,  # Market order
            filled_price=current_price,
            filled_amount=Decimal(str(amount)),
            status='filled',
            is_paper_trade=True,
            filled_at=timezone.now()
        )

        # Add to balance
        settings = UserSettings.objects.select_for_update().get(user=user)
        settings.paper_balance_usdt += total_proceeds
        settings.save()

        # Update position
        position.amount -= Decimal(str(amount))
        if position.amount == 0:
            position.average_buy_price = Decimal('0')
            position.total_invested = Decimal('0')
        position.save()

        # Calculate profit/loss
        cost_basis = position.average_buy_price * Decimal(str(amount))
        profit_loss = total_proceeds - cost_basis

        # Create trade history
        TradeHistory.objects.create(
            user=user,
            order=order,
            trading_pair=trading_pair,
            side='sell',
            price=current_price,
            amount=Decimal(str(amount)),
            total=total_proceeds,
            fee=Decimal('0'),
            profit_loss=profit_loss
        )

        return order

    def get_portfolio_value(self, user):
        """
        Calculate total portfolio value (cash + holdings)
        Returns:
            dict with balance, positions value, and total
        """
        settings = self.get_user_balance(user)
        balance = settings

        positions = PaperTradingPosition.objects.filter(user=user, amount__gt=0)
        positions_value = Decimal('0')
        positions_list = []

        for position in positions:
            current_price = self.get_current_price(position.trading_pair.symbol)
            position_value = position.amount * current_price
            profit_loss = position_value - position.total_invested
            profit_loss_pct = (profit_loss / position.total_invested * 100) if position.total_invested > 0 else 0

            positions_value += position_value
            positions_list.append({
                'symbol': position.trading_pair.symbol,
                'base_asset': position.trading_pair.base_asset,
                'amount': float(position.amount),
                'average_buy_price': float(position.average_buy_price),
                'current_price': float(current_price),
                'value': float(position_value),
                'profit_loss': float(profit_loss),
                'profit_loss_pct': float(profit_loss_pct)
            })

        total_value = balance + positions_value

        return {
            'cash_balance': float(balance),
            'positions_value': float(positions_value),
            'total_value': float(total_value),
            'positions': positions_list
        }
