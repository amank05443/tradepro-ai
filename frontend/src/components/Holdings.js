import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCurrency } from '../utils/currency';
import { createOrder, getTradingPairs } from '../services/api';
import './Holdings.css';

const Holdings = ({ refreshTrigger, currency = 'USD' }) => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exitingPosition, setExitingPosition] = useState(null);
  const [message, setMessage] = useState('');
  const [tradingPairs, setTradingPairs] = useState([]);
  const [showExitModal, setShowExitModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [exitOrderType, setExitOrderType] = useState('market');
  const [exitLimitPrice, setExitLimitPrice] = useState('');
  const [expandedPositions, setExpandedPositions] = useState(new Set());

  useEffect(() => {
    loadPortfolio();
    loadTradingPairs();
    // Refresh every 5 seconds
    const interval = setInterval(loadPortfolio, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const loadPortfolio = async () => {
    try {
      const response = await axios.get('http://localhost:8001/api/trading/orders/portfolio/');
      setPortfolio(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading portfolio:', error);
      setLoading(false);
    }
  };

  const loadTradingPairs = async () => {
    try {
      const response = await getTradingPairs();
      setTradingPairs(response.data);
    } catch (error) {
      console.error('Error loading trading pairs:', error);
    }
  };

  const togglePosition = (symbol) => {
    const newExpanded = new Set(expandedPositions);
    if (newExpanded.has(symbol)) {
      newExpanded.delete(symbol);
    } else {
      newExpanded.add(symbol);
    }
    setExpandedPositions(newExpanded);
  };

  const openExitModal = (position) => {
    setSelectedPosition(position);
    setExitOrderType('market');
    setExitLimitPrice(position.current_price.toFixed(8));
    setShowExitModal(true);
  };

  const closeExitModal = () => {
    setShowExitModal(false);
    setSelectedPosition(null);
    setExitOrderType('market');
    setExitLimitPrice('');
  };

  const executeExitPosition = async () => {
    if (!selectedPosition) return;

    setExitingPosition(selectedPosition.symbol);
    setMessage('');

    try {
      // Find trading pair ID by symbol
      const pair = tradingPairs.find(p => p.symbol === selectedPosition.symbol);
      if (!pair) {
        setMessage(`Error: Trading pair ${selectedPosition.symbol} not found`);
        setExitingPosition(null);
        return;
      }

      // Create a SELL order for the entire position amount
      const orderData = {
        trading_pair: pair.id,
        order_type: exitOrderType,
        order_side: 'sell',
        amount: selectedPosition.amount,
      };

      // Add price for limit orders
      if (exitOrderType === 'limit') {
        orderData.price = parseFloat(exitLimitPrice);
      }

      await createOrder(orderData);

      const orderTypeText = exitOrderType === 'market' ? 'at market price' : `at ${formatCurrency(parseFloat(exitLimitPrice), currency)}`;
      setMessage(`Successfully ${exitOrderType === 'market' ? 'sold' : 'placed sell order for'} ${selectedPosition.amount} ${selectedPosition.base_asset} ${orderTypeText}`);
      setTimeout(() => setMessage(''), 5000);

      // Close modal and refresh portfolio
      closeExitModal();
      await loadPortfolio();

    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message;
      setMessage('Error exiting position: ' + errorMsg);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setExitingPosition(null);
    }
  };

  if (loading) {
    return (
      <div className="holdings">
        <h3>Holdings</h3>
        <div className="loading">Loading portfolio...</div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="holdings">
        <h3>Holdings</h3>
        <div className="error">Failed to load portfolio</div>
      </div>
    );
  }

  const totalProfitLoss = portfolio.positions.reduce((sum, pos) => sum + pos.profit_loss, 0);
  const totalProfitLossPct = portfolio.positions.length > 0
    ? (totalProfitLoss / (portfolio.total_value - totalProfitLoss)) * 100
    : 0;

  return (
    <div className="holdings">
      <div className="holdings-header">
        <h3>Holdings</h3>
        <button onClick={loadPortfolio} className="refresh-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 8a6 6 0 11-12 0 6 6 0 0112 0z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 4v4l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Refresh
        </button>
      </div>

      {message && (
        <div className={`holdings-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="portfolio-overview">
        <div className="overview-card">
          <div className="card-label">Total Value</div>
          <div className="card-value main">{formatCurrency(portfolio.total_value, currency)}</div>
        </div>

        <div className="overview-card">
          <div className="card-label">Cash Balance</div>
          <div className="card-value">{formatCurrency(portfolio.cash_balance, currency)}</div>
        </div>

        <div className="overview-card">
          <div className="card-label">Positions Value</div>
          <div className="card-value">{formatCurrency(portfolio.positions_value, currency)}</div>
        </div>

        {portfolio.positions.length > 0 && (
          <div className="overview-card">
            <div className="card-label">Total P&L</div>
            <div className={`card-value pnl ${totalProfitLoss >= 0 ? 'positive' : 'negative'}`}>
              {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalProfitLoss), currency)}
              <span className="pnl-pct">
                ({totalProfitLossPct >= 0 ? '+' : ''}{totalProfitLossPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="positions-section">
        <h4>Your Positions</h4>
        {portfolio.positions.length === 0 ? (
          <div className="no-positions">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>No positions yet</p>
            <span>Start trading to see your holdings here</span>
          </div>
        ) : (
          <div className="positions-list">
            {portfolio.positions.map((position, index) => {
              const isExpanded = expandedPositions.has(position.symbol);
              return (
                <div key={index} className={`position-card ${isExpanded ? 'expanded' : 'compact'}`}>
                  {/* Compact View - Single Line */}
                  <div className="position-compact" onClick={() => togglePosition(position.symbol)}>
                    <div className="compact-left">
                      <span className="crypto-icon-small">{position.base_asset.substring(0, 3)}</span>
                      <div className="compact-info">
                        <span className="compact-symbol">{position.symbol}</span>
                        <span className="compact-amount">{position.amount.toFixed(4)} {position.base_asset}</span>
                      </div>
                    </div>
                    <div className="compact-middle">
                      <span className="compact-value">{formatCurrency(position.value, currency)}</span>
                    </div>
                    <div className="compact-right">
                      <div className={`compact-pnl ${position.profit_loss >= 0 ? 'positive' : 'negative'}`}>
                        {position.profit_loss >= 0 ? '+' : ''}{formatCurrency(Math.abs(position.profit_loss), currency)}
                        <span className="compact-pct">({position.profit_loss_pct >= 0 ? '+' : ''}{position.profit_loss_pct.toFixed(2)}%)</span>
                      </div>
                      <svg className={`expand-arrow ${isExpanded ? 'rotated' : ''}`} width="16" height="16" viewBox="0 0 16 16">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                    </div>
                  </div>

                  {/* Expanded View - Full Details */}
                  {isExpanded && (
                    <div className="position-expanded">
                      <div className="position-details">
                        <div className="detail-row">
                          <span className="detail-label">Current Price:</span>
                          <span className="detail-value">{formatCurrency(position.current_price, currency)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Avg Buy Price:</span>
                          <span className="detail-value">{formatCurrency(position.average_buy_price, currency)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Total Value:</span>
                          <span className="detail-value highlight">{formatCurrency(position.value, currency)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Profit/Loss:</span>
                          <span className={`detail-value ${position.profit_loss >= 0 ? 'positive' : 'negative'}`}>
                            {position.profit_loss >= 0 ? '+' : ''}{formatCurrency(Math.abs(position.profit_loss), currency)} ({position.profit_loss_pct >= 0 ? '+' : ''}{position.profit_loss_pct.toFixed(2)}%)
                          </span>
                        </div>
                      </div>

                      {/* Visual P&L Bar */}
                      <div className="pnl-bar-container">
                        <div
                          className={`pnl-bar ${position.profit_loss >= 0 ? 'positive' : 'negative'}`}
                          style={{
                            width: `${Math.min(Math.abs(position.profit_loss_pct) * 10, 100)}%`
                          }}
                        />
                      </div>

                      {/* Exit Position Button */}
                      <button
                        className="exit-position-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openExitModal(position);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                          <path d="M12 4L4 12M4 4l8 8" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Exit Position
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Exit Position Modal */}
      {showExitModal && selectedPosition && (
        <div className="modal-overlay" onClick={closeExitModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Exit Position</h3>
              <button className="modal-close" onClick={closeExitModal}>
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                  <path d="M12 4L4 12M4 4l8 8" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="exit-summary">
                <div className="summary-row">
                  <span className="summary-label">Asset:</span>
                  <span className="summary-value">{selectedPosition.symbol}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Amount:</span>
                  <span className="summary-value">{selectedPosition.amount.toFixed(8)} {selectedPosition.base_asset}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Current Price:</span>
                  <span className="summary-value">{formatCurrency(selectedPosition.current_price, currency)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Current P&L:</span>
                  <span className={`summary-value ${selectedPosition.profit_loss >= 0 ? 'positive' : 'negative'}`}>
                    {selectedPosition.profit_loss >= 0 ? '+' : ''}{formatCurrency(Math.abs(selectedPosition.profit_loss), currency)} ({selectedPosition.profit_loss_pct >= 0 ? '+' : ''}{selectedPosition.profit_loss_pct.toFixed(2)}%)
                  </span>
                </div>
              </div>

              <div className="exit-order-type">
                <label>Order Type:</label>
                <div className="order-type-buttons">
                  <button
                    className={`order-type-btn ${exitOrderType === 'market' ? 'active' : ''}`}
                    onClick={() => setExitOrderType('market')}
                  >
                    Market
                  </button>
                  <button
                    className={`order-type-btn ${exitOrderType === 'limit' ? 'active' : ''}`}
                    onClick={() => setExitOrderType('limit')}
                  >
                    Limit
                  </button>
                </div>
              </div>

              {exitOrderType === 'limit' && (
                <div className="exit-limit-price">
                  <label>Limit Price ({currency}):</label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={exitLimitPrice}
                    onChange={(e) => setExitLimitPrice(e.target.value)}
                    placeholder="Enter limit price"
                  />
                  <small>Order will execute when price reaches this level</small>
                </div>
              )}

              {exitOrderType === 'market' && (
                <div className="market-note">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0a8 8 0 110 16A8 8 0 018 0zM7 4v1h2V4H7zm0 2v6h2V6H7z"/>
                  </svg>
                  <span>Market order will execute immediately at best available price</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={closeExitModal}>
                Cancel
              </button>
              <button
                className="modal-btn confirm"
                onClick={executeExitPosition}
                disabled={exitingPosition === selectedPosition.symbol || (exitOrderType === 'limit' && !exitLimitPrice)}
              >
                {exitingPosition === selectedPosition.symbol ? (
                  <>
                    <div className="spinner-small"></div>
                    Exiting...
                  </>
                ) : (
                  <>Confirm Exit</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Holdings;
