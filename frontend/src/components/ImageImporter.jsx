import { useState } from 'react';
import axios from 'axios';
import './ImageImporter.css';

const API_BASE = 'http://localhost:3001';

const ImageImporter = ({ carId, onImportComplete }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [message, setMessage] = useState('');

  const handlePreview = async () => {
    if (!url) {
      setMessage('Введите URL страницы');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/admin/preview-images`, 
        { pageUrl: url },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setPreviewImages(response.data.images);
        setMessage(`Найдено ${response.data.total} изображений`);
      }
    } catch (error) {
      setMessage('Ошибка: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!url) {
      setMessage('Введите URL страницы');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/admin/import-images`,
        { pageUrl: url, carId: carId },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setMessage(response.data.message);
        setPreviewImages([]);
        setUrl('');
        if (onImportComplete) onImportComplete();
      } else {
        setMessage(response.data.message || 'Ошибка импорта');
      }
    } catch (error) {
      setMessage('Ошибка: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-importer">
      <h4><i className="fas fa-globe"></i> Импорт фото с другого сайта</h4>
      
      <div className="importer-input-group">
        <input
          type="url"
          placeholder="Введите URL страницы с фото (например, https://auction.japan/car/123)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button onClick={handlePreview} disabled={loading} className="btn-secondary">
          <i className="fas fa-search"></i> Предпросмотр
        </button>
        <button onClick={handleImport} disabled={loading} className="btn-accent">
          <i className="fas fa-download"></i> Импортировать
        </button>
      </div>
      
      {loading && <div className="loader-small"></div>}
      
      {message && (
        <div className={`importer-message ${message.includes('Ошибка') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
      {previewImages.length > 0 && (
        <div className="preview-grid">
          <p><strong>Предпросмотр найденных фото (первые 10):</strong></p>
          <div className="preview-images">
            {previewImages.slice(0, 10).map((img, idx) => (
              <img key={idx} src={img} alt={`Preview ${idx+1}`} onError={(e) => e.target.style.display = 'none'} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageImporter;