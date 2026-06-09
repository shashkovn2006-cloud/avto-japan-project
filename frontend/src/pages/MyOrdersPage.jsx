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

  const getStatusInfo = (status) => {
    const statuses = {
      'pending': { text: '⏳ Ожидает обработки', class: 'status-pending', step: 1, color: '#fdcb6e' },
      'processing': { text: '🔄 В обработке', class: 'status-processing', step: 2, color: '#4a90e2' },
      'shipped': { text: '🚚 В пути', class: 'status-shipped', step: 3, color: '#00b894' },
      'delivered': { text: '✅ Доставлен', class: 'status-delivered', step: 4, color: '#00b894' },
      'cancelled': { text: '❌ Отменён', class: 'status-cancelled', step: 0, color: '#ff6b6b' }
    };
    return statuses[status] || { text: status, class: 'status-pending', step: 1, color: '#fdcb6e' };
  };

  const steps = [
    { name: 'Заказ принят', icon: 'fa-clipboard-list', step: 1 },
    { name: 'В обработке', icon: 'fa-cogs', step: 2 },
    { name: 'Отправлен', icon: 'fa-truck', step: 3 },
    { name: 'Доставлен', icon: 'fa-check-circle', step: 4 }
  ];

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
        <p className="text-secondary">История и отслеживание статуса ваших заказов</p>

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
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const currentStep = statusInfo.step;
              
              return (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-id">Заказ #{order.id}</div>
                    <div className="order-date">
                      <i className="fas fa-calendar"></i> 
                      {new Date(order.created_at).toLocaleDateString('ru-RU')}
                    </div>
                    <div className={`order-status ${statusInfo.class}`}>
                      {statusInfo.text}
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
                    
                    {/* Трекинг-статус */}
                    <div className="order-tracking">
                      <div className="tracking-steps">
                        {steps.map((step, idx) => {
                          const isActive = currentStep >= step.step;
                          const isCompleted = currentStep > step.step;
                          return (
                            <div key={idx} className={`tracking-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                              <div className="step-circle">
                                {isCompleted ? <i className="fas fa-check"></i> : <i className={step.icon}></i>}
                              </div>
                              <div className="step-name">{step.name}</div>
                              {idx < steps.length - 1 && <div className="step-line"></div>}
                            </div>
                          );
                        })}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;