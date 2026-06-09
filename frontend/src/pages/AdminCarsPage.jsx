import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import './AdminCarsPage.css';

const API_BASE = 'http://94.232.42.162:3001';

const AdminCarsPage = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [formData, setFormData] = useState({
    title: '', price: '', service: '', year: '', mileage: '', engine: '',
    auctionGrade: '4.5', description: '', location: 'Tokyo, Japan', color: '', features: ''
  });

  useEffect(() => { fetchCars(); }, []);

  const fetchCars = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/cars`);
      setCars(res.data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (confirm('Вы уверены, что хотите удалить этот автомобиль?')) {
      await axios.delete(`${API_BASE}/api/cars/${id}`, { withCredentials: true });
      fetchCars();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const featuresArray = formData.features.split(',').map(f => f.trim());
      const payload = { ...formData, features: featuresArray, price: parseInt(formData.price) };
      if (editingCar) {
        await axios.put(`${API_BASE}/api/cars/${editingCar.id}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${API_BASE}/api/cars`, payload, { withCredentials: true });
      }
      setShowForm(false);
      setEditingCar(null);
      fetchCars();
    } catch (error) {
      alert('Ошибка сохранения');
    }
  };

  const handleEdit = (car) => {
    setEditingCar(car);
    setFormData({
      title: car.title || '', price: car.price || '', service: car.service || '',
      year: car.year || '', mileage: car.mileage || '', engine: car.engine || '',
      auctionGrade: car.auction_grade || '4.5', description: car.description || '',
      location: car.location || 'Tokyo, Japan', color: car.color || '',
      features: (car.features || []).join(', ')
    });
    setShowForm(true);
  };

  const handleUploadImage = async (carId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    await axios.post(`${API_BASE}/api/cars/${carId}/upload-main`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: true
    });
    fetchCars();
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loader"></div>
        <p>Загрузка автомобилей...</p>
      </div>
    );
  }

  return (
    <div className="admin-cars-page">
      {/* Шапка */}
      <div className="admin-header">
        <div className="admin-header-content">
          <h1><i className="fas fa-car"></i> Управление автомобилями</h1>
          <p className="admin-subtitle">Добавление, редактирование и управление каталогом</p>
        </div>
        <button className="btn-add-car" onClick={() => { setEditingCar(null); setFormData({ title: '', price: '', service: '', year: '', mileage: '', engine: '', auctionGrade: '4.5', description: '', location: 'Tokyo, Japan', color: '', features: '' }); setShowForm(true); }}>
          <i className="fas fa-plus"></i> Добавить автомобиль
        </button>
      </div>

      {/* Модальное окно */}
      {showForm && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <div className="modal-header">
              <h2><i className="fas fa-car"></i> {editingCar ? 'Редактировать автомобиль' : 'Новый автомобиль'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-grid">
                <div className="form-group">
                  <label><i className="fas fa-car"></i> Название *</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="Toyota Camry 2020" />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-dollar-sign"></i> Цена ($) *</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required placeholder="25000" />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-store"></i> Сервис *</label>
                  <input type="text" value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} required placeholder="carfromjapan.com" />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-calendar"></i> Год *</label>
                  <input type="number" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required placeholder="2020" />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-road"></i> Пробег *</label>
                  <input type="text" value={formData.mileage} onChange={e => setFormData({...formData, mileage: e.target.value})} required placeholder="45,000 km" />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-engine"></i> Двигатель *</label>
                  <input type="text" value={formData.engine} onChange={e => setFormData({...formData, engine: e.target.value})} required placeholder="2.5L Hybrid" />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-star"></i> Оценка аукциона</label>
                  <input type="number" step="0.1" value={formData.auctionGrade} onChange={e => setFormData({...formData, auctionGrade: e.target.value})} placeholder="4.5" />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-map-marker-alt"></i> Локация</label>
                  <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Tokyo, Japan" />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-palette"></i> Цвет</label>
                  <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} placeholder="Черный" />
                </div>
                <div className="form-group full-width">
                  <label><i className="fas fa-list"></i> Комплектация (через запятую)</label>
                  <input type="text" value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} placeholder="Кожаный салон, Панорамная крыша, Навигация" />
                </div>
                <div className="form-group full-width">
                  <label><i className="fas fa-align-left"></i> Описание</label>
                  <textarea rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Подробное описание автомобиля..."></textarea>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => { setShowForm(false); setEditingCar(null); }}>Отмена</button>
                <button type="submit" className="btn-save"><i className="fas fa-save"></i> {editingCar ? 'Сохранить изменения' : 'Добавить автомобиль'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Таблица */}
      <div className="cars-table-container">
        <div className="table-wrapper">
          <table className="cars-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Фото</th>
                <th>Название</th>
                <th>Цена</th>
                <th>Год</th>
                <th>Сервис</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {cars.map(car => (
                <tr key={car.id}>
                  <td data-label="ID">{car.id}</td>
                  <td data-label="Фото">
                    {car.image ? (
                      <img src={car.image} alt={car.title} className="car-thumbnail" />
                    ) : (
                      <div className="no-image"><i className="fas fa-image"></i></div>
                    )}
                  </td>
                  <td data-label="Название"><strong>{car.title}</strong></td>
                  <td data-label="Цена">${car.price?.toLocaleString()}</td>
                  <td data-label="Год">{car.year}</td>
                  <td data-label="Сервис">{car.service}</td>
                  <td data-label="Действия">
                    <div className="table-actions">
                      <button className="action-btn edit" onClick={() => handleEdit(car)} title="Редактировать">
                        <i className="fas fa-edit"></i>
                      </button>
                      <label className="action-btn upload" title="Загрузить фото">
                        <i className="fas fa-camera"></i>
                        <input type="file" accept="image/*" style={{display: 'none'}} onChange={e => handleUploadImage(car.id, e.target.files[0])} />
                      </label>
                      <button className="action-btn delete" onClick={() => handleDelete(car.id)} title="Удалить">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCarsPage;