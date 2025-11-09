from rest_framework import serializers
from django.contrib.auth.models import User
from .models import TradingPair, TradingStrategy, Order, TradeHistory, UserSettings, PriceAlert


class TradingPairSerializer(serializers.ModelSerializer):
    class Meta:
        model = TradingPair
        fields = '__all__'


class TradingStrategySerializer(serializers.ModelSerializer):
    trading_pair_symbol = serializers.CharField(source='trading_pair.symbol', read_only=True)

    class Meta:
        model = TradingStrategy
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class OrderSerializer(serializers.ModelSerializer):
    trading_pair_symbol = serializers.CharField(source='trading_pair.symbol', read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at', 'filled_at', 'exchange_order_id')


class TradeHistorySerializer(serializers.ModelSerializer):
    trading_pair_symbol = serializers.CharField(source='trading_pair.symbol', read_only=True)

    class Meta:
        model = TradeHistory
        fields = '__all__'
        read_only_fields = ('user', 'executed_at')


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')
        extra_kwargs = {
            'binance_api_secret': {'write_only': True}
        }


class PriceAlertSerializer(serializers.ModelSerializer):
    trading_pair_symbol = serializers.CharField(source='trading_pair.symbol', read_only=True)

    class Meta:
        model = PriceAlert
        fields = '__all__'
        read_only_fields = ('user', 'triggered', 'triggered_at', 'created_at')


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id',)
