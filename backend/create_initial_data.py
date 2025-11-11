#!/usr/bin/env python
"""
Script to create initial superuser and trading pairs.
Run this once after deployment.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trading_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from trading.models import TradingPair

User = get_user_model()

# Create superuser if it doesn't exist
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@tradepro.com',
        password='admin123'  # Change this after first login!
    )
    print("✓ Superuser created: username='admin', password='admin123'")
else:
    print("✓ Superuser already exists")

# Create trading pairs
pairs = [
    {'symbol': 'BTCUSDT', 'base_asset': 'BTC', 'quote_asset': 'USDT'},
    {'symbol': 'ETHUSDT', 'base_asset': 'ETH', 'quote_asset': 'USDT'},
    {'symbol': 'SOLUSDT', 'base_asset': 'SOL', 'quote_asset': 'USDT'},
]

for pair_data in pairs:
    obj, created = TradingPair.objects.get_or_create(**pair_data)
    if created:
        print(f"✓ Created trading pair: {pair_data['symbol']}")
    else:
        print(f"✓ Trading pair already exists: {pair_data['symbol']}")

print("\n✓ All done! You can now login with:")
print("  Username: admin")
print("  Password: admin123")
print("  IMPORTANT: Change this password after first login!")
