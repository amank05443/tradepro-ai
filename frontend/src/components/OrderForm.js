import React, { useState, useEffect } from 'react';
import { createOrder, getTradingPairs } from '../services/api';
import { formatCurrency, convertPrice } from '../utils/currency';
import currencyUtils from '../utils/currency';
import axios from 'axios';
import './OrderForm.css';

const OrderForm = ({ symbol, currency = 'USD', onOrderPlaced }) => {
  const [orderSide, setOrderSide] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [amountType, setAmountType] = useState('crypto'); // 'crypto' or 'currency'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tradingPairs, setTradingPairs] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [portfolio, setPortfolio] = useState(null);
  const [availableBalance, setAvailableBalance] = useState(0);

  useEffect(() => {
    loadTradingPairs();
    fetchCurrentPrice();
    fetchPortfolio();
    // Refresh price and portfolio every 10 seconds
    const interval = setInterval(() => {
      fetchCurrentPrice();
      fetchPortfolio();
    }, 10000);
    return () => clearInterval(interval);
  }, [symbol]);

  const loadTradingPairs = async () => {
    try {
      const response = await getTradingPairs();
      setTradingPairs(response.data);
    } catch (error) {
      console.error('Error loading trading pairs:', error);
    }
  };

  const fetchCurrentPrice = async () => {
    try {
      const pair = tradingPairs.find(p => p.symbol === symbol);
      if (pair) {
        const response = await axios.get(`http://localhost:8001/api/trading/pairs/${pair.id}/price/`);
        setCurrentPrice(parseFloat(response.data.price));
      }
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8001/api/trading/orders/portfolio/', {
        headers: { Authorization: `Token ${token}` }
      });
      setPortfolio(response.data);
      setAvailableBalance(response.data.cash_balance || 0);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  const getMaxBuyAmount = () => {
    if (currentPrice === 0 || availableBalance === 0) return 0;

    if (amountType === 'crypto') {
      // Max crypto amount = available balance / current price
      return (availableBalance / currentPrice).toFixed(8);
    } else {
      // Max currency amount = available balance in USD, converted to selected currency
      if (currency === 'INR') {
        return (availableBalance * currencyUtils.USD_TO_INR).toFixed(2);
      }
      return availableBalance.toFixed(2);
    }
  };

  const handleMaxClick = () => {
    const maxAmount = getMaxBuyAmount();
    setAmount(maxAmount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Find trading pair ID by symbol
      const pair = tradingPairs.find(p => p.symbol === symbol);
      if (!pair) {
        setMessage('Error: Trading pair not found');
        setLoading(false);
        return;
      }

      // Calculate crypto amount based on amount type
      let cryptoAmount = parseFloat(amount);
      let usdAmountNeeded = 0;

      if (amountType === 'currency') {
        // Convert currency amount to USD for balance check
        let usdAmount = parseFloat(amount);
        if (currency === 'INR') {
          usdAmount = parseFloat(amount) / currencyUtils.USD_TO_INR; // Convert INR to USD
        }
        usdAmountNeeded = usdAmount;

        // For currency mode, we need price to convert to crypto amount
        // If price is available, calculate it. Otherwise, let backend handle it.
        if (currentPrice > 0) {
          cryptoAmount = usdAmount / currentPrice;
        } else {
          // Send USD amount to backend, let it calculate crypto amount
          // We'll estimate 1 crypto = 1 USD for validation purposes
          cryptoAmount = usdAmount;
        }
      } else {
        // Crypto amount mode - calculate USD needed for balance check
        if (currentPrice > 0) {
          usdAmountNeeded = cryptoAmount * currentPrice;
        } else {
          // Estimate: let backend handle the actual calculation
          usdAmountNeeded = cryptoAmount;
        }
      }

      // Check balance for buy orders
      if (orderSide === 'buy') {
        if (amountType === 'currency') {
          // Check if user has enough balance in USD
          let requiredBalance = parseFloat(amount);
          if (currency === 'INR') {
            requiredBalance = parseFloat(amount) / currencyUtils.USD_TO_INR;
          }

          if (requiredBalance > availableBalance) {
            setMessage(`Error: Insufficient balance. You need ${formatCurrency(requiredBalance, currency)} but only have ${formatCurrency(availableBalance, currency)}`);
            setLoading(false);
            return;
          }
        } else if (currentPrice > 0) {
          // Crypto amount mode - check if user has enough USD to buy this much crypto
          const costInUSD = cryptoAmount * currentPrice;
          if (costInUSD > availableBalance) {
            setMessage(`Error: Insufficient balance. This purchase costs ${formatCurrency(costInUSD, currency)} but you only have ${formatCurrency(availableBalance, currency)}`);
            setLoading(false);
            return;
          }
        }
      }

      const orderData = {
        trading_pair: pair.id,
        order_type: orderType,
        order_side: orderSide,
        amount: cryptoAmount,
      };

      await createOrder(orderData);
      setMessage(`${orderSide.toUpperCase()} order executed successfully!`);
      setPrice('');
      setAmount('');

      // Refresh current price and portfolio
      await fetchCurrentPrice();
      await fetchPortfolio();

      // Notify parent component to refresh holdings
      if (onOrderPlaced) {
        onOrderPlaced();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message;
      setMessage('Error: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-form">
      <div className="paper-trading-badge">
        <span className="badge-icon">📄</span>
        PAPER TRADING
      </div>

      {currentPrice > 0 && (
        <div className="current-price">
          <span className="price-label">Current Price:</span>
          <span className="price-value">{formatCurrency(currentPrice, currency)}</span>
        </div>
      )}

      <h3>Place Order</h3>

      <div className="order-type-selector">
        <button
          className={`order-side-btn ${orderSide === 'buy' ? 'buy-active' : ''}`}
          onClick={() => setOrderSide('buy')}
        >
          Buy
        </button>
        <button
          className={`order-side-btn ${orderSide === 'sell' ? 'sell-active' : ''}`}
          onClick={() => setOrderSide('sell')}
        >
          Sell
        </button>
      </div>

      <div className="order-type-tabs">
        <button
          className={orderType === 'market' ? 'active' : ''}
          onClick={() => setOrderType('market')}
        >
          Market
        </button>
        <button
          className={orderType === 'limit' ? 'active' : ''}
          onClick={() => setOrderType('limit')}
        >
          Limit
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {orderType === 'limit' && (
          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              step="0.00000001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        )}

        <div className="form-group">
          <label>Amount Type</label>
          <div className="amount-type-selector">
            <button
              type="button"
              className={`amount-type-btn ${amountType === 'crypto' ? 'active' : ''}`}
              onClick={() => {
                setAmountType('crypto');
                setAmount('');
              }}
            >
              Crypto Amount
            </button>
            <button
              type="button"
              className={`amount-type-btn ${amountType === 'currency' ? 'active' : ''}`}
              onClick={() => {
                setAmountType('currency');
                setAmount('');
              }}
            >
              {currency} Amount
            </button>
          </div>
        </div>

        <div className="form-group">
          <div className="amount-header">
            <label>
              {amountType === 'crypto'
                ? `Amount (${symbol.replace('USDT', '').replace('USD', '')})`
                : `Amount (${currency})`}
            </label>
            {orderSide === 'buy' && availableBalance > 0 && (
              <div className="balance-info-inline">
                <span className="balance-label">Available:</span>
                <span className="balance-value">{formatCurrency(availableBalance, currency)}</span>
              </div>
            )}
          </div>
          <div className="input-with-max">
            <input
              type="number"
              step={amountType === 'crypto' ? '0.00000001' : '0.01'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={amountType === 'crypto' ? '0.00000000' : '0.00'}
              required
            />
            {orderSide === 'buy' && currentPrice > 0 && availableBalance > 0 && (
              <button
                type="button"
                className="max-btn"
                onClick={handleMaxClick}
              >
                MAX
              </button>
            )}
          </div>
          {orderSide === 'buy' && currentPrice > 0 && availableBalance > 0 && (
            <div className="max-buy-hint">
              Max you can buy: {amountType === 'crypto'
                ? `${getMaxBuyAmount()} ${symbol.replace('USDT', '').replace('USD', '')}`
                : `${formatCurrency(parseFloat(getMaxBuyAmount()), currency)}`
              }
            </div>
          )}
          {amountType === 'currency' && currentPrice > 0 && amount > 0 && (
            <div className="conversion-hint">
              ≈ {((currency === 'INR' ? amount / currencyUtils.USD_TO_INR : amount) / currentPrice).toFixed(8)} {symbol.replace('USDT', '').replace('USD', '')}
            </div>
          )}
          {amountType === 'crypto' && currentPrice > 0 && amount > 0 && (
            <div className="conversion-hint">
              ≈ {formatCurrency(amount * currentPrice, currency)}
            </div>
          )}
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          className={`submit-btn ${orderSide}`}
          disabled={loading}
        >
          {loading ? 'Placing Order...' : `${orderSide.toUpperCase()} ${symbol}`}
        </button>
      </form>
    </div>
  );
};

export default OrderForm;
