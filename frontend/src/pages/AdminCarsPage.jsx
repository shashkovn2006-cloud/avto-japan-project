import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
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

  if (loading) {
    return <div className="admin-loading"><div className="loader"></div><p>Загрузка...</p></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">🚗 Управление автомобилями</h1>
          <p className="admin-subtitle">Добавление, редактирование и управление каталогом</p>
        </div>
        <button className="admin-add-btn" onClick={() => { setEditingCar(null); setFormData({ title: '', price: '', service: '', year: '', mileage: '', engine: '', auctionGrade: '4.5', description: '', location: 'Tokyo, Japan', color: '', features: '' }); setShowForm(true); }}>
          + Добавить автомобиль
        </button>
      </div>

      {showForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 style={{margin:0}}>{editingCar ? '✏️ Редактировать' : '➕ Новый автомобиль'}</h2>
              <button onClick={() => setShowForm(false)} style={{background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#94a3b8'}}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-grid">
                  <input type="text" placeholder="Название" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="admin-form-field" />
                  <input type="number" placeholder="Цена ($)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="admin-form-field" />
                  <input type="text" placeholder="Сервис" value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} required className="admin-form-field" />
                  <input type="number" placeholder="Год" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required className="admin-form-field" />
                  <input type="text" placeholder="Пробег" value={formData.mileage} onChange={e => setFormData({...formData, mileage: e.target.value})} required className="admin-form-field" />
                  <input type="text" placeholder="Двигатель" value={formData.engine} onChange={e => setFormData({...formData, engine: e.target.value})} required className="admin-form-field" />
                  <input type="text" placeholder="Оценка" value={formData.auctionGrade} onChange={e => setFormData({...formData, auctionGrade: e.target.value})} className="admin-form-field" />
                  <input type="text" placeholder="Локация" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="admin-form-field" />
                  <input type="text" placeholder="Цвет" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="admin-form-field" />
                  <input type="text" placeholder="Комплектация (через запятую)" value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} className="admin-form-field" />
                  <textarea rows="3" placeholder="Описание" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="admin-form-field admin-form-field-full"></textarea>
                </div>
                <div className="admin-form-buttons">
                  <button type="button" className="admin-btn-cancel" onClick={() => setShowForm(false)}>Отмена</button>
                  <button type="submit" className="admin-btn-save">Сохранить</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
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
                <td>{car.image ? <img src={car.image} className="admin-thumb" /> : '—'}</td>
                <td><strong>{car.title}</strong></td>
                <td>${car.price?.toLocaleString()}</td>
                <td>{car.year}</td>
                <td>{car.service}</td>
                <td className="admin-actions">
                  <button onClick={() => handleEdit(car)}>✏️</button>
                  <label>📷<input type="file" style={{display:'none'}} onChange={e => handleUploadImage(car.id, e.target.files[0])} /></label>
                  <button onClick={() => handleDelete(car.id)} style={{color:'#ef4444'}}>🗑️</button>
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