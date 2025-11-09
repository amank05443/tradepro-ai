import React, { useState } from 'react';
import './Auth.css';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin) {
        // Signup validation
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
      }

      // For now, just simulate login (we'll implement proper auth later)
      setTimeout(() => {
        const user = {
          username: formData.username || 'testuser',
          email: formData.email || 'test@test.com',
          currency: formData.currency
        };
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('currency', formData.currency);
        onLogin(user);
        setLoading(false);
      }, 1000);

    } catch (err) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="crypto-icons">
          <div className="crypto-icon-float">₿</div>
          <div className="crypto-icon-float">Ξ</div>
          <div className="crypto-icon-float">◎</div>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <div className="logo-icon">📈</div>
            <h1>Crypto Trading</h1>
          </div>
          <p className="tagline">Paper Trading Platform</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <div className="form-group">
                <label>Preferred Currency</label>
                <div className="currency-selector">
                  <div
                    className={`currency-option ${formData.currency === 'USD' ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, currency: 'USD' })}
                  >
                    <div className="currency-flag">🇺🇸</div>
                    <div className="currency-info">
                      <div className="currency-code">USD</div>
                      <div className="currency-name">US Dollar</div>
                    </div>
                    <div className="currency-symbol">$</div>
                  </div>

                  <div
                    className={`currency-option ${formData.currency === 'INR' ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, currency: 'INR' })}
                  >
                    <div className="currency-flag">🇮🇳</div>
                    <div className="currency-info">
                      <div className="currency-code">INR</div>
                      <div className="currency-name">Indian Rupee</div>
                    </div>
                    <div className="currency-symbol">₹</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="auth-error">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm1 12H7v-2h2v2zm0-3H7V4h2v5z"/>
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              isLogin ? 'Login' : 'Create Account'
            )}
          </button>
        </form>

        {isLogin && (
          <div className="auth-footer">
            <button className="demo-login" onClick={(e) => {
              e.preventDefault();
              setFormData({ ...formData, username: 'testuser', password: 'testpass' });
              setTimeout(() => handleSubmit({ preventDefault: () => {} }), 100);
            }}>
              Try Demo Account
            </button>
          </div>
        )}

        <div className="auth-features">
          <div className="feature">
            <div className="feature-icon">📄</div>
            <div className="feature-text">Paper Trading</div>
          </div>
          <div className="feature">
            <div className="feature-icon">📊</div>
            <div className="feature-text">Real-time Data</div>
          </div>
          <div className="feature">
            <div className="feature-icon">🔒</div>
            <div className="feature-text">Safe & Secure</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
