#!/usr/bin/env python
"""
Script to keep only BTC, ETH, BNB trading pairs
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trading_backend.settings')
django.setup()

from trading.models import TradingPair

# Delete all pairs except BTC, ETH, BNB
print("Current trading pairs:")
all_pairs = TradingPair.objects.all()
for pair in all_pairs:
    print(f"  - {pair.symbol} (ID: {pair.id})")

print("\nDeleting all pairs except BTCUSDT, ETHUSDT, BNBUSDT...")

# Keep only these 3
keep_symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
deleted = TradingPair.objects.exclude(symbol__in=keep_symbols).delete()
print(f"Deleted: {deleted[0]} trading pairs")

print("\nRemaining trading pairs:")
remaining = TradingPair.objects.all()
for pair in remaining:
    print(f"  - {pair.symbol} (ID: {pair.id})")

print(f"\nTotal: {remaining.count()} trading pairs")
