import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';
import useAuthStore from '../store/authStore';

const Settings = () => {
  const { user, updateUser } = useAuthStore();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      defaultStore: user?.preferences?.defaultStore || 'other',
      lowStockThreshold: user?.preferences?.lowStockThreshold || 2,
      emailNotifications: user?.preferences?.notificationSettings?.email !== false,
      lowStockAlerts: user?.preferences?.notificationSettings?.lowStockAlerts !== false,
      expirationAlerts: user?.preferences?.notificationSettings?.expirationAlerts !== false
    }
  });

  const updatePreferencesMutation = useMutation(
    (data) => authAPI.updatePreferences({ preferences: data }),
    {
      onSuccess: (response) => {
        updateUser(response.data.user);
        toast.success('Settings saved successfully');
      }
    }
  );

  const onSubmit = (data) => {
    const preferences = {
      defaultStore: data.defaultStore,
      lowStockThreshold: parseInt(data.lowStockThreshold),
      notificationSettings: {
        email: data.emailNotifications,
        lowStockAlerts: data.lowStockAlerts,
        expirationAlerts: data.expirationAlerts
      }
    };

    updatePreferencesMutation.mutate(preferences);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your preferences</p>
        </div>
      </div>

      <div className="card">
        <h3>General Settings</h3>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Default Store</label>
            <select {...register('defaultStore')}>
              <option value="other">Select a store</option>
              <option value="instacart">Instacart</option>
              <option value="amazon">Amazon Fresh</option>
              <option value="walmart">Walmart</option>
              <option value="kroger">Kroger</option>
            </select>
          </div>

          <div className="form-group">
            <label>Default Low Stock Threshold</label>
            <input
              type="number"
              {...register('lowStockThreshold')}
              min="1"
            />
            <small>Items below this quantity will trigger low stock alerts</small>
          </div>

          <h3 style={{ marginTop: '30px' }}>Notification Settings</h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" {...register('emailNotifications')} />
              <span>Enable Email Notifications</span>
            </label>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" {...register('lowStockAlerts')} />
              <span>Low Stock Alerts</span>
            </label>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" {...register('expirationAlerts')} />
              <span>Expiration Date Alerts</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Save Settings
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Account Information</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <strong>Name:</strong> {user?.name}
          </div>
          <div>
            <strong>Email:</strong> {user?.email}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
