"""
Trading Automation Engine
Executes trading strategies automatically based on user instructions
"""

from decimal import Decimal
from django.utils import timezone
from .models import TradingStrategy, Order, TradeHistory, UserSettings
from .binance_service import BinanceService
import logging

logger = logging.getLogger(__name__)


class TradingEngine:
    """Main trading engine for executing automated strategies"""

    def __init__(self, user):
        self.user = user
        self.user_settings = UserSettings.objects.get_or_create(user=user)[0]
        self.binance = BinanceService(
            api_key=self.user_settings.binance_api_key,
            api_secret=self.user_settings.binance_api_secret,
            testnet=self.user_settings.use_testnet
        )

    def execute_strategy(self, strategy: TradingStrategy):
        """Execute a trading strategy"""
        if not strategy.is_active:
            logger.info(f"Strategy {strategy.name} is not active")
            return None

        if strategy.strategy_type == 'manual':
            return self._execute_manual_strategy(strategy)
        elif strategy.strategy_type == 'dca':
            return self._execute_dca_strategy(strategy)
        elif strategy.strategy_type == 'grid':
            return self._execute_grid_strategy(strategy)
        elif strategy.strategy_type == 'scalping':
            return self._execute_scalping_strategy(strategy)
        else:
            logger.warning(f"Unknown strategy type: {strategy.strategy_type}")
            return None

    def _execute_manual_strategy(self, strategy: TradingStrategy):
        """Execute manual trading strategy with predefined buy/sell prices"""
        current_price = self._get_current_price(strategy.trading_pair.symbol)

        if not current_price:
            logger.error(f"Could not get price for {strategy.trading_pair.symbol}")
            return None

        # Check if we should buy
        if strategy.buy_price and Decimal(current_price) <= strategy.buy_price:
            return self._place_buy_order(strategy, current_price)

        # Check if we should sell
        if strategy.sell_price and Decimal(current_price) >= strategy.sell_price:
            return self._place_sell_order(strategy, current_price)

        # Check stop loss
        if strategy.stop_loss and Decimal(current_price) <= strategy.stop_loss:
            return self._place_sell_order(strategy, current_price, order_type='stop_loss')

        # Check take profit
        if strategy.take_profit and Decimal(current_price) >= strategy.take_profit:
            return self._place_sell_order(strategy, current_price, order_type='take_profit')

        return None

    def _execute_dca_strategy(self, strategy: TradingStrategy):
        """Execute Dollar Cost Averaging strategy - buy fixed amount regularly"""
        current_price = self._get_current_price(strategy.trading_pair.symbol)

        if not current_price:
            return None

        # Place market buy order for the specified amount
        return self._place_buy_order(strategy, current_price, order_type='market')

    def _execute_grid_strategy(self, strategy: TradingStrategy):
        """Execute grid trading strategy"""
        # Simplified grid trading - places buy and sell orders at different price levels
        current_price = self._get_current_price(strategy.trading_pair.symbol)

        if not current_price:
            return None

        # This is a simplified version - in production, you'd want more sophisticated logic
        grid_size = Decimal('0.01')  # 1% grid
        buy_price = Decimal(current_price) * (Decimal('1') - grid_size)
        sell_price = Decimal(current_price) * (Decimal('1') + grid_size)

        # Place both buy and sell limit orders
        self._place_buy_order(strategy, str(buy_price), order_type='limit')
        self._place_sell_order(strategy, str(sell_price), order_type='limit')

        return True

    def _execute_scalping_strategy(self, strategy: TradingStrategy):
        """Execute scalping strategy - quick in and out trades"""
        current_price = self._get_current_price(strategy.trading_pair.symbol)

        if not current_price:
            return None

        # Scalping looks for small price movements
        # This is a simplified version
        spread = Decimal('0.002')  # 0.2% spread
        buy_price = Decimal(current_price) * (Decimal('1') - spread)
        sell_price = Decimal(current_price) * (Decimal('1') + spread)

        return self._place_buy_order(strategy, str(buy_price), order_type='limit')

    def _place_buy_order(self, strategy: TradingStrategy, price: str, order_type: str = 'market'):
        """Place a buy order"""
        order = Order.objects.create(
            user=self.user,
            strategy=strategy,
            trading_pair=strategy.trading_pair,
            order_type=order_type,
            order_side='buy',
            price=Decimal(price),
            amount=strategy.amount,
            status='pending'
        )

        # Execute on exchange if API keys are configured
        if self.user_settings.binance_api_key and self.user_settings.auto_trading_enabled:
            result = self._execute_on_exchange(order)
            if result:
                order.exchange_order_id = str(result.get('orderId'))
                order.status = 'filled' if result.get('status') == 'FILLED' else 'pending'
                order.save()

        logger.info(f"Buy order placed: {order}")
        return order

    def _place_sell_order(self, strategy: TradingStrategy, price: str, order_type: str = 'market'):
        """Place a sell order"""
        order = Order.objects.create(
            user=self.user,
            strategy=strategy,
            trading_pair=strategy.trading_pair,
            order_type=order_type,
            order_side='sell',
            price=Decimal(price),
            amount=strategy.amount,
            status='pending'
        )

        # Execute on exchange if API keys are configured
        if self.user_settings.binance_api_key and self.user_settings.auto_trading_enabled:
            result = self._execute_on_exchange(order)
            if result:
                order.exchange_order_id = str(result.get('orderId'))
                order.status = 'filled' if result.get('status') == 'FILLED' else 'pending'
                order.save()

        logger.info(f"Sell order placed: {order}")
        return order

    def _execute_on_exchange(self, order: Order):
        """Execute order on the exchange"""
        symbol = order.trading_pair.symbol.replace('/', '')

        try:
            if order.order_type == 'market':
                result = self.binance.create_market_order(
                    symbol=symbol,
                    side=order.order_side,
                    quantity=float(order.amount)
                )
            elif order.order_type == 'limit':
                result = self.binance.create_limit_order(
                    symbol=symbol,
                    side=order.order_side,
                    quantity=float(order.amount),
                    price=float(order.price)
                )
            else:
                logger.warning(f"Unsupported order type: {order.order_type}")
                return None

            if result:
                self._record_trade(order, result)

            return result
        except Exception as e:
            logger.error(f"Error executing order on exchange: {str(e)}")
            order.status = 'failed'
            order.save()
            return None

    def _record_trade(self, order: Order, exchange_result: dict):
        """Record completed trade in history"""
        if exchange_result.get('status') == 'FILLED':
            TradeHistory.objects.create(
                user=self.user,
                order=order,
                trading_pair=order.trading_pair,
                side=order.order_side,
                price=order.price,
                amount=Decimal(exchange_result.get('executedQty', order.amount)),
                total=order.price * Decimal(exchange_result.get('executedQty', order.amount)),
                fee=Decimal('0'),  # Calculate from exchange data
                executed_at=timezone.now()
            )

    def _get_current_price(self, symbol: str) -> str:
        """Get current price from exchange"""
        try:
            ticker = self.binance.get_ticker_price(symbol)
            if ticker:
                return ticker.get('price')
        except Exception as e:
            logger.error(f"Error getting price for {symbol}: {str(e)}")
        return None

    def get_portfolio_value(self):
        """Calculate total portfolio value"""
        balance = self.binance.get_account_balance()
        if not balance:
            return Decimal('0')

        total_value = Decimal('0')
        for asset in balance.get('balances', []):
            free = Decimal(asset.get('free', '0'))
            locked = Decimal(asset.get('locked', '0'))
            total_value += (free + locked)

        return total_value

    def cancel_order(self, order: Order):
        """Cancel an existing order"""
        if order.exchange_order_id:
            result = self.binance.cancel_order(
                symbol=order.trading_pair.symbol,
                order_id=int(order.exchange_order_id)
            )
            if result:
                order.status = 'cancelled'
                order.save()
                return True
        return False
