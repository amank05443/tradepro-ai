#!/usr/bin/env python
"""
Script to add commodities (Gold, Silver, Crude Oil) to the trading platform
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trading_backend.settings')
django.setup()

from trading.models import TradingPair

# Commodities to add
COMMODITIES = [
    # Symbol, Base Asset, Quote Asset
    ('XAUUSD', 'GOLD', 'USD'),    # Gold in USD
    ('XAGUSD', 'SILVER', 'USD'),  # Silver in USD
    ('XTIUSD', 'CRUDE', 'USD'),   # Crude Oil (WTI) in USD
]

def add_commodities():
    """Add commodities to the database"""
    print("=" * 60)
    print("Adding Commodities (Gold, Silver, Crude Oil)")
    print("=" * 60)

    added_count = 0
    skipped_count = 0

    for symbol, base_asset, quote_asset in COMMODITIES:
        # Check if commodity already exists
        if TradingPair.objects.filter(symbol=symbol).exists():
            print(f"⏭️  Skipped: {symbol} ({base_asset}) - already exists")
            skipped_count += 1
        else:
            # Create new trading pair
            TradingPair.objects.create(
                symbol=symbol,
                base_asset=base_asset,
                quote_asset=quote_asset,
                is_active=True
            )
            print(f"✅ Added: {symbol} ({base_asset}/{quote_asset})")
            added_count += 1

    print("\n" + "=" * 60)
    print(f"Summary:")
    print(f"  ✅ Added: {added_count} new commodities")
    print(f"  ⏭️  Skipped: {skipped_count} existing commodities")
    print(f"  📊 Total trading pairs: {TradingPair.objects.count()}")
    print("=" * 60)

    # List all commodities
    print("\n🪙 Commodities:")
    commodities = TradingPair.objects.filter(base_asset__in=['GOLD', 'SILVER', 'CRUDE']).order_by('symbol')
    for pair in commodities:
        status = "✓" if pair.is_active else "✗"
        print(f"  {status} {pair.symbol} ({pair.base_asset}/{pair.quote_asset})")

if __name__ == '__main__':
    add_commodities()
