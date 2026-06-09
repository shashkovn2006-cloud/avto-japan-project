import { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import './ConsultationForm.css';

const API_BASE = 'http://localhost:3001';

const ConsultationForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    carModel: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Заполните имя и телефон');
      return;
    }
    
    setLoading(true);
    
    // Имитация отправки (можно потом подключить реальный API)
    setTimeout(() => {
      toast.success('✅ Заявка отправлена! Мы свяжемся с вами в ближайшее время.');
      setLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="consult-modal-overlay" onClick={onClose}>
        <div className="consult-modal" onClick={(e) => e.stopPropagation()}>
          <div className="consult-modal-header">
            <h3><i className="fas fa-headset"></i> Запрос консультации</h3>
            <button className="consult-modal-close" onClick={onClose}>×</button>
          </div>
          <div className="consult-modal-body">
            <p>Оставьте свои контактные данные, и наш специалист свяжется с вами для консультации.</p>
            <form onSubmit={handleSubmit}>
              <div className="consult-form-group">
                <label><i className="fas fa-user"></i> Ваше имя *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="Иван Иванов"
                  required
                />
              </div>
              <div className="consult-form-group">
                <label><i className="fas fa-phone"></i> Номер телефона *</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="+7 (999) 123-45-67"
                  required
                />
              </div>
              <div className="consult-form-group">
                <label><i className="fas fa-car"></i> Автомобиль (необязательно)</label>
                <input 
                  type="text" 
                  name="carModel" 
                  value={formData.carModel} 
                  onChange={handleChange} 
                  placeholder="Например: Toyota Crown 2020"
                />
              </div>
              <button type="submit" className="consult-submit-btn" disabled={loading}>
                {loading ? 'Отправка...' : 'Отправить заявку'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConsultationForm;