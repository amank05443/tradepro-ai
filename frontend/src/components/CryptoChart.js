import React, { useEffect, useRef, useState } from 'react';
import { getCurrencySymbol } from '../utils/currency';
import './CryptoChart.css';

const CryptoChart = ({ symbol = 'BTCUSDT', currency = 'USD' }) => {
  const containerRef = useRef();
  const [timeframe, setTimeframe] = useState('60');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timeframes = [
    { label: '1m', value: '1' },
    { label: '5m', value: '5' },
    { label: '15m', value: '15' },
    { label: '30m', value: '30' },
    { label: '1h', value: '60' },
    { label: '4h', value: '240' },
    { label: '1D', value: 'D' },
    { label: '1W', value: 'W' },
  ];

  const toggleFullscreen = () => {
    const chartContainer = document.querySelector('.crypto-chart');

    if (!document.fullscreenElement) {
      chartContainer.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    // Clear the container
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Create TradingView widget
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined' && containerRef.current) {
        new window.TradingView.widget({
          container_id: containerRef.current.id,
          autosize: true,
          symbol: `BINANCE:${symbol}`,
          interval: timeframe,
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#1e222d',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          save_image: true,
          details: true,
          hotlist: true,
          calendar: false,
          studies: [
            'RSI@tv-basicstudies',
            'MASimple@tv-basicstudies'
          ],
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
          backgroundColor: '#1e222d',
          gridColor: '#2a2e39',
          hide_top_toolbar: false,
          withdateranges: true,
          hide_legend: false,
          disabled_features: [],
          enabled_features: ['study_templates', 'use_localstorage_for_settings'],
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol, timeframe]);

  const getDisplayName = (sym) => {
    // Format display name for different asset types
    if (sym === 'XAUUSD') return `Gold (${getCurrencySymbol(currency)})`;
    if (sym === 'XAGUSD') return `Silver (${getCurrencySymbol(currency)})`;
    if (sym === 'XTIUSD') return `Crude Oil (${getCurrencySymbol(currency)})`;
    return `${sym.replace('USDT', '')} (${getCurrencySymbol(currency)})`;
  };

  return (
    <div className="crypto-chart">
      <div className="chart-header">
        <div className="chart-title-section">
          <h3>{getDisplayName(symbol)}</h3>
          <span className="chart-source">Powered by TradingView {currency === 'INR' && '• Prices shown in INR'}</span>
        </div>
        <div className="chart-controls-section">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="timeframe-select"
          >
            {timeframes.map(tf => (
              <option key={tf.value} value={tf.value}>{tf.label}</option>
            ))}
          </select>
          <button onClick={toggleFullscreen} className="fullscreen-btn">
            {isFullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>
      <div
        id={`tradingview_${symbol}`}
        ref={containerRef}
        className="tradingview-widget-container"
      />
    </div>
  );
};

export default CryptoChart;
