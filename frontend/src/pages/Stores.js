import React from 'react';
import { useQuery } from 'react-query';
import { Store, CheckCircle, XCircle } from 'lucide-react';
import { storeAPI } from '../utils/api';

const Stores = () => {
  const { data: stores, isLoading } = useQuery('stores', () => storeAPI.getAll());

  if (isLoading) return <div className="spinner"></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Connected Stores</h1>
          <p>Link your grocery store accounts for easy shopping</p>
        </div>
      </div>

      <div className="grid grid-2">
        {stores?.data?.data?.map((store) => (
          <div key={store.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <Store size={40} color="#667eea" />
              <div>
                <h3>{store.name}</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>{store.description}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              {store.isAvailable ? (
                <>
                  <CheckCircle size={20} color="#4CAF50" />
                  <span style={{ color: '#4CAF50' }}>Available</span>
                </>
              ) : (
                <>
                  <XCircle size={20} color="#999" />
                  <span style={{ color: '#999' }}>Not Available</span>
                </>
              )}
            </div>

            {store.isAvailable ? (
              <button className="btn btn-primary" style={{ width: '100%' }}>
                Connect Store
              </button>
            ) : (
              <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                Coming Soon
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <h3>How It Works</h3>
        <ol style={{ paddingLeft: '20px', lineHeight: '2' }}>
          <li>Connect your favorite grocery store accounts</li>
          <li>Items from your shopping list are automatically matched with store products</li>
          <li>Click "Add to Cart" to send items directly to your store cart</li>
          <li>Complete your purchase on the store's website or app</li>
        </ol>
      </div>
    </div>
  );
};

export default Stores;
