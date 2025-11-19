import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Package, AlertCircle, ShoppingCart, TrendingUp } from 'lucide-react';
import { inventoryAPI, shoppingListAPI } from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: inventory, isLoading: inventoryLoading } = useQuery(
    'dashboard-inventory',
    () => inventoryAPI.getAll()
  );

  const { data: lowStock } = useQuery(
    'dashboard-low-stock',
    () => inventoryAPI.getLowStock()
  );

  const { data: shoppingList } = useQuery(
    'dashboard-shopping-list',
    () => shoppingListAPI.get()
  );

  const stats = [
    {
      icon: Package,
      label: 'Total Items',
      value: inventory?.data?.count || 0,
      color: '#4CAF50',
      onClick: () => navigate('/inventory')
    },
    {
      icon: AlertCircle,
      label: 'Low Stock',
      value: lowStock?.data?.count || 0,
      color: '#ff6b6b',
      onClick: () => navigate('/inventory?filter=lowStock')
    },
    {
      icon: ShoppingCart,
      label: 'Shopping List',
      value: shoppingList?.data?.unpurchasedCount || 0,
      color: '#667eea',
      onClick: () => navigate('/shopping-list')
    },
    {
      icon: TrendingUp,
      label: 'Categories',
      value: new Set(inventory?.data?.data?.map(i => i.productId?.category)).size || 0,
      color: '#ffa500'
    }
  ];

  const expiringItems = inventory?.data?.data?.filter(item => {
    const status = item.expirationStatus;
    return status === 'expiring-soon' || status === 'expiring-this-week';
  }) || [];

  const recentItems = inventory?.data?.data?.slice(0, 5) || [];

  if (inventoryLoading) {
    return (
      <div className="dashboard">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome to your Smart Pantry</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="stat-card"
            onClick={stat.onClick}
            style={{ cursor: stat.onClick ? 'pointer' : 'default' }}
          >
            <div className="stat-icon" style={{ background: stat.color + '20', color: stat.color }}>
              <stat.icon size={28} />
            </div>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <h2 className="stat-value">{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Low Stock Alerts */}
        {lowStock?.data?.count > 0 && (
          <div className="card">
            <div className="card-header">
              <h3>⚠️ Low Stock Alerts</h3>
              <button
                className="btn btn-outline"
                onClick={() => navigate('/inventory?filter=lowStock')}
              >
                View All
              </button>
            </div>
            <div className="card-body">
              {lowStock.data.data.slice(0, 5).map((item) => (
                <div key={item._id} className="list-item">
                  <div>
                    <p className="item-name">{item.productId?.name}</p>
                    <p className="item-detail">
                      Current: {item.quantity} {item.unit} |
                      Threshold: {item.lowStockThreshold}
                    </p>
                  </div>
                  <span className="badge badge-danger">Low</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expiring Soon */}
        {expiringItems.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3>⏰ Expiring Soon</h3>
              <button
                className="btn btn-outline"
                onClick={() => navigate('/inventory?filter=expiring')}
              >
                View All
              </button>
            </div>
            <div className="card-body">
              {expiringItems.slice(0, 5).map((item) => (
                <div key={item._id} className="list-item">
                  <div>
                    <p className="item-name">{item.productId?.name}</p>
                    <p className="item-detail">
                      Expires: {new Date(item.expirationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`badge badge-${
                    item.expirationStatus === 'expiring-soon' ? 'danger' : 'warning'
                  }`}>
                    {item.expirationStatus === 'expiring-soon' ? 'Soon' : 'This Week'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Items */}
        <div className="card">
          <div className="card-header">
            <h3>📦 Recently Added</h3>
            <button
              className="btn btn-outline"
              onClick={() => navigate('/inventory')}
            >
              View All
            </button>
          </div>
          <div className="card-body">
            {recentItems.length > 0 ? (
              recentItems.map((item) => (
                <div key={item._id} className="list-item">
                  <div>
                    <p className="item-name">{item.productId?.name}</p>
                    <p className="item-detail">
                      {item.quantity} {item.unit} | {item.location}
                    </p>
                  </div>
                  <span className="badge badge-success">
                    {new Date(item.addedDate).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="empty-state">No items yet. Start adding to your inventory!</p>
            )}
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <button className="btn btn-primary" onClick={() => navigate('/inventory')}>
          + Add to Inventory
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/shopping-list')}>
          View Shopping List
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
