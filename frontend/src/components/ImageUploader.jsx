import { useState, useEffect } from 'react';
import axios from 'axios';
import './ImageUploader.css';

const API_BASE = 'http://localhost:3001';

const ImageUploader = ({ carId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [carImages, setCarImages] = useState([]);

  const fetchCarImages = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/cars/${carId}/images`);
      setCarImages(response.data.uploadedFiles || []);
    } catch (error) {
      console.error('Ошибка загрузки списка фото:', error);
    }
  };

  useEffect(() => {
    if (carId) fetchCarImages();
  }, [carId]);

  const handleMainUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    setProgress(0);
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await axios.post(`${API_BASE}/api/cars/${carId}/upload-main`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true, // Важно: отправляем cookies с токеном
        onUploadProgress: (progressEvent) => {
          setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      });
      setMessage('Основное фото загружено!');
      fetchCarImages();
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setMessage('Доступ запрещён. Требуются права администратора.');
      } else {
        setMessage('Ошибка загрузки: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setUploading(false);
      setProgress(0);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    setProgress(0);
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    
    try {
      const response = await axios.post(`${API_BASE}/api/cars/${carId}/upload-gallery`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      });
      setMessage(`Загружено ${files.length} фото в галерею!`);
      fetchCarImages();
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setMessage('Доступ запрещён. Требуются права администратора.');
      } else {
        setMessage('Ошибка загрузки: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setUploading(false);
      setProgress(0);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteImage = async (filename) => {
    if (!window.confirm('Удалить это фото?')) return;
    try {
      await axios.delete(`${API_BASE}/api/cars/${carId}/gallery/${filename}`, {
        withCredentials: true
      });
      setMessage('Фото удалено!');
      fetchCarImages();
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setMessage('Доступ запрещён. Требуются права администратора.');
      } else {
        setMessage('Ошибка удаления: ' + error.message);
      }
    }
  };

  const handleSetAsMain = async (filename) => {
    try {
      await axios.put(`${API_BASE}/api/cars/${carId}/set-main/${filename}`, {}, {
        withCredentials: true
      });
      setMessage('Фото установлено как основное!');
      fetchCarImages();
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setMessage('Доступ запрещён. Требуются права администратора.');
      } else {
        setMessage('Ошибка: ' + error.message);
      }
    }
  };

  return (
    <div className="image-uploader">
      <h3>Управление фотографиями (Админ-панель)</h3>
      
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          <span>Загрузка: {progress}%</span>
        </div>
      )}
      
      {message && (
        <div className={`message ${message.includes('Ошибка') || message.includes('Доступ') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
      <div className="upload-section">
        <h4>Основное фото</h4>
        <label className="upload-btn">
          <i className="fas fa-camera"></i> Выбрать основное фото
          <input type="file" accept="image/*" onChange={handleMainUpload} disabled={uploading} hidden />
        </label>
      </div>
      
      <div className="upload-section">
        <h4>Галерея фото</h4>
        <label className="upload-btn">
          <i className="fas fa-images"></i> Выбрать несколько фото
          <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} disabled={uploading} hidden />
        </label>
      </div>
      
      {carImages.length > 0 && (
        <div className="images-list">
          <h4>Загруженные фото ({carImages.length})</h4>
          <div className="images-grid">
            {carImages.map((img, index) => (
              <div key={index} className="image-item">
                <img src={`${API_BASE}${img.url}`} alt={`Фото ${index + 1}`} />
                <div className="image-actions">
                  <span className="image-name">{img.filename}</span>
                  {img.isMain && <span className="main-badge">Основное</span>}
                  <div className="action-buttons">
                    {!img.isMain && (
                      <button onClick={() => handleSetAsMain(img.filename)} className="btn-set-main" title="Сделать основным">
                        <i className="fas fa-star"></i>
                      </button>
                    )}
                    <button onClick={() => handleDeleteImage(img.filename)} className="btn-delete" title="Удалить">
                      <i className="fas fa-trash"></i>
                    </button>
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

export default ImageUploader;