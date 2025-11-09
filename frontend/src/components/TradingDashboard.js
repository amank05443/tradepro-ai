import React, { useState, useEffect, useRef } from 'react';
import CryptoChart from './CryptoChart';
import OrderForm from './OrderForm';
import StrategyManager from './StrategyManager';
import OrderBook from './OrderBook';
import TradeHistory from './TradeHistory';
import Holdings from './Holdings';
import MarketNews from './MarketNews';
import PnLStatement from './PnLStatement';
import { getTradingPairs } from '../services/api';
import './TradingDashboard.css';

const TradingDashboard = ({ user, currency, onLogout, onCurrencyChange }) => {
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [tradingPairs, setTradingPairs] = useState([]);
  const [filteredPairs, setFilteredPairs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('trade');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showChart, setShowChart] = useState(false); // Chart hidden by default
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  const handleOrderPlaced = () => {
    // Trigger refresh of Holdings component
    setRefreshTrigger(prev => prev + 1);
  };

  const toggleCurrency = () => {
    const newCurrency = currency === 'USD' ? 'INR' : 'USD';
    localStorage.setItem('currency', newCurrency);
    onCurrencyChange(newCurrency);
  };

  useEffect(() => {
    loadTradingPairs();
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSearchQuery('');
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showDropdown || showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, showUserMenu]);

  useEffect(() => {
    // Filter pairs based on search query
    if (searchQuery.trim() === '') {
      setFilteredPairs(tradingPairs);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = tradingPairs.filter(pair =>
        pair.symbol.toLowerCase().includes(query) ||
        pair.base_asset.toLowerCase().includes(query)
      );
      setFilteredPairs(filtered);
    }
  }, [searchQuery, tradingPairs]);

  const loadTradingPairs = async () => {
    try {
      const response = await getTradingPairs();
      console.log('Loaded trading pairs:', response.data.length);
      setTradingPairs(response.data);
      setFilteredPairs(response.data);
      if (response.data.length > 0) {
        setSelectedPair(response.data[0].symbol);
      }
    } catch (error) {
      console.error('Error loading trading pairs:', error);
    }
  };

  const handlePairSelect = (symbol) => {
    setSelectedPair(symbol);
    setSearchQuery('');
    setShowDropdown(false);
  };

  return (
    <div className="trading-dashboard">
      <header className="dashboard-header">
        <div className="brand-section">
          <div className="brand-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#gradient1)"/>
              <path d="M16 8L22 12V20L16 24L10 20V12L16 8Z" stroke="white" strokeWidth="2" fill="none"/>
              <circle cx="16" cy="16" r="3" fill="white"/>
              <defs>
                <linearGradient id="gradient1" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#667eea"/>
                  <stop offset="100%" stopColor="#764ba2"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="brand-text">
            <h1>TradePro AI</h1>
            <span className="brand-tagline">Automated Crypto Trading Platform</span>
          </div>
        </div>
        <div className="header-controls">
          <div className="pair-selector">
          <div className="search-dropdown" ref={dropdownRef}>
            <div className="selected-pair" onClick={() => setShowDropdown(!showDropdown)}>
              <span className="pair-symbol">{selectedPair}</span>
              <span className="pair-count">({tradingPairs.length} pairs)</span>
              <svg className={`dropdown-arrow ${showDropdown ? 'open' : ''}`} width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            {showDropdown && (
              <div className="dropdown-panel">
                <div className="search-box">
                  <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16">
                    <path d="M11.5 6.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0zM15 15l-3.5-3.5" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search cryptocurrencies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                    autoFocus
                  />
                  {searchQuery && (
                    <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
                  )}
                </div>
                <div className="pairs-list">
                  {filteredPairs.length > 0 ? (
                    filteredPairs.map((pair) => (
                      <div
                        key={pair.id}
                        className={`pair-item ${selectedPair === pair.symbol ? 'selected' : ''}`}
                        onClick={() => handlePairSelect(pair.symbol)}
                      >
                        <span className="pair-name">{pair.base_asset}</span>
                        <span className="pair-quote">/{pair.quote_asset}</span>
                      </div>
                    ))
                  ) : (
                    <div className="no-results">No cryptocurrencies found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            className={`chart-toggle-btn ${showChart ? 'active' : ''}`}
            onClick={() => setShowChart(!showChart)}
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 0h4v16H0V0zm6 9h4v7H6V9zm6-4h4v11h-4V5z"/>
            </svg>
            <span>{showChart ? 'Hide Chart' : 'Show Chart'}</span>
          </button>

          <button className="currency-toggle" onClick={toggleCurrency}>
            <span className="currency-icon">{currency === 'USD' ? '🇺🇸' : '🇮🇳'}</span>
            <span className="currency-code">{currency}</span>
          </button>

          <div className="user-menu" ref={userMenuRef}>
            <button className="user-button" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="user-avatar">{user?.username?.charAt(0).toUpperCase() || 'U'}</div>
              <span className="user-name">{user?.username || 'User'}</span>
              <svg className={`dropdown-arrow ${showUserMenu ? 'open' : ''}`} width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <div className="user-avatar-large">{user?.username?.charAt(0).toUpperCase()}</div>
                  <div className="user-details">
                    <div className="user-name-large">{user?.username}</div>
                    <div className="user-email">{user?.email}</div>
                  </div>
                </div>
                <div className="user-menu-divider"></div>
                <button className="user-menu-item" onClick={onLogout}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M3 0a2 2 0 00-2 2v12a2 2 0 002 2h5a2 2 0 002-2V2a2 2 0 00-2-2H3zm6 13V3h2v10H9zm3-8l4 3-4 3V5z"/>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </header>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'trade' ? 'active' : ''}`}
          onClick={() => setActiveTab('trade')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm1 12H7V7h2v5zm0-6H7V4h2v2z"/>
          </svg>
          Trade
        </button>
        <button
          className={`tab-button ${activeTab === 'strategies' ? 'active' : ''}`}
          onClick={() => setActiveTab('strategies')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0v8h8V4H4zm1 2h6v1H5V6zm0 2h4v1H5V8z"/>
          </svg>
          Strategies
        </button>
        <button
          className={`tab-button ${activeTab === 'pnl' ? 'active' : ''}`}
          onClick={() => setActiveTab('pnl')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 2a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H2a1 1 0 01-1-1V2zm3 1v10h8V3H4zm1 2h6v1H5V5zm0 2h4v1H5V7z"/>
          </svg>
          P&L Statement
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM7 4h2v5l3 2-1 1.5-3.5-2.5V4z"/>
          </svg>
          History
        </button>
      </div>

      <div className={`dashboard-content ${showChart ? 'with-chart' : ''}`}>
        {showChart && (
          <div className="main-panel">
            <CryptoChart symbol={selectedPair} currency={currency} interval="1h" />
          </div>
        )}

        <div className="side-panel">
          {activeTab === 'trade' && (
            <div className="trade-panel-grid">
              <div className="left-panel-column">
                <OrderForm symbol={selectedPair} currency={currency} onOrderPlaced={handleOrderPlaced} />
                <MarketNews />
              </div>
              <div className="right-panel-column">
                <Holdings refreshTrigger={refreshTrigger} currency={currency} />
              </div>
            </div>
          )}
          {activeTab === 'strategies' && (
            <StrategyManager symbol={selectedPair} />
          )}
          {activeTab === 'pnl' && (
            <PnLStatement currency={currency} />
          )}
          {activeTab === 'history' && (
            <TradeHistory />
          )}
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;
