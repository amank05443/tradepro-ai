import React, { useState, useEffect } from 'react';
import TradingDashboard from './components/TradingDashboard';
import Auth from './components/Auth';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    const savedCurrency = localStorage.getItem('currency');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrency(savedCurrency || 'USD');
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrency(userData.currency || 'USD');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('currency');
    setUser(null);
    setCurrency('USD');
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <TradingDashboard
        user={user}
        currency={currency}
        onLogout={handleLogout}
        onCurrencyChange={setCurrency}
      />
    </div>
  );
}

export default App;
