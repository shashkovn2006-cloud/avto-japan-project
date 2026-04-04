import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import ImageUploader from '../components/ImageUploader';
import ImageImporter from '../components/ImageImporter';
import DeliveryForm from '../components/DeliveryForm';
import './CarDetailPage.css';

const API_BASE = 'http://localhost:3001';

const CarDetailPage = () => {
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');
  const [showUploader, setShowUploader] = useState(false);
  const [showDelivery, setShowDelivery] = useState(false);  // ← ДОБАВЛЕНО
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const carId = window.location.pathname.split('/').pop();

  useEffect(() => { fetchCarDetails(); }, [carId]);

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/cars/${carId}`);
      setCar(response.data);
      setMainImage(response.data.image || '');
    } catch (error) { console.error('Ошибка:', error); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="app text-center"><div className="loader"></div><p>Загрузка...</p></div>;
  if (!car) return <div className="app text-center"><h2>Автомобиль не найден</h2><button onClick={() => window.location.href = '/'} className="btn-primary">На главную</button></div>;

  const galleryImages = car.images || car.gallery || [];
  const displayImages = galleryImages.length > 0 ? galleryImages : (car.image ? [car.image] : []);

  return (
    <div className="app fade-in">
      {/* Модальное окно доставки */}
      {showDelivery && (
        <DeliveryForm 
          car={car} 
          onClose={() => setShowDelivery(false)} 
          onSuccess={() => {
            setShowDelivery(false);
            alert('Заказ оформлен! Мы свяжемся с вами.');
          }}
        />
      )}

      <nav className="breadcrumbs">
        <button onClick={() => window.location.href = '/'}>Главная</button>
        <span> / </span>
        <button onClick={() => window.location.href = '/catalog'}>Каталог</button>
        <span> / </span>
        <span>{car.title}</span>
      </nav>
      
      <div className="container">
        <div className="car-detail-grid">
          <div className="car-gallery">
            <div className="main-image">
              {mainImage ? <img src={mainImage} alt={car.title} style={{ width: '100%', borderRadius: '15px' }} /> : <div className="image-placeholder-large"><i className="fas fa-car"></i></div>}
              <span className="auction-badge-large"><i className="fas fa-gavel"></i> Аукцион: {car.auctionGrade || '4.5'}/5</span>
            </div>
            {displayImages.length > 1 && (
              <div className="thumbnails-grid">
                {displayImages.map((img, idx) => (
                  <img key={idx} src={img} alt={`Фото ${idx + 1}`} className={`thumbnail ${mainImage === img ? 'active' : ''}`} onClick={() => setMainImage(img)} />
                ))}
              </div>
            )}
            {isAdmin && (
              <>
                <button className="btn-upload-toggle" onClick={() => setShowUploader(!showUploader)} style={{ marginTop: '20px', width: '100%' }}>
                  <i className="fas fa-images"></i> {showUploader ? 'Скрыть загрузчик' : 'Загрузить фото (Админ)'}
                </button>
                {showUploader && (
                  <>
                    <ImageUploader carId={carId} onUploadComplete={fetchCarDetails} />
                    <ImageImporter carId={carId} onImportComplete={fetchCarDetails} />
                  </>
                )}
              </>
            )}
          </div>
          
          <div className="car-detail-info">
            <div className="car-header">
              <h1>{car.title}</h1>
              <span className="service-badge"><i className="fas fa-store"></i> {car.service}</span>
            </div>
            
            <div className="price-section">
              <div className="price-info">
                <span className="price-label">Цена в Японии:</span>
                <span className="price-value">${(typeof car.price === 'string' ? parseInt(car.price) : car.price).toLocaleString()}</span>
              </div>
              <button onClick={() => window.location.href = '/calculator'} className="btn-accent">
                <i className="fas fa-calculator"></i> Рассчитать полную стоимость
              </button>
            </div>
            
            <div className="specs-section">
              <h3><i className="fas fa-list"></i> Характеристики</h3>
              <div className="specs-grid">
                <div className="spec-item"><span className="spec-label">Год выпуска:</span><span className="spec-value">{car.year}</span></div>
                <div className="spec-item"><span className="spec-label">Пробег:</span><span className="spec-value">{car.mileage}</span></div>
                <div className="spec-item"><span className="spec-label">Двигатель:</span><span className="spec-value">{car.engine}</span></div>
                <div className="spec-item"><span className="spec-label">Локация:</span><span className="spec-value">{car.location || 'Tokyo, Japan'}</span></div>
                <div className="spec-item"><span className="spec-label">Дата аукциона:</span><span className="spec-value">{car.auctionDate || '2024-01-15'}</span></div>
                <div className="spec-item"><span className="spec-label">Оценка:</span><span className="spec-value">{car.auctionGrade || '4.5'}/5</span></div>
              </div>
            </div>
            
            <div className="description-section">
              <h3><i className="fas fa-file-alt"></i> Описание</h3>
              <p>{car.description || `Автомобиль ${car.title} в отличном состоянии с японского аукциона.`}</p>
            </div>
            
            <div className="features-section">
              <h3><i className="fas fa-check-circle"></i> Комплектация</h3>
              <div className="features-list">
                {(car.features || ['Кондиционер', 'Электростеклоподъемники', 'Центральный замок', 'Музыкальная система']).map((feature, idx) => (
                  <div key={idx} className="feature-item"><i className="fas fa-check"></i> {feature}</div>
                ))}
              </div>
            </div>
            
            <div className="action-buttons">
              <button className="btn-primary"><i className="fas fa-heart"></i> В избранное</button>
              <button className="btn-accent" onClick={() => setShowDelivery(true)}>
                <i className="fas fa-shopping-cart"></i> Купить сейчас
              </button>
              <button className="btn-secondary"><i className="fas fa-envelope"></i> Консультация</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetailPage;