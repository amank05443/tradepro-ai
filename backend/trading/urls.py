from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TradingPairViewSet, TradingStrategyViewSet, OrderViewSet,
    TradeHistoryViewSet, UserSettingsViewSet, PriceAlertViewSet
)

router = DefaultRouter()
router.register(r'pairs', TradingPairViewSet, basename='trading-pair')
router.register(r'strategies', TradingStrategyViewSet, basename='strategy')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'history', TradeHistoryViewSet, basename='trade-history')
router.register(r'settings', UserSettingsViewSet, basename='user-settings')
router.register(r'alerts', PriceAlertViewSet, basename='price-alert')

urlpatterns = [
    path('', include(router.urls)),
]
