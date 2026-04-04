import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import './MyOrdersPage.css';

const API_BASE = 'http://localhost:3001';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/delivery/my-orders`, {
        withCredentials: true
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statuses = {
      'pending': { text: '⏳ Ожидает обработки', class: 'status-pending' },
      'processing': { text: '🔄 В обработке', class: 'status-processing' },
      'shipped': { text: '🚚 В пути', class: 'status-shipped' },
      'delivered': { text: '✅ Доставлен', class: 'status-delivered' },
      'cancelled': { text: '❌ Отменён', class: 'status-cancelled' }
    };
    return statuses[status] || { text: status, class: 'status-pending' };
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
        <h1><i className="fas fa-truck"></i> Мои заказы</h1>
        <p className="text-secondary">История и статус ваших заказов</p>

        {orders.length === 0 ? (
          <div className="no-orders">
            <i className="fas fa-box-open"></i>
            <h3>У вас пока нет заказов</h3>
            <p>Перейдите в каталог и оформите доставку автомобиля</p>
            <button onClick={() => window.location.href = '/catalog'} className="btn-primary">
              Перейти в каталог
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-id">Заказ #{order.id}</div>
                  <div className="order-date">
                    <i className="fas fa-calendar"></i> 
                    {new Date(order.created_at).toLocaleDateString('ru-RU')}
                  </div>
                  <div className={`order-status ${getStatusBadge(order.status).class}`}>
                    {getStatusBadge(order.status).text}
                  </div>
                </div>
                
                <div className="order-body">
                  <div className="order-car">
                    <img src={order.car_image} alt={order.car_title} />
                    <div className="order-car-info">
                      <h3>{order.car_title}</h3>
                      <p>Цена: ${order.total_price?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="order-details">
                    <div className="detail-group">
                      <h4><i className="fas fa-user"></i> Получатель</h4>
                      <p>{order.customer_name}</p>
                      <p>{order.customer_phone}</p>
                      <p>{order.customer_email}</p>
                    </div>
                    
                    <div className="detail-group">
                      <h4><i className="fas fa-map-marker-alt"></i> Адрес доставки</h4>
                      <p>{order.customer_city}, {order.customer_address}</p>
                    </div>
                    
                    <div className="detail-group">
                      <h4><i className="fas fa-shipping-fast"></i> Доставка</h4>
                      <p>Тип: {
                        order.delivery_type === 'standard' ? 'Стандартная' :
                        order.delivery_type === 'express' ? 'Экспресс' : 'Авиа'
                      }</p>
                      <p>Стоимость: ${order.delivery_price?.toLocaleString()}</p>
                    </div>
                    
                    {order.comment && (
                      <div className="detail-group">
                        <h4><i className="fas fa-comment"></i> Комментарий</h4>
                        <p>{order.comment}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="order-total">
                    <span>Итого:</span>
                    <span>${order.total_price?.toLocaleString()}</span>
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

export default MyOrdersPage;