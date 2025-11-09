import React, { useState, useEffect } from 'react';
import './MarketNews.css';

const MarketNews = () => {
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('news');

  useEffect(() => {
    fetchNews();
    fetchEvents();
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchNews();
      fetchEvents();
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchNews = async () => {
    try {
      // Using CryptoCompare API for crypto news
      const response = await fetch(
        'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=Trading,Regulation,Market,Technology'
      );
      const data = await response.json();

      console.log('News API Response:', data);

      if (data.Data && Array.isArray(data.Data)) {
        // Get top 10 latest news
        const latestNews = data.Data.slice(0, 10).map(item => ({
          id: item.id,
          title: item.title,
          body: item.body,
          source: item.source,
          url: item.url,
          imageUrl: item.imageurl,
          publishedOn: item.published_on,
          tags: item.tags ? item.tags.split('|').slice(0, 3) : [],
          categories: item.categories ? item.categories.split('|') : []
        }));
        console.log('Parsed news:', latestNews);
        setNews(latestNews);
        setLoading(false);
      } else {
        console.error('No news data found');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setLoading(false);
    }
  };

  const fetchEvents = () => {
    // Upcoming market events (this would ideally come from an API)
    const upcomingEvents = [
      {
        id: 1,
        title: 'Federal Reserve Interest Rate Decision',
        date: '2025-11-12',
        time: '14:00 EST',
        impact: 'high',
        description: 'FOMC meeting to decide on interest rates',
        category: 'USA Market'
      },
      {
        id: 2,
        title: 'US CPI Data Release',
        date: '2025-11-13',
        time: '08:30 EST',
        impact: 'high',
        description: 'Consumer Price Index inflation data',
        category: 'USA Market'
      },
      {
        id: 3,
        title: 'Bitcoin ETF Options Launch',
        date: '2025-11-14',
        time: '09:30 EST',
        impact: 'medium',
        description: 'Options trading for Bitcoin ETFs begins',
        category: 'Crypto'
      },
      {
        id: 4,
        title: 'Ethereum Network Upgrade',
        date: '2025-11-18',
        time: 'TBD',
        impact: 'medium',
        description: 'Scheduled network upgrade and improvements',
        category: 'Crypto'
      },
      {
        id: 5,
        title: 'US Non-Farm Payrolls',
        date: '2025-11-15',
        time: '08:30 EST',
        impact: 'high',
        description: 'Monthly employment data release',
        category: 'USA Market'
      },
      {
        id: 6,
        title: 'Gold Market Weekly Review',
        date: '2025-11-16',
        time: '10:00 EST',
        impact: 'low',
        description: 'Weekly commodities market analysis',
        category: 'Commodities'
      }
    ];

    // Sort by date
    const sortedEvents = upcomingEvents.sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    setEvents(sortedEvents);
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return '#f6465d';
      case 'medium': return '#f0b90b';
      case 'low': return '#2ebd85';
      default: return '#848e9c';
    }
  };

  const formatEventDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="market-news">
      <div className="news-header">
        <h3>Market Updates</h3>
        <div className="news-tabs">
          <button
            className={`news-tab ${activeTab === 'news' ? 'active' : ''}`}
            onClick={() => setActiveTab('news')}
          >
            Latest News
          </button>
          <button
            className={`news-tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Upcoming Events
          </button>
        </div>
      </div>

      <div className="news-content">
        {loading && activeTab === 'news' ? (
          <div className="news-loading">
            <div className="spinner"></div>
            <span>Loading news...</span>
          </div>
        ) : activeTab === 'news' ? (
          <div className="news-list">
            {news.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news-item"
              >
                {item.imageUrl && (
                  <div className="news-image">
                    <img src={item.imageUrl} alt="" onError={(e) => e.target.style.display = 'none'} />
                  </div>
                )}
                <div className="news-details">
                  <h4 className="news-title">{item.title}</h4>
                  <p className="news-body">{item.body.substring(0, 120)}...</p>
                  <div className="news-meta">
                    <span className="news-source">{item.source}</span>
                    <span className="news-time">{getTimeAgo(item.publishedOn)}</span>
                  </div>
                  {item.tags.length > 0 && (
                    <div className="news-tags">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="news-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="events-list">
            {events.map((event) => (
              <div key={event.id} className="event-item">
                <div className="event-date-badge">
                  <div className="event-date">{formatEventDate(event.date)}</div>
                  <div className="event-time">{event.time}</div>
                </div>
                <div className="event-details">
                  <div className="event-header">
                    <h4 className="event-title">{event.title}</h4>
                    <span
                      className="event-impact"
                      style={{
                        backgroundColor: `${getImpactColor(event.impact)}20`,
                        color: getImpactColor(event.impact)
                      }}
                    >
                      {event.impact.toUpperCase()}
                    </span>
                  </div>
                  <p className="event-description">{event.description}</p>
                  <div className="event-category">{event.category}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketNews;
