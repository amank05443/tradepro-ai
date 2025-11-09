import React, { useState, useEffect } from 'react';
import { getTradeHistory } from '../services/api';
import './TradeHistory.css';

const TradeHistory = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTradeHistory();
  }, []);

  const loadTradeHistory = async () => {
    try {
      const response = await getTradeHistory();
      setTrades(response.data);
    } catch (error) {
      console.error('Error loading trade history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trade-history">
      <h3>Trade History</h3>
      {loading ? (
        <p className="loading">Loading trade history...</p>
      ) : trades.length === 0 ? (
        <p className="no-trades">No trades yet</p>
      ) : (
        <div className="trades-table">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Pair</th>
                <th>Side</th>
                <th>Amount</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id}>
                  <td>{new Date(trade.executed_at).toLocaleString()}</td>
                  <td>{trade.trading_pair_symbol || 'N/A'}</td>
                  <td>
                    <span className={`trade-side ${trade.side}`}>
                      {trade.side.toUpperCase()}
                    </span>
                  </td>
                  <td>{parseFloat(trade.amount).toFixed(8)}</td>
                  <td>${parseFloat(trade.price).toFixed(2)}</td>
                  <td>${parseFloat(trade.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TradeHistory;
