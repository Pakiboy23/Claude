import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Scan, Plus, Search, Filter, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryAPI, productAPI } from '../utils/api';
import BarcodeScanner from '../components/BarcodeScanner';
import './Inventory.css';

const Inventory = () => {
  const queryClient = useQueryClient();
  const [showScanner, setShowScanner] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { data: inventory, isLoading } = useQuery('inventory', () =>
    inventoryAPI.getAll()
  );

  const deleteMutation = useMutation(
    (id) => inventoryAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('inventory');
        toast.success('Item removed from inventory');
      }
    }
  );

  const addMutation = useMutation(
    (data) => inventoryAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('inventory');
        toast.success('Item added to inventory');
        setShowAddForm(false);
        setSelectedProduct(null);
      }
    }
  );

  const handleBarcodeScan = async (barcode) => {
    setShowScanner(false);
    toast.loading('Looking up product...', { id: 'barcode' });

    try {
      const response = await productAPI.getByBarcode(barcode);
      const product = response.data.data;

      setSelectedProduct(product);
      setShowAddForm(true);
      toast.success('Product found!', { id: 'barcode' });
    } catch (error) {
      toast.error('Product not found for this barcode', { id: 'barcode' });
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const data = {
      productId: selectedProduct?._id,
      quantity: parseFloat(formData.get('quantity')),
      unit: formData.get('unit'),
      location: formData.get('location'),
      lowStockThreshold: parseFloat(formData.get('lowStockThreshold')),
      expirationDate: formData.get('expirationDate') || undefined,
      notes: formData.get('notes')
    };

    if (!data.productId) {
      toast.error('Please select a product');
      return;
    }

    addMutation.mutate(data);
  };

  const filteredItems = inventory?.data?.data?.filter(item => {
    if (!item.productId) return false;

    const matchesSearch = !searchTerm ||
      item.productId.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation = !filterLocation || item.location === filterLocation;

    const matchesCategory = !filterCategory ||
      item.productId.category === filterCategory;

    return matchesSearch && matchesLocation && matchesCategory;
  }) || [];

  if (isLoading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="inventory-page">
      <div className="page-header">
        <div>
          <h1>Inventory</h1>
          <p>Manage your pantry items</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowScanner(true)}
          >
            <Scan size={20} />
            Scan Barcode
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSelectedProduct(null);
              setShowAddForm(true);
            }}
          >
            <Plus size={20} />
            Add Manually
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
        >
          <option value="">All Locations</option>
          <option value="pantry">Pantry</option>
          <option value="fridge">Fridge</option>
          <option value="freezer">Freezer</option>
          <option value="other">Other</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="dairy">Dairy</option>
          <option value="produce">Produce</option>
          <option value="meat">Meat</option>
          <option value="seafood">Seafood</option>
          <option value="bakery">Bakery</option>
          <option value="pantry">Pantry</option>
          <option value="beverages">Beverages</option>
          <option value="frozen">Frozen</option>
          <option value="snacks">Snacks</option>
          <option value="condiments">Condiments</option>
        </select>
      </div>

      <div className="inventory-grid">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div key={item._id} className="inventory-card">
              {item.productId?.imageUrl && (
                <img
                  src={item.productId.imageUrl}
                  alt={item.productId.name}
                  className="item-image"
                />
              )}
              <div className="item-content">
                <h3>{item.productId?.name}</h3>
                {item.productId?.brand && (
                  <p className="item-brand">{item.productId.brand}</p>
                )}

                <div className="item-details">
                  <p>
                    <strong>Quantity:</strong> {item.quantity} {item.unit}
                  </p>
                  <p>
                    <strong>Location:</strong> {item.location}
                  </p>
                  {item.expirationDate && (
                    <p>
                      <strong>Expires:</strong>{' '}
                      {new Date(item.expirationDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {item.isLowStock && (
                  <span className="badge badge-danger">Low Stock</span>
                )}

                {item.expirationStatus === 'expiring-soon' && (
                  <span className="badge badge-warning">Expiring Soon</span>
                )}

                <div className="item-actions">
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      if (window.confirm('Remove this item?')) {
                        deleteMutation.mutate(item._id);
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Package size={64} color="#ccc" />
            <h3>No items found</h3>
            <p>Start by scanning a barcode or adding items manually</p>
          </div>
        )}
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{selectedProduct ? 'Add to Inventory' : 'Select Product'}</h3>
              <button onClick={() => setShowAddForm(false)}>×</button>
            </div>

            {selectedProduct ? (
              <form onSubmit={handleAddItem}>
                <div className="form-group">
                  <label>Product</label>
                  <input
                    type="text"
                    value={selectedProduct.name}
                    disabled
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      required
                      min="0"
                      step="0.1"
                      defaultValue="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Unit</label>
                    <select name="unit" defaultValue={selectedProduct.defaultUnit}>
                      <option value="unit">Unit</option>
                      <option value="lb">Pound</option>
                      <option value="oz">Ounce</option>
                      <option value="kg">Kilogram</option>
                      <option value="g">Gram</option>
                      <option value="l">Liter</option>
                      <option value="ml">Milliliter</option>
                      <option value="count">Count</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <select name="location" defaultValue="pantry">
                    <option value="pantry">Pantry</option>
                    <option value="fridge">Fridge</option>
                    <option value="freezer">Freezer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Low Stock Threshold</label>
                  <input
                    type="number"
                    name="lowStockThreshold"
                    min="0"
                    defaultValue="2"
                  />
                </div>

                <div className="form-group">
                  <label>Expiration Date</label>
                  <input type="date" name="expirationDate" />
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea name="notes" rows="3"></textarea>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add to Inventory
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p>Please scan a barcode or search for a product to add it to your inventory.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
