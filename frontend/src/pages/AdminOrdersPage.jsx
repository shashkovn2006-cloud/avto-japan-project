import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import './AdminOrdersPage.css';

const API_BASE = 'http://localhost:3001';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/delivery/all-orders`, {
        withCredentials: true
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE}/api/delivery/update-status/${orderId}`,
        { status: newStatus },
        { withCredentials: true }
      );
      fetchOrders();
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      alert('Ошибка обновления статуса');
    }
  };

  const getStatusOptions = () => {
    return [
      { value: 'pending', label: '⏳ Ожидает обработки' },
      { value: 'processing', label: '🔄 В обработке' },
      { value: 'shipped', label: '🚚 В пути' },
      { value: 'delivered', label: '✅ Доставлен' },
      { value: 'cancelled', label: '❌ Отменён' }
    ];
  };

  const getStatusClass = (status) => {
    const classes = {
      'pending': 'status-pending',
      'processing': 'status-processing',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    };
    return classes[status] || 'status-pending';
  };

  if (loading) {
    return (
      <div className="app text-center">
        <div className="loader"></div>
        <p>Загрузка заказов...</p>
      </div>
    );
  }

  return (
    <div className="app fade-in">
      <div className="container">
        <h1><i className="fas fa-truck"></i> Управление заказами</h1>
        <p className="text-secondary">Всего заказов: {orders.length}</p>

        {orders.length === 0 ? (
          <div className="no-orders">
            <i className="fas fa-box-open"></i>
            <h3>Нет заказов</h3>
            <p>Пока никто не оформил доставку</p>
          </div>
        ) : (
          <div className="admin-orders-list">
            {orders.map((order) => (
              <div key={order.id} className="admin-order-card">
                <div className="admin-order-header">
                  <div className="order-id">Заказ #{order.id}</div>
                  <div className="order-user">
                    <i className="fas fa-user"></i> {order.user_name}
                  </div>
                  <div className="order-date">
                    <i className="fas fa-calendar"></i> 
                    {new Date(order.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                
                <div className="admin-order-body">
                  <div className="order-car">
                    <img src={order.car_image} alt={order.car_title} />
                    <div className="order-car-info">
                      <h3>{order.car_title}</h3>
                      <p>Цена: ${order.total_price?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="order-info-grid">
                    <div className="info-group">
                      <strong>Получатель:</strong>
                      <p>{order.customer_name}</p>
                      <p>{order.customer_phone}</p>
                      <p>{order.customer_email}</p>
                    </div>
                    
                    <div className="info-group">
                      <strong>Адрес:</strong>
                      <p>{order.customer_city}, {order.customer_address}</p>
                    </div>
                    
                    <div className="info-group">
                      <strong>Доставка:</strong>
                      <p>{
                        order.delivery_type === 'standard' ? 'Стандартная' :
                        order.delivery_type === 'express' ? 'Экспресс' : 'Авиа'
                      } (${order.delivery_price})</p>
                    </div>
                    
                    {order.comment && (
                      <div className="info-group">
                        <strong>Комментарий:</strong>
                        <p>{order.comment}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="order-status-control">
                    <div className={`current-status ${getStatusClass(order.status)}`}>
                      Текущий статус: {
                        getStatusOptions().find(s => s.value === order.status)?.label
                      }
                    </div>
                    
                    <div className="status-update">
                      <select 
                        value={order.status} 
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                      >
                        {getStatusOptions().map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <button 
                        className="btn-accent btn-small"
                        onClick={() => {
                          const newStatus = document.querySelector(`#status-${order.id}`).value;
                          updateStatus(order.id, newStatus);
                        }}
                      >
                        Обновить статус
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;