import { useState, useEffect } from 'react';
import axios from 'axios';
import './CarDetailPage.css';
import ImageUploader from '../components/ImageUploader';

const CarDetailPage = () => {
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');
  const [calculation, setCalculation] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [calcData, setCalcData] = useState({
    price: '',
    engineType: 'petrol',
    engineVolume: '2.0'
  });

  const carId = window.location.pathname.split('/').pop();

  useEffect(() => {
    fetchCarDetails();
  }, [carId]);

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/cars/${carId}`);
      setCar(response.data);
      setMainImage(response.data.image || '');
      
      // Устанавливаем цену по умолчанию для калькулятора
      setCalcData(prev => ({
        ...prev,
        price: response.data.price.toString()
      }));
    } catch (error) {
      console.error('Ошибка загрузки деталей:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCustoms = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/calculate', calcData);
      setCalculation(response.data);
    } catch (error) {
      console.error('Ошибка расчета:', error);
      alert('Ошибка расчета. Проверьте введенные данные.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCalcData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageClick = (img) => {
    setMainImage(img);
  };

  if (loading) {
    return (
      <div className="car-detail-loading">
        <div className="loader"></div>
        <p>Загрузка данных автомобиля...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="car-detail-not-found">
        <h2>Автомобиль не найден</h2>
        <button 
          onClick={() => window.location.href = '/'}
          className="btn-primary"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className="car-detail-page">
      {/* Хлебные крошки */}
      <nav className="breadcrumbs">
        <button onClick={() => window.location.href = '/'}>
          Главная
        </button>
        <span> / </span>
        <button onClick={() => window.location.href = '/catalog'}>
          Каталог
        </button>
        <span> / </span>
        <span>{car.title}</span>
      </nav>

      <div className="car-detail-container">
        {/* Левая колонка - изображения */}
        <div className="car-gallery-section">
          <div className="main-image-container">
            <div className="main-image-wrapper">
              {mainImage ? (
                <img 
                  src={mainImage.startsWith('/') ? `http://localhost:3001${mainImage}` : mainImage}
                  alt={car.title}
                  className="main-car-image"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1599912027806-cfec9f5944b6?w=800&auto=format&fit=crop';
                  }}
                />
              ) : (
                <div className="image-placeholder">
                  <i className="fas fa-car"></i>
                  <span>Нет фото</span>
                </div>
              )}
              <span className="auction-badge-main">
                <i className="fas fa-gavel"></i> 
                Аукцион: {car.auctionGrade || '4.5'}/5
              </span>
            </div>
            
            {/* Галерея миниатюр */}
            {car.images && car.images.length > 0 && (
              <div className="thumbnails-grid">
                {car.images.map((img, index) => (
                  <img 
                    key={index}
                    src={img.startsWith('/') ? `http://localhost:3001${img}` : img}
                    alt={`${car.title} - фото ${index + 1}`}
                    className={`thumbnail ${mainImage === img ? 'active' : ''}`}
                    onClick={() => handleImageClick(img)}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100x70/ff6b6b/ffffff?text=Photo+Error';
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Админ панель для загрузки фото */}
          <div className="admin-upload-section">
            <button 
              className="btn-upload-toggle"
              onClick={() => setShowUploader(!showUploader)}
            >
              <i className="fas fa-images"></i> 
              {showUploader ? 'Скрыть загрузчик фото' : 'Загрузить фото'}
            </button>
            
            {showUploader && (
              <div className="uploader-wrapper">
                <ImageUploader 
                  carId={carId}
                  onUploadComplete={() => {
                    // Перезагружаем данные автомобиля
                    fetchCarDetails();
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка - детали */}
        <div className="car-info-section">
          <div className="car-header">
            <h1>{car.title}</h1>
            <span className="service-badge-large">
              <i className="fas fa-store"></i> {car.service}
            </span>
          </div>

          <div className="price-calculator-section">
            <div className="price-info">
              <div className="price-display">
                <span className="price-label">Цена в Японии:</span>
                <span className="price-value">${car.price.toLocaleString()}</span>
              </div>
              <button 
                onClick={() => setShowCalculator(!showCalculator)}
                className="btn-calc-toggle"
              >
                <i className="fas fa-calculator"></i> 
                {showCalculator ? 'Скрыть калькулятор' : 'Рассчитать полную стоимость'}
              </button>
            </div>

            {/* Калькулятор */}
            {showCalculator && (
              <div className="calculator-box">
                <h3><i className="fas fa-calculator"></i> Калькулятор стоимости</h3>
                <div className="calc-inputs">
                  <div className="input-group">
                    <label>Стоимость авто ($)</label>
                    <input
                      type="number"
                      name="price"
                      value={calcData.price}
                      onChange={handleInputChange}
                      placeholder="Введите цену"
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>Тип двигателя</label>
                    <select 
                      name="engineType" 
                      value={calcData.engineType}
                      onChange={handleInputChange}
                    >
                      <option value="petrol">Бензин</option>
                      <option value="diesel">Дизель</option>
                      <option value="hybrid">Гибрид</option>
                      <option value="electric">Электро</option>
                    </select>
                  </div>
                  
                  <div className="input-group">
                    <label>Объем двигателя (л)</label>
                    <input
                      type="number"
                      name="engineVolume"
                      value={calcData.engineVolume}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0.5"
                      max="6.0"
                    />
                  </div>
                  
                  <button className="btn-calculate" onClick={calculateCustoms}>
                    Рассчитать
                  </button>
                </div>

                {calculation && (
                  <div className="calculation-result">
                    <h4>Расчет стоимости ввоза:</h4>
                    <div className="breakdown">
                      <div className="breakdown-item">
                        <span>Стоимость авто:</span>
                        <span>${calculation.price.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-item">
                        <span>Таможенная пошлина:</span>
                        <span>${calculation.customs.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-item">
                        <span>Акцизный сбор:</span>
                        <span>${calculation.excise.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-item">
                        <span>НДС (20%):</span>
                        <span>${calculation.vat.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-item">
                        <span>Утилизационный сбор:</span>
                        <span>${calculation.processingFee.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-item">
                        <span>Доставка из Японии:</span>
                        <span>${calculation.shipping.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-item total">
                        <span>ИТОГО:</span>
                        <span>${calculation.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Характеристики */}
          <div className="specs-section">
            <h3><i className="fas fa-list"></i> Характеристики</h3>
            <div className="specs-grid">
              <div className="spec-item">
                <span className="spec-label">Год выпуска:</span>
                <span className="spec-value">{car.year}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Пробег:</span>
                <span className="spec-value">{car.mileage}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Двигатель:</span>
                <span className="spec-value">{car.engine}</span>
              </div>
              {car.technicalSpecs && (
                <>
                  <div className="spec-item">
                    <span className="spec-label">Тип топлива:</span>
                    <span className="spec-value">{car.technicalSpecs.fuelType}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Коробка передач:</span>
                    <span className="spec-value">{car.technicalSpecs.transmission}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Привод:</span>
                    <span className="spec-value">{car.technicalSpecs.driveType}</span>
                  </div>
                </>
              )}
              {car.color && (
                <div className="spec-item">
                  <span className="spec-label">Цвет:</span>
                  <span className="spec-value">{car.color}</span>
                </div>
              )}
              <div className="spec-item">
                <span className="spec-label">Локация:</span>
                <span className="spec-value">{car.location || 'Tokyo, Japan'}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Дата аукциона:</span>
                <span className="spec-value">{car.auctionDate || '2024-01-15'}</span>
              </div>
            </div>
          </div>

          {/* Дополнительные детали */}
          {car.technicalSpecs && (
            <div className="additional-specs">
              <h3><i className="fas fa-cogs"></i> Дополнительные характеристики</h3>
              <div className="additional-grid">
                <div className="additional-item">
                  <i className="fas fa-users"></i>
                  <div>
                    <div className="additional-label">Количество мест</div>
                    <div className="additional-value">{car.technicalSpecs.seats || 5}</div>
                  </div>
                </div>
                <div className="additional-item">
                  <i className="fas fa-car"></i>
                  <div>
                    <div className="additional-label">Тип кузова</div>
                    <div className="additional-value">{car.technicalSpecs.bodyType || 'Седан'}</div>
                  </div>
                </div>
                {car.technicalSpecs.fuelType && (
                  <div className="additional-item">
                    <i className="fas fa-gas-pump"></i>
                    <div>
                      <div className="additional-label">Тип топлива</div>
                      <div className="additional-value">{car.technicalSpecs.fuelType}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Описание */}
          <div className="description-section">
            <h3><i className="fas fa-file-alt"></i> Описание</h3>
            <p>{car.description || `Автомобиль ${car.title} в отличном состоянии с японского аукциона. Полностью исправен, без ДТП. Идеальный вариант для комфортной езды по городу.`}</p>
          </div>

          {/* Комплектация */}
          <div className="features-section">
            <h3><i className="fas fa-check-circle"></i> Комплектация</h3>
            <div className="features-list">
              {(car.features || ['Кондиционер', 'Электростеклоподъемники', 'Центральный замок', 'Музыкальная система', 'Кожаный салон', 'Камера заднего вида']).map((feature, index) => (
                <div key={index} className="feature-item">
                  <i className="fas fa-check"></i> {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Отчет осмотра */}
          {car.inspectionReport && (
            <div className="inspection-section">
              <h3><i className="fas fa-clipboard-check"></i> Отчет осмотра</h3>
              <div className="inspection-grid">
                <div className="inspection-item">
                  <div className="inspection-category">Экстерьер</div>
                  <div className="inspection-rating">
                    <div className="stars">
                      {'★'.repeat(Math.floor(car.inspectionReport.exterior?.rating || 4))}
                      <span style={{opacity: 0.5}}>
                        {'★'.repeat(5 - Math.floor(car.inspectionReport.exterior?.rating || 4))}
                      </span>
                    </div>
                    <span className="rating-value">{car.inspectionReport.exterior?.rating || '4.5'}/5</span>
                  </div>
                  <div className="inspection-comment">
                    {car.inspectionReport.exterior?.comments || 'Незначительные следы эксплуатации'}
                  </div>
                </div>
                <div className="inspection-item">
                  <div className="inspection-category">Интерьер</div>
                  <div className="inspection-rating">
                    <div className="stars">
                      {'★'.repeat(Math.floor(car.inspectionReport.interior?.rating || 4.5))}
                      <span style={{opacity: 0.5}}>
                        {'★'.repeat(5 - Math.floor(car.inspectionReport.interior?.rating || 4.5))}
                      </span>
                    </div>
                    <span className="rating-value">{car.inspectionReport.interior?.rating || '4.8'}/5</span>
                  </div>
                  <div className="inspection-comment">
                    {car.inspectionReport.interior?.comments || 'Отличное состояние салона'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="action-buttons">
            <button className="btn-favorite">
              <i className="fas fa-heart"></i> Добавить в избранное
            </button>
            <button className="btn-consult">
              <i className="fas fa-envelope"></i> Запросить консультацию
            </button>
            <button className="btn-buy">
              <i className="fas fa-shopping-cart"></i> Начать покупку
            </button>
          </div>

          {/* Похожие автомобили (если есть в данных) */}
          {car.similarCars && car.similarCars.length > 0 && (
            <div className="similar-cars-section">
              <h3><i className="fas fa-car-side"></i> Похожие автомобили</h3>
              <div className="similar-cars-grid">
                {car.similarCars.map(similarCar => (
                  <div 
                    key={similarCar.id}
                    className="similar-car-card"
                    onClick={() => window.location.href = `/car/${similarCar.id}`}
                  >
                    <div className="similar-car-title">{similarCar.title}</div>
                    <div className="similar-car-price">${similarCar.price.toLocaleString()}</div>
                    <button className="btn-view-similar">Посмотреть</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarDetailPage;