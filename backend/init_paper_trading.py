#!/usr/bin/env python
"""
Initialize paper trading for test user
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trading_backend.settings')
django.setup()

from django.contrib.auth.models import User
from trading.models import UserSettings
from decimal import Decimal

# Get or create test user
user, created = User.objects.get_or_create(
    username='testuser',
    defaults={
        'email': 'test@test.com',
        'first_name': 'Test',
        'last_name': 'User'
    }
)

if created:
    user.set_password('testpass')
    user.save()
    print(f"✅ Created user: {user.username}")
else:
    print(f"✅ User exists: {user.username}")

# Get or create user settings with paper trading balance
settings, created = UserSettings.objects.get_or_create(
    user=user,
    defaults={
        'paper_trading_mode': True,
        'paper_balance_usdt': Decimal('10000.00000000'),
        'use_testnet': True,
        'auto_trading_enabled': False
    }
)

if not created:
    # Update existing settings
    settings.paper_trading_mode = True
    if settings.paper_balance_usdt == 0:
        settings.paper_balance_usdt = Decimal('10000.00000000')
    settings.save()

print(f"\n{'='*60}")
print(f"Paper Trading Account Initialized")
print(f"{'='*60}")
print(f"Username: {user.username}")
print(f"Email: {user.email}")
print(f"Starting Balance: ${settings.paper_balance_usdt:,.2f} USDT")
print(f"Paper Trading Mode: {'ON' if settings.paper_trading_mode else 'OFF'}")
print(f"{'='*60}\n")

print("✅ Ready to trade! Visit http://localhost:3001")
