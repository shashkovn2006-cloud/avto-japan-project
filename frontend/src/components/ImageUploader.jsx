import { useState } from 'react';
import axios from 'axios';
import './ImageUploader.css';

const ImageUploader = ({ carId, onUploadComplete }) => {
  const [mainImage, setMainImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [carImages, setCarImages] = useState([]);

  // Загрузка основной фотографии
  const handleMainUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    setProgress(0);
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await axios.post(
        `http://localhost:3001/api/cars/${carId}/upload-main`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percent);
          }
        }
      );
      
      setMessage('Основное фото загружено!');
      setMainImage(response.data.imageUrl);
      if (onUploadComplete) onUploadComplete();
      
      // Загружаем обновленный список фото
      fetchCarImages();
    } catch (error) {
      setMessage('Ошибка загрузки: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Загрузка нескольких фото в галерею
  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    setProgress(0);
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    
    try {
      const response = await axios.post(
        `http://localhost:3001/api/cars/${carId}/upload-gallery`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percent);
          }
        }
      );
      
      setMessage(`Загружено ${files.length} фото в галерею!`);
      setGalleryImages(prev => [...prev, ...response.data.images]);
      if (onUploadComplete) onUploadComplete();
      
      fetchCarImages();
    } catch (error) {
      setMessage('Ошибка загрузки: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Получение списка фото автомобиля
  const fetchCarImages = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/cars/${carId}/images`);
      setCarImages(response.data.uploadedFiles);
    } catch (error) {
      console.error('Ошибка загрузки списка фото:', error);
    }
  };

  // Удаление фото
  const handleDeleteImage = async (filename) => {
    if (!window.confirm('Удалить это фото?')) return;
    
    try {
      await axios.delete(`http://localhost:3001/api/cars/${carId}/gallery/${filename}`);
      setMessage('Фото удалено!');
      fetchCarImages();
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      setMessage('Ошибка удаления: ' + error.message);
    }
  };

  // Установка как основного
  const handleSetAsMain = async (filename) => {
    try {
      await axios.put(`http://localhost:3001/api/cars/${carId}/set-main/${filename}`);
      setMessage('Фото установлено как основное!');
      fetchCarImages();
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      setMessage('Ошибка: ' + error.message);
    }
  };

  // Загружаем фото при монтировании
  useState(() => {
    if (carId) {
      fetchCarImages();
    }
  }, [carId]);

  return (
    <div className="image-uploader">
      <h3>Управление фотографиями</h3>
      
      {/* Прогресс загрузки */}
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          <span>Загрузка: {progress}%</span>
        </div>
      )}
      
      {/* Сообщения */}
      {message && (
        <div className={`message ${message.includes('Ошибка') ? 'error' : 'success'}`}>
          {message}
          <button onClick={() => setMessage('')} className="close-btn">×</button>
        </div>
      )}
      
      {/* Загрузка основной фото */}
      <div className="upload-section">
        <h4>Основное фото</h4>
        <label className="upload-btn">
          <i className="fas fa-camera"></i> Выбрать основное фото
          <input
            type="file"
            accept="image/*"
            onChange={handleMainUpload}
            disabled={uploading}
            hidden
          />
        </label>
        <p className="upload-hint">Рекомендуемый размер: 800x600px</p>
      </div>
      
      {/* Загрузка галереи */}
      <div className="upload-section">
        <h4>Галерея фото</h4>
        <label className="upload-btn">
          <i className="fas fa-images"></i> Выбрать несколько фото
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryUpload}
            disabled={uploading}
            hidden
          />
        </label>
        <p className="upload-hint">Можно выбрать несколько файлов (макс. 10)</p>
      </div>
      
      {/* Список загруженных фото */}
      {carImages.length > 0 && (
        <div className="images-list">
          <h4>Загруженные фото ({carImages.length})</h4>
          <div className="images-grid">
            {carImages.map((img, index) => (
              <div key={index} className="image-item">
                <img 
                  src={`http://localhost:3001${img.url}`} 
                  alt={`Фото ${index + 1}`}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x150?text=Ошибка+загрузки';
                  }}
                />
                <div className="image-actions">
                  <span className="image-name">{img.filename}</span>
                  {img.isMain && <span className="main-badge">Основное</span>}
                  <div className="action-buttons">
                    {!img.isMain && (
                      <button 
                        onClick={() => handleSetAsMain(img.filename)}
                        className="btn-set-main"
                        title="Сделать основным"
                      >
                        <i className="fas fa-star"></i>
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteImage(img.filename)}
                      className="btn-delete"
                      title="Удалить"
                    >
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