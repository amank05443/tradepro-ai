from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from .models import TradingPair, TradingStrategy, Order, TradeHistory, UserSettings, PriceAlert
from .serializers import (
    TradingPairSerializer, TradingStrategySerializer, OrderSerializer,
    TradeHistorySerializer, UserSettingsSerializer, PriceAlertSerializer
)
from .paper_trading_service import PaperTradingService


class TradingPairViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for viewing trading pairs"""
    queryset = TradingPair.objects.filter(is_active=True)
    serializer_class = TradingPairSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=['get'])
    def price(self, request, pk=None):
        """Get current price for a trading pair"""
        trading_pair = self.get_object()
        paper_service = PaperTradingService()
        price = paper_service.get_current_price(trading_pair.symbol)
        from django.utils import timezone
        return Response({
            'symbol': trading_pair.symbol,
            'price': str(price),
            'timestamp': timezone.now()
        })


class TradingStrategyViewSet(viewsets.ModelViewSet):
    """API endpoint for managing trading strategies"""
    serializer_class = TradingStrategySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return TradingStrategy.objects.all()

    def perform_create(self, serializer):
        # For testing without authentication, use first user or create one
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.first()
        if not user:
            user = User.objects.create_user('testuser', 'test@test.com', 'testpass')
        serializer.save(user=user)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a trading strategy"""
        strategy = self.get_object()
        strategy.is_active = True
        strategy.save()
        return Response({'status': 'Strategy activated'})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a trading strategy"""
        strategy = self.get_object()
        strategy.is_active = False
        strategy.save()
        return Response({'status': 'Strategy deactivated'})


class OrderViewSet(viewsets.ModelViewSet):
    """API endpoint for managing orders"""
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Order.objects.all().order_by('-created_at')

    def create(self, request, *args, **kwargs):
        """Create and execute a paper trading order"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.first()
        if not user:
            user = User.objects.create_user('testuser', 'test@test.com', 'testpass')

        try:
            # Get order parameters
            trading_pair_id = request.data.get('trading_pair')
            order_side = request.data.get('order_side')
            amount = request.data.get('amount')

            # Validate inputs
            if not all([trading_pair_id, order_side, amount]):
                return Response(
                    {'error': 'trading_pair, order_side, and amount are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            trading_pair = get_object_or_404(TradingPair, id=trading_pair_id)
            paper_service = PaperTradingService()

            # Execute the trade
            if order_side == 'buy':
                order = paper_service.execute_market_buy(user, trading_pair, amount)
            elif order_side == 'sell':
                order = paper_service.execute_market_sell(user, trading_pair, amount)
            else:
                return Response(
                    {'error': 'order_side must be "buy" or "sell"'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = self.get_serializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Failed to execute order: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def portfolio(self, request):
        """Get user's portfolio (balance + positions)"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.first()
        if not user:
            return Response({'error': 'No user found'}, status=status.HTTP_404_NOT_FOUND)

        paper_service = PaperTradingService()
        portfolio = paper_service.get_portfolio_value(user)
        return Response(portfolio)

    @action(detail=False, methods=['get'])
    def pnl_statement(self, request):
        """Get comprehensive profit and loss statement"""
        from django.contrib.auth import get_user_model
        from django.db.models import Sum, Count, Q, Avg
        from decimal import Decimal
        from datetime import datetime, timedelta
        from django.utils import timezone

        User = get_user_model()
        user = User.objects.first()
        if not user:
            return Response({'error': 'No user found'}, status=status.HTTP_404_NOT_FOUND)

        # Get date filter parameters
        filter_type = request.query_params.get('filter_type', 'all')  # all, day, week, month, custom
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')

        # Get all completed orders
        all_orders = Order.objects.filter(user=user, status='filled')

        # Apply date filters
        if filter_type == 'day':
            # Today's trades
            today = timezone.now().date()
            all_orders = all_orders.filter(created_at__date=today)
        elif filter_type == 'week':
            # Last 7 days
            week_ago = timezone.now() - timedelta(days=7)
            all_orders = all_orders.filter(created_at__gte=week_ago)
        elif filter_type == 'month':
            # Current month
            month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            all_orders = all_orders.filter(created_at__gte=month_start)
        elif filter_type == 'custom' and from_date and to_date:
            # Custom date range
            try:
                from_dt = datetime.strptime(from_date, '%Y-%m-%d')
                to_dt = datetime.strptime(to_date, '%Y-%m-%d')
                # Add end of day to to_date
                to_dt = to_dt.replace(hour=23, minute=59, second=59)
                # Make timezone aware
                from_dt = timezone.make_aware(from_dt) if timezone.is_naive(from_dt) else from_dt
                to_dt = timezone.make_aware(to_dt) if timezone.is_naive(to_dt) else to_dt
                all_orders = all_orders.filter(created_at__gte=from_dt, created_at__lte=to_dt)
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

        all_orders = all_orders.order_by('created_at')

        if not all_orders.exists():
            return Response({
                'total_trades': 0,
                'total_profit_loss': 0,
                'total_fees': 0,
                'win_rate': 0,
                'trades': []
            })

        # Calculate overall statistics
        buy_orders = all_orders.filter(order_side='buy')
        sell_orders = all_orders.filter(order_side='sell')

        total_buy_value = sum(float(o.amount) * float(o.filled_price) for o in buy_orders)
        total_sell_value = sum(float(o.amount) * float(o.filled_price) for o in sell_orders)
        total_fees = 0  # Fee tracking not implemented yet

        # Get current portfolio value
        paper_service = PaperTradingService()
        portfolio = paper_service.get_portfolio_value(user)

        # Calculate realized P&L (from completed buy-sell pairs)
        realized_pnl = total_sell_value - sum(
            float(sell.amount) * float(buy_orders.filter(
                trading_pair=sell.trading_pair,
                created_at__lt=sell.created_at
            ).order_by('created_at').first().filled_price)
            for sell in sell_orders
            if buy_orders.filter(trading_pair=sell.trading_pair, created_at__lt=sell.created_at).exists()
        ) if sell_orders.exists() and buy_orders.exists() else 0

        # Calculate unrealized P&L (from current positions)
        unrealized_pnl = sum(pos['profit_loss'] for pos in portfolio['positions'])

        # Total P&L
        total_pnl = realized_pnl + unrealized_pnl

        # Calculate win rate
        winning_trades = 0
        losing_trades = 0

        # Track trades by pair
        trades_by_pair = {}
        for order in all_orders:
            symbol = order.trading_pair.symbol
            if symbol not in trades_by_pair:
                trades_by_pair[symbol] = []
            trades_by_pair[symbol].append({
                'side': order.order_side,
                'amount': float(order.amount),
                'price': float(order.filled_price),
                'value': float(order.amount) * float(order.filled_price),
                'timestamp': order.created_at,
                'id': order.id
            })

        # Calculate P&L for each completed trade
        completed_trades = []
        for symbol, trades in trades_by_pair.items():
            buys = [t for t in trades if t['side'] == 'buy']
            sells = [t for t in trades if t['side'] == 'sell']

            for sell in sells:
                # Find corresponding buy
                matching_buys = [b for b in buys if b['timestamp'] < sell['timestamp']]
                if matching_buys:
                    buy = matching_buys[-1]  # Use most recent buy
                    pnl = sell['value'] - (sell['amount'] * buy['price'])
                    pnl_pct = (pnl / (sell['amount'] * buy['price'])) * 100

                    if pnl > 0:
                        winning_trades += 1
                    else:
                        losing_trades += 1

                    completed_trades.append({
                        'symbol': symbol,
                        'entry_price': buy['price'],
                        'exit_price': sell['price'],
                        'amount': sell['amount'],
                        'profit_loss': round(pnl, 2),
                        'profit_loss_pct': round(pnl_pct, 2),
                        'entry_date': buy['timestamp'],
                        'exit_date': sell['timestamp'],
                        'type': 'win' if pnl > 0 else 'loss'
                    })

        total_completed = winning_trades + losing_trades
        win_rate = (winning_trades / total_completed * 100) if total_completed > 0 else 0

        # Best and worst trades
        best_trade = max(completed_trades, key=lambda x: x['profit_loss']) if completed_trades else None
        worst_trade = min(completed_trades, key=lambda x: x['profit_loss']) if completed_trades else None

        # Trading volume
        total_volume = total_buy_value + total_sell_value

        return Response({
            'total_trades': all_orders.count(),
            'completed_trades': total_completed,
            'buy_orders': buy_orders.count(),
            'sell_orders': sell_orders.count(),
            'total_volume': round(total_volume, 2),
            'total_buy_value': round(total_buy_value, 2),
            'total_sell_value': round(total_sell_value, 2),
            'realized_pnl': round(realized_pnl, 2),
            'unrealized_pnl': round(unrealized_pnl, 2),
            'total_pnl': round(total_pnl, 2),
            'total_fees': round(total_fees, 2),
            'win_rate': round(win_rate, 2),
            'winning_trades': winning_trades,
            'losing_trades': losing_trades,
            'best_trade': best_trade,
            'worst_trade': worst_trade,
            'current_balance': portfolio['cash_balance'],
            'current_portfolio_value': portfolio['total_value'],
            'trades': completed_trades[-20:]  # Last 20 trades
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an order"""
        order = self.get_object()
        if order.status in ['pending', 'partially_filled']:
            order.status = 'cancelled'
            order.save()
            return Response({'status': 'Order cancelled'})
        return Response(
            {'error': 'Cannot cancel order with status: ' + order.status},
            status=status.HTTP_400_BAD_REQUEST
        )


class TradeHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for viewing trade history"""
    serializer_class = TradeHistorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return TradeHistory.objects.all().order_by('-executed_at')


class UserSettingsViewSet(viewsets.ModelViewSet):
    """API endpoint for managing user settings"""
    serializer_class = UserSettingsSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return UserSettings.objects.all()

    def get_object(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.first()
        if not user:
            user = User.objects.create_user('testuser', 'test@test.com', 'testpass')
        obj, created = UserSettings.objects.get_or_create(user=user)
        return obj

    def perform_create(self, serializer):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.first()
        if not user:
            user = User.objects.create_user('testuser', 'test@test.com', 'testpass')
        serializer.save(user=user)


class PriceAlertViewSet(viewsets.ModelViewSet):
    """API endpoint for managing price alerts"""
    serializer_class = PriceAlertSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return PriceAlert.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.first()
        if not user:
            user = User.objects.create_user('testuser', 'test@test.com', 'testpass')
        serializer.save(user=user)
