#!/usr/bin/env python
"""
Script to add popular cryptocurrencies to the trading platform
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trading_backend.settings')
django.setup()

from trading.models import TradingPair

# Top cryptocurrencies by market cap (symbol, base_asset)
POPULAR_CRYPTOS = [
    # Top 10
    ('BTCUSDT', 'BTC'),
    ('ETHUSDT', 'ETH'),
    ('BNBUSDT', 'BNB'),
    ('SOLUSDT', 'SOL'),
    ('XRPUSDT', 'XRP'),
    ('ADAUSDT', 'ADA'),
    ('DOGEUSDT', 'DOGE'),
    ('DOTUSDT', 'DOT'),
    ('MATICUSDT', 'MATIC'),
    ('LINKUSDT', 'LINK'),

    # Top 11-25
    ('AVAXUSDT', 'AVAX'),
    ('SHIBUSDT', 'SHIB'),
    ('UNIUSDT', 'UNI'),
    ('LTCUSDT', 'LTC'),
    ('ATOMUSDT', 'ATOM'),
    ('ETCUSDT', 'ETC'),
    ('XLMUSDT', 'XLM'),
    ('NEARUSDT', 'NEAR'),
    ('ALGOUSDT', 'ALGO'),
    ('ICPUSDT', 'ICP'),

    # Additional popular coins
    ('ARBUSDT', 'ARB'),
    ('OPUSDT', 'OP'),
    ('APTUSDT', 'APT'),
    ('FILUSDT', 'FIL'),
    ('VETUSDT', 'VET'),
    ('HBARUSDT', 'HBAR'),
    ('INJUSDT', 'INJ'),
    ('SUIUSDT', 'SUI'),
    ('PEPEUSDT', 'PEPE'),
    ('RNDRUSDT', 'RNDR'),

    # DeFi coins
    ('AAVEUSDT', 'AAVE'),
    ('MKRUSDT', 'MKR'),
    ('CRVUSDT', 'CRV'),
    ('SUSHIUSDT', 'SUSHI'),
    ('COMPUSDT', 'COMP'),

    # Exchange tokens
    ('FTMUSDT', 'FTM'),
    ('SANDUSDT', 'SAND'),
    ('MANAUSDT', 'MANA'),
    ('AXSUSDT', 'AXS'),
    ('THETAUSDT', 'THETA'),

    # Layer 2 & Scaling
    ('LDOUSDT', 'LDO'),
    ('IMXUSDT', 'IMX'),
    ('STXUSDT', 'STX'),

    # Meme coins
    ('FLOKIUSDT', 'FLOKI'),
    ('BONKUSDT', 'BONK'),

    # Other popular
    ('GRTUSDT', 'GRT'),
    ('ENJUSDT', 'ENJ'),
    ('CHZUSDT', 'CHZ'),
    ('QNTUSDT', 'QNT'),
]

def add_trading_pairs():
    """Add all popular cryptocurrencies to the database"""
    print("=" * 60)
    print("Adding Popular Cryptocurrencies")
    print("=" * 60)

    added_count = 0
    skipped_count = 0

    for symbol, base_asset in POPULAR_CRYPTOS:
        quote_asset = 'USDT'

        # Check if pair already exists
        if TradingPair.objects.filter(symbol=symbol).exists():
            print(f"⏭️  Skipped: {symbol} (already exists)")
            skipped_count += 1
        else:
            # Create new trading pair
            TradingPair.objects.create(
                symbol=symbol,
                base_asset=base_asset,
                quote_asset=quote_asset,
                is_active=True
            )
            print(f"✅ Added: {symbol}")
            added_count += 1

    print("\n" + "=" * 60)
    print(f"Summary:")
    print(f"  ✅ Added: {added_count} new pairs")
    print(f"  ⏭️  Skipped: {skipped_count} existing pairs")
    print(f"  📊 Total pairs in database: {TradingPair.objects.count()}")
    print("=" * 60)

    # List all pairs
    print("\n📋 All Trading Pairs:")
    all_pairs = TradingPair.objects.all().order_by('symbol')
    for pair in all_pairs:
        status = "✓" if pair.is_active else "✗"
        print(f"  {status} {pair.symbol} ({pair.base_asset}/{pair.quote_asset})")

if __name__ == '__main__':
    add_trading_pairs()
