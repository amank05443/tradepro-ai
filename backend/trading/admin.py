from django.contrib import admin
from .models import TradingPair, TradingStrategy, Order, TradeHistory, UserSettings, PriceAlert


@admin.register(TradingPair)
class TradingPairAdmin(admin.ModelAdmin):
    list_display = ('symbol', 'base_asset', 'quote_asset', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('symbol', 'base_asset', 'quote_asset')


@admin.register(TradingStrategy)
class TradingStrategyAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'trading_pair', 'strategy_type', 'is_active', 'created_at')
    list_filter = ('strategy_type', 'is_active')
    search_fields = ('name', 'user__username')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('user', 'trading_pair', 'order_side', 'order_type', 'amount', 'price', 'status', 'created_at')
    list_filter = ('order_side', 'order_type', 'status')
    search_fields = ('user__username', 'trading_pair__symbol')


@admin.register(TradeHistory)
class TradeHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'trading_pair', 'side', 'amount', 'price', 'total', 'executed_at')
    list_filter = ('side',)
    search_fields = ('user__username', 'trading_pair__symbol')


@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'auto_trading_enabled', 'use_testnet', 'created_at')
    list_filter = ('auto_trading_enabled', 'use_testnet')
    search_fields = ('user__username',)


@admin.register(PriceAlert)
class PriceAlertAdmin(admin.ModelAdmin):
    list_display = ('user', 'trading_pair', 'condition', 'target_price', 'is_active', 'triggered')
    list_filter = ('condition', 'is_active', 'triggered')
    search_fields = ('user__username', 'trading_pair__symbol')
