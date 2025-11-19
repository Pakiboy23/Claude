import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Check, Trash2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { shoppingListAPI } from '../utils/api';

const ShoppingList = () => {
  const queryClient = useQueryClient();

  const { data: shoppingList, isLoading } = useQuery('shopping-list', () =>
    shoppingListAPI.get()
  );

  const updateItemMutation = useMutation(
    ({ itemId, data }) => shoppingListAPI.updateItem(itemId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('shopping-list');
      }
    }
  );

  const deleteItemMutation = useMutation(
    (itemId) => shoppingListAPI.deleteItem(itemId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('shopping-list');
        toast.success('Item removed');
      }
    }
  );

  const addLowStockMutation = useMutation(
    () => shoppingListAPI.addLowStock(),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('shopping-list');
        toast.success(response.data.message);
      }
    }
  );

  const togglePurchased = (item) => {
    updateItemMutation.mutate({
      itemId: item._id,
      data: { isPurchased: !item.isPurchased }
    });
  };

  if (isLoading) return <div className="spinner"></div>;

  const items = shoppingList?.data?.items || [];
  const unpurchasedItems = items.filter(item => !item.isPurchased);
  const purchasedItems = items.filter(item => item.isPurchased);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Shopping List</h1>
          <p>{unpurchasedItems.length} items to buy</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => addLowStockMutation.mutate()}
        >
          + Add Low Stock Items
        </button>
      </div>

      <div className="card">
        <h3>To Buy</h3>
        {unpurchasedItems.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {unpurchasedItems.map((item) => (
              <div key={item._id} className="list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => togglePurchased(item)}
                    style={{ minWidth: '40px', padding: '8px' }}
                  >
                    <Check size={20} />
                  </button>
                  <div>
                    <p className="item-name">{item.productId?.name}</p>
                    <p className="item-detail">
                      {item.quantity} {item.unit}
                      {item.priority === 'high' && (
                        <span className="badge badge-danger" style={{ marginLeft: '8px' }}>
                          High Priority
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={() => deleteItemMutation.mutate(item._id)}
                  style={{ minWidth: '40px', padding: '8px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <ShoppingBag size={64} color="#ccc" />
            <h3>Your shopping list is empty</h3>
            <p>Add items from your inventory or manually</p>
          </div>
        )}
      </div>

      {purchasedItems.length > 0 && (
        <div className="card">
          <h3>Purchased</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {purchasedItems.map((item) => (
              <div key={item._id} className="list-item" style={{ opacity: 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => togglePurchased(item)}
                    style={{ minWidth: '40px', padding: '8px' }}
                  >
                    <Check size={20} />
                  </button>
                  <div>
                    <p className="item-name" style={{ textDecoration: 'line-through' }}>
                      {item.productId?.name}
                    </p>
                    <p className="item-detail">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingList;
