import React, { useState, useEffect } from 'react';
import { getOrders, cancelOrder } from '../services/api';
import './OrderBook.css';

const OrderBook = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const response = await getOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await cancelOrder(orderId);
      loadOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'filled': return '#26a69a';
      case 'pending': return '#2962ff';
      case 'cancelled': return '#787b86';
      case 'failed': return '#ef5350';
      default: return '#787b86';
    }
  };

  return (
    <div className="order-book">
      <h3>Recent Orders</h3>
      {loading ? (
        <p className="loading">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="no-orders">No orders yet</p>
      ) : (
        <div className="orders-list">
          {orders.slice(0, 10).map((order) => (
            <div key={order.id} className="order-item">
              <div className="order-header">
                <span className={`order-side ${order.order_side}`}>
                  {order.order_side.toUpperCase()}
                </span>
                <span
                  className="order-status"
                  style={{ color: getStatusColor(order.status) }}
                >
                  {order.status}
                </span>
              </div>
              <div className="order-details">
                <p>
                  {order.amount} @ {order.price}
                </p>
                <p className="order-time">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              {order.status === 'pending' && (
                <button
                  onClick={() => handleCancelOrder(order.id)}
                  className="cancel-order-btn"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderBook;
