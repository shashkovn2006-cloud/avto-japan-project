import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminCarsPage.css';

const API_BASE = 'http://localhost:3001';

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
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (confirm('Удалить?')) {
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
      alert('Ошибка');
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
    const fd = new FormData();
    fd.append('image', file);
    await axios.post(`${API_BASE}/api/cars/${carId}/upload-main`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: true
    });
    fetchCars();
  };

  if (loading) return <div className="admin-cars-container"><div className="loader"></div></div>;

  return (
    <div className="admin-cars-container">
      <div className="admin-cars-header">
        <h1 className="admin-cars-title">🚗 Управление автомобилями</h1>
        <button className="admin-cars-add-btn" onClick={() => { setEditingCar(null); setFormData({ title: '', price: '', service: '', year: '', mileage: '', engine: '', auctionGrade: '4.5', description: '', location: 'Tokyo, Japan', color: '', features: '' }); setShowForm(true); }}>
          + Добавить автомобиль
        </button>
      </div>

      {showForm && (
        <div className="admin-cars-modal-overlay">
          <div className="admin-cars-modal">
            <div className="admin-cars-modal-header">
              <h3 className="admin-cars-modal-title">{editingCar ? 'Редактировать автомобиль' : 'Новый автомобиль'}</h3>
              <button className="admin-cars-modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-cars-form">
                <div className="admin-cars-form-grid">
                  <div className="admin-cars-form-field">
                    <label>Название</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                  </div>
                  <div className="admin-cars-form-field">
                    <label>Цена ($)</label>
                    <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                  </div>
                  <div className="admin-cars-form-field">
                    <label>Сервис</label>
                    <input type="text" value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} required />
                  </div>
                  <div className="admin-cars-form-field">
                    <label>Год</label>
                    <input type="number" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required />
                  </div>
                  <div className="admin-cars-form-field">
                    <label>Пробег</label>
                    <input type="text" value={formData.mileage} onChange={e => setFormData({...formData, mileage: e.target.value})} required />
                  </div>
                  <div className="admin-cars-form-field">
                    <label>Двигатель</label>
                    <input type="text" value={formData.engine} onChange={e => setFormData({...formData, engine: e.target.value})} required />
                  </div>
                  <div className="admin-cars-form-field">
                    <label>Оценка</label>
                    <input type="number" step="0.1" value={formData.auctionGrade} onChange={e => setFormData({...formData, auctionGrade: e.target.value})} />
                  </div>
                  <div className="admin-cars-form-field">
                    <label>Локация</label>
                    <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                  </div>
                  <div className="admin-cars-form-field">
                    <label>Цвет</label>
                    <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                  </div>
                  <div className="admin-cars-form-field">
                    <label>Комплектация (через запятую)</label>
                    <input type="text" value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} />
                  </div>
                  <div className="admin-cars-form-field admin-cars-full-width">
                    <label>Описание</label>
                    <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                  </div>
                </div>
                <div className="admin-cars-form-buttons">
                  <button type="button" className="admin-cars-btn-cancel" onClick={() => setShowForm(false)}>Отмена</button>
                  <button type="submit" className="admin-cars-btn-submit">Сохранить</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-cars-table-wrapper">
        <table className="admin-cars-table">
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
                <td>{car.id}</td>
                <td>{car.image ? <img src={car.image} className="admin-cars-thumb" /> : '—'}</td>
                <td><strong>{car.title}</strong></td>
                <td>${car.price?.toLocaleString()}</td>
                <td>{car.year}</td>
                <td>{car.service}</td>
                <td>
                  <div className="admin-cars-actions">
                    <button className="admin-cars-btn admin-cars-btn-edit" onClick={() => handleEdit(car)}>✏️</button>
                    <label className="admin-cars-btn admin-cars-btn-upload" style={{cursor:'pointer'}}>📷<input type="file" style={{display:'none'}} onChange={e => handleUploadImage(car.id, e.target.files[0])} /></label>
                    <button className="admin-cars-btn admin-cars-btn-delete" onClick={() => handleDelete(car.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCarsPage;