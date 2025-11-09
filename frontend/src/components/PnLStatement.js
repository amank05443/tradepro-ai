import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCurrency } from '../utils/currency';
import './PnLStatement.css';

const PnLStatement = ({ currency = 'USD' }) => {
  const [pnlData, setPnlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    loadPnLStatement();
  }, [filterType, fromDate, toDate]);

  const loadPnLStatement = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:8001/api/trading/orders/pnl_statement/';
      const params = new URLSearchParams();

      params.append('filter_type', filterType);

      if (filterType === 'custom' && fromDate && toDate) {
        params.append('from_date', fromDate);
        params.append('to_date', toDate);
      }

      const response = await axios.get(`${url}?${params.toString()}`);
      setPnlData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading P&L statement:', error);
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilterType) => {
    setFilterType(newFilterType);
    // Reset custom dates when switching away from custom
    if (newFilterType !== 'custom') {
      setFromDate('');
      setToDate('');
    }
  };

  const getFilterLabel = () => {
    switch(filterType) {
      case 'day': return 'Today';
      case 'week': return 'Last 7 Days';
      case 'month': return 'This Month';
      case 'custom': return fromDate && toDate ? `${fromDate} to ${toDate}` : 'Custom Range';
      default: return 'All Time';
    }
  };

  if (loading) {
    return (
      <div className="pnl-statement">
        <h3>Profit & Loss Statement</h3>
        <div className="loading">Loading P&L data...</div>
      </div>
    );
  }

  if (!pnlData) {
    return (
      <div className="pnl-statement">
        <h3>Profit & Loss Statement</h3>
        <div className="error">Failed to load P&L data</div>
      </div>
    );
  }

  if (pnlData.total_trades === 0) {
    return (
      <div className="pnl-statement">
        <div className="pnl-header">
          <h3>Profit & Loss Statement</h3>
          <button onClick={loadPnLStatement} className="refresh-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 8a6 6 0 11-12 0 6 6 0 0112 0z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 4v4l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Refresh
          </button>
        </div>
        <div className="no-data">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>No trading data yet</p>
          <span>Start trading to see your P&L statistics</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pnl-statement">
      <div className="pnl-header">
        <div className="pnl-title-section">
          <h3>Profit & Loss Statement</h3>
          <span className="pnl-period-badge">{getFilterLabel()}</span>
        </div>
        <button onClick={loadPnLStatement} className="refresh-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 8a6 6 0 11-12 0 6 6 0 0112 0z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 4v4l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Date Filter Section */}
      <div className="pnl-filters">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            All Time
          </button>
          <button
            className={`filter-btn ${filterType === 'day' ? 'active' : ''}`}
            onClick={() => handleFilterChange('day')}
          >
            Today
          </button>
          <button
            className={`filter-btn ${filterType === 'week' ? 'active' : ''}`}
            onClick={() => handleFilterChange('week')}
          >
            Last 7 Days
          </button>
          <button
            className={`filter-btn ${filterType === 'month' ? 'active' : ''}`}
            onClick={() => handleFilterChange('month')}
          >
            This Month
          </button>
          <button
            className={`filter-btn ${filterType === 'custom' ? 'active' : ''}`}
            onClick={() => handleFilterChange('custom')}
          >
            Custom Range
          </button>
        </div>

        {filterType === 'custom' && (
          <div className="custom-date-range">
            <div className="date-input-group">
              <label>From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate || new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="date-input-group">
              <label>To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="pnl-summary">
        <div className="summary-card main">
          <div className="card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="card-content">
            <div className="card-label">Total P&L</div>
            <div className={`card-value ${pnlData.total_pnl >= 0 ? 'positive' : 'negative'}`}>
              {pnlData.total_pnl >= 0 ? '+' : ''}{formatCurrency(Math.abs(pnlData.total_pnl), currency)}
            </div>
            <div className="card-sublabel">
              Realized: {formatCurrency(pnlData.realized_pnl, currency)} |
              Unrealized: {formatCurrency(pnlData.unrealized_pnl, currency)}
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="card-content">
            <div className="card-label">Win Rate</div>
            <div className={`card-value ${pnlData.win_rate >= 50 ? 'positive' : 'negative'}`}>
              {pnlData.win_rate.toFixed(1)}%
            </div>
            <div className="card-sublabel">
              {pnlData.winning_trades} wins / {pnlData.losing_trades} losses
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="card-content">
            <div className="card-label">Total Volume</div>
            <div className="card-value">{formatCurrency(pnlData.total_volume, currency)}</div>
            <div className="card-sublabel">
              {pnlData.total_trades} total trades
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="card-content">
            <div className="card-label">Portfolio Value</div>
            <div className="card-value">{formatCurrency(pnlData.current_portfolio_value, currency)}</div>
            <div className="card-sublabel">
              Cash: {formatCurrency(pnlData.current_balance, currency)}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="pnl-details">
        <div className="details-section">
          <h4>Trading Statistics</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Orders</span>
              <span className="stat-value">{pnlData.total_trades}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Completed Trades</span>
              <span className="stat-value">{pnlData.completed_trades}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Buy Orders</span>
              <span className="stat-value">{pnlData.buy_orders}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sell Orders</span>
              <span className="stat-value">{pnlData.sell_orders}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Bought</span>
              <span className="stat-value">{formatCurrency(pnlData.total_buy_value, currency)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Sold</span>
              <span className="stat-value">{formatCurrency(pnlData.total_sell_value, currency)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Fees</span>
              <span className="stat-value">{formatCurrency(pnlData.total_fees, currency)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Net P&L</span>
              <span className={`stat-value ${pnlData.total_pnl >= 0 ? 'positive' : 'negative'}`}>
                {pnlData.total_pnl >= 0 ? '+' : ''}{formatCurrency(Math.abs(pnlData.total_pnl - pnlData.total_fees), currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Best and Worst Trades */}
        {pnlData.best_trade && pnlData.worst_trade && (
          <div className="details-section">
            <h4>Performance Highlights</h4>
            <div className="highlights-grid">
              <div className="highlight-card best">
                <div className="highlight-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                  </svg>
                  <span>Best Trade</span>
                </div>
                <div className="highlight-content">
                  <div className="highlight-symbol">{pnlData.best_trade.symbol}</div>
                  <div className="highlight-pnl positive">
                    +{formatCurrency(pnlData.best_trade.profit_loss, currency)}
                    <span className="pnl-pct"> (+{pnlData.best_trade.profit_loss_pct.toFixed(2)}%)</span>
                  </div>
                  <div className="highlight-details">
                    Entry: {formatCurrency(pnlData.best_trade.entry_price, currency)} →
                    Exit: {formatCurrency(pnlData.best_trade.exit_price, currency)}
                  </div>
                </div>
              </div>

              <div className="highlight-card worst">
                <div className="highlight-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>Worst Trade</span>
                </div>
                <div className="highlight-content">
                  <div className="highlight-symbol">{pnlData.worst_trade.symbol}</div>
                  <div className="highlight-pnl negative">
                    {formatCurrency(pnlData.worst_trade.profit_loss, currency)}
                    <span className="pnl-pct"> ({pnlData.worst_trade.profit_loss_pct.toFixed(2)}%)</span>
                  </div>
                  <div className="highlight-details">
                    Entry: {formatCurrency(pnlData.worst_trade.entry_price, currency)} →
                    Exit: {formatCurrency(pnlData.worst_trade.exit_price, currency)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Completed Trades */}
        {pnlData.trades && pnlData.trades.length > 0 && (
          <div className="details-section">
            <h4>Recent Completed Trades</h4>
            <div className="trades-table">
              <table>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Entry Price</th>
                    <th>Exit Price</th>
                    <th>Amount</th>
                    <th>P&L</th>
                    <th>P&L %</th>
                    <th>Exit Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pnlData.trades.slice().reverse().map((trade, index) => (
                    <tr key={index} className={trade.type}>
                      <td className="symbol-cell">{trade.symbol}</td>
                      <td>{formatCurrency(trade.entry_price, currency)}</td>
                      <td>{formatCurrency(trade.exit_price, currency)}</td>
                      <td>{trade.amount.toFixed(8)}</td>
                      <td className={trade.profit_loss >= 0 ? 'positive' : 'negative'}>
                        {trade.profit_loss >= 0 ? '+' : ''}{formatCurrency(Math.abs(trade.profit_loss), currency)}
                      </td>
                      <td className={trade.profit_loss_pct >= 0 ? 'positive' : 'negative'}>
                        {trade.profit_loss_pct >= 0 ? '+' : ''}{trade.profit_loss_pct.toFixed(2)}%
                      </td>
                      <td>{new Date(trade.exit_date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PnLStatement;
