"""
Binance Exchange Integration Service
Handles all interactions with Binance API for trading operations
"""

import hashlib
import hmac
import time
import requests
from decimal import Decimal
from typing import Dict, List, Optional
from django.conf import settings


class BinanceService:
    """Service for interacting with Binance exchange API"""

    def __init__(self, api_key: str = None, api_secret: str = None, testnet: bool = True):
        self.api_key = api_key or settings.BINANCE_API_KEY
        self.api_secret = api_secret or settings.BINANCE_API_SECRET
        self.testnet = testnet

        if testnet:
            self.base_url = "https://testnet.binance.vision/api"
        else:
            self.base_url = "https://api.binance.com/api"

    def _generate_signature(self, params: Dict) -> str:
        """Generate HMAC SHA256 signature for API requests"""
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature

    def _make_request(self, method: str, endpoint: str, params: Dict = None, signed: bool = False):
        """Make HTTP request to Binance API"""
        url = f"{self.base_url}{endpoint}"
        headers = {'X-MBX-APIKEY': self.api_key} if self.api_key else {}

        if params is None:
            params = {}

        if signed:
            params['timestamp'] = int(time.time() * 1000)
            params['signature'] = self._generate_signature(params)

        try:
            if method == 'GET':
                response = requests.get(url, params=params, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, params=params, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, params=params, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Binance API Error: {str(e)}")
            return None

    def get_ticker_price(self, symbol: str) -> Optional[Dict]:
        """Get current price for a trading pair"""
        endpoint = "/v3/ticker/price"
        params = {'symbol': symbol.replace('/', '')}
        return self._make_request('GET', endpoint, params)

    def get_24h_ticker(self, symbol: str) -> Optional[Dict]:
        """Get 24h ticker statistics"""
        endpoint = "/v3/ticker/24hr"
        params = {'symbol': symbol.replace('/', '')}
        return self._make_request('GET', endpoint, params)

    def get_klines(self, symbol: str, interval: str = '1h', limit: int = 100) -> Optional[List]:
        """
        Get candlestick data (klines/OHLCV)

        Intervals: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
        """
        endpoint = "/v3/klines"
        params = {
            'symbol': symbol.replace('/', ''),
            'interval': interval,
            'limit': limit
        }
        return self._make_request('GET', endpoint, params)

    def get_account_balance(self) -> Optional[Dict]:
        """Get account balance"""
        if not self.api_key or not self.api_secret:
            return None

        endpoint = "/v3/account"
        return self._make_request('GET', endpoint, signed=True)

    def create_market_order(self, symbol: str, side: str, quantity: float) -> Optional[Dict]:
        """
        Create a market order

        Args:
            symbol: Trading pair (e.g., 'BTCUSDT')
            side: 'BUY' or 'SELL'
            quantity: Amount to trade
        """
        if not self.api_key or not self.api_secret:
            return None

        endpoint = "/v3/order"
        params = {
            'symbol': symbol.replace('/', ''),
            'side': side.upper(),
            'type': 'MARKET',
            'quantity': quantity
        }
        return self._make_request('POST', endpoint, params, signed=True)

    def create_limit_order(self, symbol: str, side: str, quantity: float, price: float) -> Optional[Dict]:
        """
        Create a limit order

        Args:
            symbol: Trading pair (e.g., 'BTCUSDT')
            side: 'BUY' or 'SELL'
            quantity: Amount to trade
            price: Limit price
        """
        if not self.api_key or not self.api_secret:
            return None

        endpoint = "/v3/order"
        params = {
            'symbol': symbol.replace('/', ''),
            'side': side.upper(),
            'type': 'LIMIT',
            'timeInForce': 'GTC',
            'quantity': quantity,
            'price': price
        }
        return self._make_request('POST', endpoint, params, signed=True)

    def cancel_order(self, symbol: str, order_id: int) -> Optional[Dict]:
        """Cancel an open order"""
        if not self.api_key or not self.api_secret:
            return None

        endpoint = "/v3/order"
        params = {
            'symbol': symbol.replace('/', ''),
            'orderId': order_id
        }
        return self._make_request('DELETE', endpoint, params, signed=True)

    def get_order_status(self, symbol: str, order_id: int) -> Optional[Dict]:
        """Get order status"""
        if not self.api_key or not self.api_secret:
            return None

        endpoint = "/v3/order"
        params = {
            'symbol': symbol.replace('/', ''),
            'orderId': order_id
        }
        return self._make_request('GET', endpoint, params, signed=True)

    def get_open_orders(self, symbol: str = None) -> Optional[List]:
        """Get all open orders"""
        if not self.api_key or not self.api_secret:
            return None

        endpoint = "/v3/openOrders"
        params = {}
        if symbol:
            params['symbol'] = symbol.replace('/', '')
        return self._make_request('GET', endpoint, params, signed=True)

    def get_exchange_info(self) -> Optional[Dict]:
        """Get exchange trading rules and symbol information"""
        endpoint = "/v3/exchangeInfo"
        return self._make_request('GET', endpoint)


# Singleton instance
binance_service = BinanceService()
