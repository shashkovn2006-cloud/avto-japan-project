import { useState } from 'react';
import axios from 'axios';
import './DeliveryForm.css';

const API_BASE = 'http://localhost:3001';

const DeliveryForm = ({ car, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_city: '',
    customer_address: '',
    delivery_type: 'standard',
    comment: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const deliveryPrices = {
    standard: 1500,
    express: 2500,
    air: 5000
  };

  const deliveryLabels = {
    standard: '🚚 Стандартная (30-45 дней)',
    express: '⚡ Экспресс (15-20 дней)',
    air: '✈️ Авиа (7-10 дней)'
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post(`${API_BASE}/api/delivery/create`, {
        car_id: car.id,
        ...formData
      }, { withCredentials: true });
      
      if (response.data.success) {
        setMessage('success');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          if (onClose) onClose();
        }, 1500);
      }
    } catch (error) {
      setMessage('error');
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = car.price + deliveryPrices[formData.delivery_type];

  return (
    <div className="delivery-modal" onClick={onClose}>
      <div className="delivery-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>
          <i className="fas fa-truck"></i>
          Оформление доставки
        </h2>
        
        <div className="delivery-car-info">
          <img src={car.image} alt={car.title} onError={(e) => {
            e.target.src = 'https://via.placeholder.com/120x80?text=No+Image';
          }} />
          <div>
            <h3>{car.title}</h3>
            <p>${car.price.toLocaleString()}</p>
            <small style={{ color: 'rgba(255,255,255,0.5)' }}>
              <i className="fas fa-map-marker-alt"></i> {car.location || 'Tokyo, Japan'}
            </small>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="delivery-form-grid">
            <div className="input-group">
              <label><i className="fas fa-user"></i> Ваше имя *</label>
              <input 
                type="text" 
                name="customer_name" 
                required 
                value={formData.customer_name} 
                onChange={handleChange}
                placeholder="Иван Иванов"
              />
            </div>
            
            <div className="input-group">
              <label><i className="fas fa-phone"></i> Телефон *</label>
              <input 
                type="tel" 
                name="customer_phone" 
                required 
                value={formData.customer_phone} 
                onChange={handleChange}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            
            <div className="input-group">
              <label><i className="fas fa-envelope"></i> Email *</label>
              <input 
                type="email" 
                name="customer_email" 
                required 
                value={formData.customer_email} 
                onChange={handleChange}
                placeholder="ivan@example.com"
              />
            </div>
            
            <div className="input-group">
              <label><i className="fas fa-city"></i> Город *</label>
              <input 
                type="text" 
                name="customer_city" 
                required 
                value={formData.customer_city} 
                onChange={handleChange}
                placeholder="Москва"
              />
            </div>
            
            <div className="input-group full-width">
              <label><i className="fas fa-address-card"></i> Адрес доставки *</label>
              <input 
                type="text" 
                name="customer_address" 
                required 
                value={formData.customer_address} 
                onChange={handleChange}
                placeholder="Улица, дом, квартира"
              />
            </div>
            
            <div className="input-group full-width">
              <label><i className="fas fa-shipping-fast"></i> Способ доставки</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(deliveryPrices).map(([type, price]) => (
                  <label key={type} className="delivery-type-option">
                    <input
                      type="radio"
                      name="delivery_type"
                      value={type}
                      checked={formData.delivery_type === type}
                      onChange={handleChange}
                    />
                    <span>{deliveryLabels[type]}</span>
                    <span className="delivery-type-price">${price.toLocaleString()}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="input-group full-width">
              <label><i className="fas fa-comment"></i> Комментарий</label>
              <textarea 
                name="comment" 
                rows="3" 
                value={formData.comment} 
                onChange={handleChange}
                placeholder="Дополнительные пожелания..."
              />
            </div>
          </div>
          
          <div className="delivery-total">
            <div className="total-row">
              <span>Стоимость автомобиля:</span>
              <span>${car.price.toLocaleString()}</span>
            </div>
            <div className="total-row">
              <span>Доставка ({deliveryLabels[formData.delivery_type]}):</span>
              <span>${deliveryPrices[formData.delivery_type].toLocaleString()}</span>
            </div>
            <div className="total-row grand-total">
              <span>Итого к оплате:</span>
              <span>${totalPrice.toLocaleString()}</span>
            </div>
          </div>
          
          {message === 'success' && (
            <div className="delivery-message success">
              <i className="fas fa-check-circle"></i>
              Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.
            </div>
          )}
          
          {message === 'error' && (
            <div className="delivery-message error">
              <i className="fas fa-exclamation-triangle"></i>
              Ошибка оформления заказа. Попробуйте позже.
            </div>
          )}
          
          <div className="delivery-buttons">
            <button type="button" onClick={onClose} className="btn-secondary">
              Отмена
            </button>
            <button type="submit" disabled={loading} className="btn-accent">
              {loading ? (
                <><i className="fas fa-spinner fa-spin"></i> Оформление...</>
              ) : (
                <><i className="fas fa-check"></i> Подтвердить заказ</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryForm;