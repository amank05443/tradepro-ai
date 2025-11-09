"""
Strategy Executor Service
Handles automated execution of trading strategies
"""
from decimal import Decimal
from django.utils import timezone
from django.db import models
from datetime import timedelta
from .models import TradingStrategy, Order, PaperTradingPosition
from .paper_trading_service import PaperTradingService
import logging

logger = logging.getLogger(__name__)


class StrategyExecutor:
    """Executes trading strategies automatically"""

    def __init__(self):
        self.paper_trading = PaperTradingService()

    def get_interval_timedelta(self, interval_str):
        """Convert interval string to timedelta"""
        interval_map = {
            '15min': timedelta(minutes=15),
            '30min': timedelta(minutes=30),
            '1h': timedelta(hours=1),
            '4h': timedelta(hours=4),
            '1d': timedelta(days=1),
        }
        return interval_map.get(interval_str, timedelta(hours=1))

    def execute_pending_strategies(self):
        """Execute all strategies that are due"""
        now = timezone.now()

        # Get all active strategies that need execution
        strategies = TradingStrategy.objects.filter(
            is_active=True
        ).filter(
            models.Q(next_execution_at__lte=now) | models.Q(next_execution_at__isnull=True)
        )

        executed_count = 0
        for strategy in strategies:
            try:
                self.execute_strategy(strategy)
                executed_count += 1
            except Exception as e:
                logger.error(f"Error executing strategy {strategy.id}: {e}")

        logger.info(f"Executed {executed_count} strategies")
        return executed_count

    def execute_strategy(self, strategy):
        """Execute a single strategy"""
        logger.info(f"Executing strategy: {strategy.name} ({strategy.strategy_type})")

        if strategy.strategy_type == 'dca':
            self.execute_dca_strategy(strategy)
        else:
            logger.warning(f"Strategy type {strategy.strategy_type} not implemented yet")

        # Update execution timestamp
        now = timezone.now()
        interval = self.get_interval_timedelta(strategy.execution_interval)

        strategy.last_executed_at = now
        strategy.next_execution_at = now + interval
        strategy.total_executions += 1
        strategy.save()

    def execute_dca_strategy(self, strategy):
        """
        Execute Dollar Cost Averaging strategy
        - Buy fixed amount at regular intervals
        - Set stop loss and take profit on positions
        """
        try:
            # Execute buy order
            order = self.paper_trading.execute_market_buy(
                user=strategy.user,
                trading_pair=strategy.trading_pair,
                amount=strategy.amount
            )

            logger.info(f"DCA Buy executed: {strategy.amount} {strategy.trading_pair.base_asset} @ {order.filled_price}")

            # Check and execute stop loss / take profit on existing positions
            self.check_stop_loss_take_profit(strategy)

        except Exception as e:
            logger.error(f"Error in DCA strategy execution: {e}")
            raise

    def check_stop_loss_take_profit(self, strategy):
        """
        Check all positions for this strategy and execute stop loss or take profit
        """
        # Get user's position for this trading pair
        position = self.paper_trading.get_user_position(
            strategy.user,
            strategy.trading_pair
        )

        if position.amount == 0:
            return

        # Get current price
        current_price = self.paper_trading.get_current_price(strategy.trading_pair.symbol)
        if current_price == 0:
            logger.warning(f"Could not fetch price for {strategy.trading_pair.symbol}")
            return

        # Calculate stop loss and take profit prices
        buy_price = position.average_buy_price

        # Stop loss: 1% below buy price
        stop_loss_price = buy_price * (1 - strategy.stop_loss_percentage / 100)

        # Take profit: 2% above buy price
        take_profit_price = buy_price * (1 + strategy.take_profit_percentage / 100)

        logger.info(
            f"Position check - Current: {current_price}, "
            f"Buy: {buy_price}, "
            f"Stop Loss: {stop_loss_price}, "
            f"Take Profit: {take_profit_price}"
        )

        # Check if stop loss triggered
        if current_price <= stop_loss_price:
            logger.warning(f"STOP LOSS TRIGGERED for {strategy.trading_pair.symbol}")
            self.execute_stop_loss(strategy, position, current_price)

        # Check if take profit triggered
        elif current_price >= take_profit_price:
            logger.info(f"TAKE PROFIT TRIGGERED for {strategy.trading_pair.symbol}")
            self.execute_take_profit(strategy, position, current_price)

    def execute_stop_loss(self, strategy, position, current_price):
        """Execute stop loss - sell entire position"""
        try:
            order = self.paper_trading.execute_market_sell(
                user=strategy.user,
                trading_pair=strategy.trading_pair,
                amount=position.amount
            )

            logger.info(
                f"Stop Loss executed: Sold {position.amount} {strategy.trading_pair.base_asset} "
                f"@ {current_price} (bought @ {position.average_buy_price})"
            )

            # Optionally pause the strategy after stop loss
            # strategy.is_active = False
            # strategy.save()

        except Exception as e:
            logger.error(f"Error executing stop loss: {e}")

    def execute_take_profit(self, strategy, position, current_price):
        """Execute take profit - sell entire position"""
        try:
            order = self.paper_trading.execute_market_sell(
                user=strategy.user,
                trading_pair=strategy.trading_pair,
                amount=position.amount
            )

            logger.info(
                f"Take Profit executed: Sold {position.amount} {strategy.trading_pair.base_asset} "
                f"@ {current_price} (bought @ {position.average_buy_price})"
            )

            # Optionally pause the strategy after take profit
            # strategy.is_active = False
            # strategy.save()

        except Exception as e:
            logger.error(f"Error executing take profit: {e}")


# Singleton instance
strategy_executor = StrategyExecutor()
