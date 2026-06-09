import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
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

  const deliveryPrices = {
    standard: 1500,
    express: 2500,
    air: 5000
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE}/api/delivery/create`, {
        car_id: car.id,
        ...formData
      }, { withCredentials: true });
      
      if (response.data.success) {
        toast.success('✅ Заказ успешно оформлен! Мы свяжемся с вами.', {
          duration: 4000,
          position: 'top-right',
          icon: '🚚'
        });
        setTimeout(() => {
          if (onSuccess) onSuccess();
          if (onClose) onClose();
        }, 1500);
      }
    } catch (error) {
      toast.error('❌ Ошибка оформления заказа. Попробуйте позже.', {
        duration: 4000,
        position: 'top-right'
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = car.price + deliveryPrices[formData.delivery_type];

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e1e2e',
            color: '#fff',
            border: '1px solid #3a3a4e',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#00b894',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff6b6b',
              secondary: 'white',
            },
          },
        }}
      />
      <div className="delivery-modal" onClick={onClose}>
        <div className="delivery-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          
          <h2><i className="fas fa-truck"></i> Оформление доставки</h2>
          
          <div className="delivery-car-info">
            <img src={car.image} alt={car.title} onError={(e) => {
              e.target.src = 'https://via.placeholder.com/120x80?text=No+Image';
            }} />
            <div>
              <h3>{car.title}</h3>
              <p>${car.price.toLocaleString()}</p>
              <small><i className="fas fa-map-marker-alt"></i> {car.location || 'Tokyo, Japan'}</small>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="delivery-form-grid">
              <div className="input-group">
                <label><i className="fas fa-user"></i> Ваше имя *</label>
                <input type="text" name="customer_name" required value={formData.customer_name} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label><i className="fas fa-phone"></i> Телефон *</label>
                <input type="tel" name="customer_phone" required value={formData.customer_phone} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label><i className="fas fa-envelope"></i> Email *</label>
                <input type="email" name="customer_email" required value={formData.customer_email} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label><i className="fas fa-city"></i> Город *</label>
                <input type="text" name="customer_city" required value={formData.customer_city} onChange={handleChange} />
              </div>
              <div className="input-group full-width">
                <label><i className="fas fa-address-card"></i> Адрес доставки *</label>
                <input type="text" name="customer_address" required value={formData.customer_address} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label><i className="fas fa-shipping-fast"></i> Способ доставки</label>
                <select name="delivery_type" value={formData.delivery_type} onChange={handleChange}>
                  <option value="standard">🚚 Стандартная (30-45 дней) - ${deliveryPrices.standard}</option>
                  <option value="express">⚡ Экспресс (15-20 дней) - ${deliveryPrices.express}</option>
                  <option value="air">✈️ Авиа (7-10 дней) - ${deliveryPrices.air}</option>
                </select>
              </div>
              <div className="input-group full-width">
                <label><i className="fas fa-comment"></i> Комментарий</label>
                <textarea name="comment" rows="3" value={formData.comment} onChange={handleChange} placeholder="Дополнительные пожелания..."></textarea>
              </div>
            </div>
            
            <div className="delivery-total">
              <div className="total-row">
                <span>Стоимость автомобиля:</span>
                <span>${car.price.toLocaleString()}</span>
              </div>
              <div className="total-row">
                <span>Доставка ({formData.delivery_type === 'standard' ? 'Стандартная' : formData.delivery_type === 'express' ? 'Экспресс' : 'Авиа'}):</span>
                <span>${deliveryPrices[formData.delivery_type].toLocaleString()}</span>
              </div>
              <div className="total-row grand-total">
                <span>Итого к оплате:</span>
                <span>${totalPrice.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="delivery-buttons">
              <button type="button" onClick={onClose} className="btn-secondary">Отмена</button>
              <button type="submit" disabled={loading} className="btn-accent">
                {loading ? 'Оформление...' : 'Подтвердить заказ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default DeliveryForm;