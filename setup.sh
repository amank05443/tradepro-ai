#!/bin/bash

echo "=========================================="
echo "Crypto Trading App - Quick Setup"
echo "=========================================="

# Setup Backend
echo ""
echo "Setting up Django backend..."
cd backend

# Activate virtual environment
source ../venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -q -r requirements.txt

# Run migrations
echo "Running database migrations..."
python manage.py migrate

# Create superuser
echo ""
echo "Create a superuser for admin access:"
python manage.py createsuperuser

# Create trading pairs
echo ""
echo "Creating initial trading pairs..."
python manage.py shell << EOF
from trading.models import TradingPair

pairs = [
    ('BTCUSDT', 'BTC', 'USDT'),
    ('ETHUSDT', 'ETH', 'USDT'),
    ('BNBUSDT', 'BNB', 'USDT'),
    ('SOLUSDT', 'SOL', 'USDT'),
    ('ADAUSDT', 'ADA', 'USDT'),
]

for symbol, base, quote in pairs:
    TradingPair.objects.get_or_create(
        symbol=symbol,
        defaults={'base_asset': base, 'quote_asset': quote}
    )
    print(f"Created {symbol}")

exit()
EOF

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "To run the application:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend"
echo "  source ../venv/bin/activate"
echo "  python manage.py runserver"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "Access the app at: http://localhost:3000"
echo "Admin panel at: http://localhost:8000/admin"
echo ""
echo "=========================================="
