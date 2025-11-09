import React, { useState, useEffect } from 'react';
import { getStrategies, createStrategy, activateStrategy, deactivateStrategy, deleteStrategy, getTradingPairs } from '../services/api';
import './StrategyManager.css';

const StrategyManager = ({ symbol }) => {
  const [strategies, setStrategies] = useState([]);
  const [tradingPairs, setTradingPairs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    strategy_type: 'dca',
    trading_pair: '',
    amount: '',
    buy_price: '',
    sell_price: '',
    stop_loss_percentage: 1.0,
    take_profit_percentage: 2.0,
    execution_interval: '1h',
  });

  useEffect(() => {
    loadStrategies();
    loadTradingPairs();
  }, []);

  const loadTradingPairs = async () => {
    try {
      setLoading(true);
      const response = await getTradingPairs();
      console.log('Trading pairs loaded:', response.data);
      setTradingPairs(response.data);
      if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, trading_pair: response.data[0].id }));
      }
    } catch (error) {
      console.error('Error loading trading pairs:', error);
      setMessage('Error loading trading pairs. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadStrategies = async () => {
    try {
      const response = await getStrategies();
      setStrategies(response.data);
    } catch (error) {
      console.error('Error loading strategies:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await createStrategy(formData);
      setMessage('Strategy created successfully!');
      setShowForm(false);
      setFormData({
        name: '',
        strategy_type: 'manual',
        trading_pair: tradingPairs[0]?.id || '',
        amount: '',
        buy_price: '',
        sell_price: '',
        stop_loss: '',
        take_profit: '',
      });
      loadStrategies();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error creating strategy:', error);
      setMessage('Error creating strategy: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleToggleStrategy = async (strategy) => {
    try {
      if (strategy.is_active) {
        await deactivateStrategy(strategy.id);
      } else {
        await activateStrategy(strategy.id);
      }
      loadStrategies();
    } catch (error) {
      console.error('Error toggling strategy:', error);
    }
  };

  const handleDeleteStrategy = async (strategyId) => {
    if (window.confirm('Are you sure you want to delete this strategy?')) {
      try {
        await deleteStrategy(strategyId);
        loadStrategies();
      } catch (error) {
        console.error('Error deleting strategy:', error);
      }
    }
  };

  return (
    <div className="strategy-manager">
      <div className="strategy-header">
        <h3>Trading Strategies</h3>
        <button onClick={() => setShowForm(!showForm)} className="add-strategy-btn">
          {showForm ? 'Cancel' : '+ New Strategy'}
        </button>
      </div>

      {message && (
        <div className={`strategy-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="strategy-form">
          <div className="form-group">
            <label>Strategy Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Strategy Type</label>
            <select
              value={formData.strategy_type}
              onChange={(e) => setFormData({ ...formData, strategy_type: e.target.value })}
            >
              <option value="manual">Manual Trading</option>
              <option value="dca">Dollar Cost Averaging</option>
              <option value="grid">Grid Trading</option>
              <option value="scalping">Scalping</option>
            </select>
          </div>

          <div className="form-group">
            <label>Trading Pair</label>
            <select
              value={formData.trading_pair}
              onChange={(e) => setFormData({ ...formData, trading_pair: e.target.value })}
              required
              disabled={loading || tradingPairs.length === 0}
            >
              {loading ? (
                <option value="">Loading pairs...</option>
              ) : tradingPairs.length === 0 ? (
                <option value="">No trading pairs available</option>
              ) : (
                <>
                  <option value="">Select a pair</option>
                  {tradingPairs.map((pair) => (
                    <option key={pair.id} value={pair.id}>
                      {pair.symbol}
                    </option>
                  ))}
                </>
              )}
            </select>
            {!loading && tradingPairs.length === 0 && (
              <small style={{color: '#dc3545', marginTop: '4px', display: 'block'}}>
                No trading pairs found. Please check your backend connection.
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              step="0.00000001"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          {formData.strategy_type === 'dca' && (
            <>
              <div className="form-group">
                <label>Execution Interval</label>
                <select
                  value={formData.execution_interval}
                  onChange={(e) => setFormData({ ...formData, execution_interval: e.target.value })}
                >
                  <option value="15min">Every 15 Minutes</option>
                  <option value="30min">Every 30 Minutes</option>
                  <option value="1h">Every 1 Hour</option>
                  <option value="4h">Every 4 Hours</option>
                  <option value="1d">Every 1 Day</option>
                </select>
              </div>

              <div className="form-group">
                <label>Stop Loss (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.stop_loss_percentage}
                  onChange={(e) => setFormData({ ...formData, stop_loss_percentage: e.target.value })}
                  placeholder="1.0"
                />
                <small>Sell when price drops this % below buy price</small>
              </div>

              <div className="form-group">
                <label>Take Profit (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.take_profit_percentage}
                  onChange={(e) => setFormData({ ...formData, take_profit_percentage: e.target.value })}
                  placeholder="2.0"
                />
                <small>Sell when price rises this % above buy price</small>
              </div>
            </>
          )}

          {formData.strategy_type === 'manual' && (
            <>
              <div className="form-group">
                <label>Buy Price (Optional)</label>
                <input
                  type="number"
                  step="0.00000001"
                  value={formData.buy_price}
                  onChange={(e) => setFormData({ ...formData, buy_price: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Sell Price (Optional)</label>
                <input
                  type="number"
                  step="0.00000001"
                  value={formData.sell_price}
                  onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                />
              </div>
            </>
          )}

          <button type="submit" className="create-strategy-btn">
            Create Strategy
          </button>
        </form>
      )}

      <div className="strategies-list">
        {strategies.length === 0 ? (
          <p className="no-strategies">No strategies yet. Create one to get started!</p>
        ) : (
          strategies.map((strategy) => (
            <div key={strategy.id} className={`strategy-card ${strategy.is_active ? 'active' : 'inactive'}`}>
              <div className="strategy-info">
                <div className="strategy-header-row">
                  <h4>{strategy.name}</h4>
                  <span className={`status-badge ${strategy.is_active ? 'active' : 'inactive'}`}>
                    {strategy.is_active ? '● ACTIVE' : '○ Inactive'}
                  </span>
                </div>
                <p className="strategy-type">{strategy.strategy_type.toUpperCase()}</p>
                <div className="strategy-details">
                  <div className="detail-item">
                    <span className="label">Pair:</span>
                    <span className="value">{strategy.trading_pair_symbol || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Amount:</span>
                    <span className="value">{strategy.amount}</span>
                  </div>
                  {strategy.strategy_type === 'dca' && (
                    <>
                      <div className="detail-item">
                        <span className="label">Interval:</span>
                        <span className="value">{strategy.execution_interval || '1h'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Stop Loss:</span>
                        <span className="value">{strategy.stop_loss_percentage || 1.0}%</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Take Profit:</span>
                        <span className="value">{strategy.take_profit_percentage || 2.0}%</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Total Executions:</span>
                        <span className="value">{strategy.total_executions || 0}</span>
                      </div>
                      {strategy.last_executed_at && (
                        <div className="detail-item">
                          <span className="label">Last Executed:</span>
                          <span className="value">{new Date(strategy.last_executed_at).toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="strategy-actions">
                <button
                  onClick={() => handleToggleStrategy(strategy)}
                  className={`toggle-btn ${strategy.is_active ? 'active' : ''}`}
                >
                  {strategy.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDeleteStrategy(strategy.id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StrategyManager;
