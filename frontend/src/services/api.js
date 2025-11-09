import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Trading Pairs
export const getTradingPairs = () => api.get('/trading/pairs/');
export const getTradingPairPrice = (pairId) => api.get(`/trading/pairs/${pairId}/price/`);

// Trading Strategies
export const getStrategies = () => api.get('/trading/strategies/');
export const createStrategy = (data) => api.post('/trading/strategies/', data);
export const updateStrategy = (id, data) => api.put(`/trading/strategies/${id}/`, data);
export const deleteStrategy = (id) => api.delete(`/trading/strategies/${id}/`);
export const activateStrategy = (id) => api.post(`/trading/strategies/${id}/activate/`);
export const deactivateStrategy = (id) => api.post(`/trading/strategies/${id}/deactivate/`);

// Orders
export const getOrders = () => api.get('/trading/orders/');
export const createOrder = (data) => api.post('/trading/orders/', data);
export const cancelOrder = (id) => api.post(`/trading/orders/${id}/cancel/`);

// Trade History
export const getTradeHistory = () => api.get('/trading/history/');

// User Settings
export const getUserSettings = () => api.get('/trading/settings/');
export const updateUserSettings = (data) => api.put('/trading/settings/1/', data);

// Price Alerts
export const getPriceAlerts = () => api.get('/trading/alerts/');
export const createPriceAlert = (data) => api.post('/trading/alerts/', data);
export const deletePriceAlert = (id) => api.delete(`/trading/alerts/${id}/`);

// Market Data (this would typically come from a real-time data source)
export const getMarketData = async (symbol, interval = '1h', limit = 100) => {
  // In production, this should connect to Binance or another exchange API
  // For now, we'll simulate it
  try {
    const response = await axios.get(
      `https://api.binance.com/api/v3/klines?symbol=${symbol.replace('/', '')}&interval=${interval}&limit=${limit}`
    );
    return response.data.map(candle => ({
      time: candle[0] / 1000,
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
    }));
  } catch (error) {
    console.error('Error fetching market data:', error);
    return [];
  }
};

export default api;
