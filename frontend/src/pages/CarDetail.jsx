// frontend/src/pages/CarDetail/CarDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CarDetail.css';

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculation, setCalculation] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcData, setCalcData] = useState({
    price: '',
    engineType: 'petrol',
    engineVolume: '2.0'
  });

  useEffect(() => {
    fetchCarDetails();
  }, [id]);

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/cars/${id}`);
      setCar(response.data);
      
      // Устанавливаем цену по умолчанию для калькулятора
      setCalcData(prev => ({
        ...prev,
        price: response.data.price.toString()
      }));
    } catch (error) {
      console.error('Ошибка загрузки деталей:', error);
      navigate('/'); // Редирект на главную при ошибке
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
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCalcData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Загрузка данных автомобиля...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="not-found">
        <h2>Автомобиль не найден</h2>
        <button onClick={() => navigate('/')}>Вернуться на главную</button>
      </div>
    );
  }

  return (
    <div className="car-detail-page">
      {/* Хлебные крошки */}
      <nav className="breadcrumbs">
        <button onClick={() => navigate('/')}>Главная</button>
        <span> / </span>
        <button onClick={() => navigate('/catalog')}>Каталог</button>
        <span> / </span>
        <span>{car.title}</span>
      </nav>

      {/* Основная информация */}
      <div className="car-detail-container">
        {/* Левая колонка - изображения */}
        <div className="car-gallery">
          <div className="main-image">
            <img src={car.image} alt={car.title} />
            <span className="auction-badge">
              <i className="fas fa-gavel"></i> Аукцион: {car.auctionGrade}/5
            </span>
          </div>
          <div className="thumbnails">
            <img src={`https://via.placeholder.com/100x70?text=${car.title}+1`} alt="Вид 1" />
            <img src={`https://via.placeholder.com/100x70?text=${car.title}+2`} alt="Вид 2" />
            <img src={`https://via.placeholder.com/100x70?text=${car.title}+3`} alt="Вид 3" />
            <img src={`https://via.placeholder.com/100x70?text=${car.title}+4`} alt="Вид 4" />
          </div>
        </div>

        {/* Правая колонка - детали */}
        <div className="car-info">
          <div className="car-header">
            <h1>{car.title}</h1>
            <div className="service-badge">
              <i className="fas fa-store"></i> {car.service}
            </div>
          </div>

          <div className="car-price-section">
            <div className="price">
              <span className="label">Цена в Японии:</span>
              <span className="value">${car.price.toLocaleString()}</span>
            </div>
            <button 
              className="btn-calc-toggle"
              onClick={() => setShowCalculator(!showCalculator)}
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

          {/* Характеристики */}
          <div className="car-specs">
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
              <div className="spec-item">
                <span className="spec-label">Оценка аукциона:</span>
                <span className="spec-value">{car.auctionGrade}/5</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Локация:</span>
                <span className="spec-value">{car.location || 'Yokohama, Japan'}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Дата аукциона:</span>
                <span className="spec-value">{car.auctionDate || '2024-01-15'}</span>
              </div>
            </div>
          </div>

          {/* Описание */}
          <div className="car-description">
            <h3><i className="fas fa-file-alt"></i> Описание</h3>
            <p>{car.description || `Автомобиль ${car.title} в отличном состоянии с японского аукциона. Полностью исправен, без ДТП. Идеальный вариант для комфортной езды по городу.`}</p>
          </div>

          {/* Комплектация */}
          <div className="car-features">
            <h3><i className="fas fa-check-circle"></i> Комплектация</h3>
            <div className="features-list">
              {(car.features || ['Кондиционер', 'Кожаный салон', 'Камера заднего вида', 'Навигация', 'Круиз-контроль', 'Парктроники']).map((feature, index) => (
                <div key={index} className="feature-item">
                  <i className="fas fa-check"></i> {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="action-buttons">
            <button className="btn-primary">
              <i className="fas fa-heart"></i> Добавить в избранное
            </button>
            <button className="btn-secondary">
              <i className="fas fa-envelope"></i> Запросить информацию
            </button>
            <button className="btn-success">
              <i className="fas fa-shopping-cart"></i> Начать покупку
            </button>
          </div>
        </div>
      </div>

      {/* Похожие автомобили */}
      <div className="similar-cars">
        <h2>Похожие автомобили</h2>
        <div className="similar-grid">
          {/* Здесь будут карточки похожих авто */}
          <p>Похожие автомобили будут загружены...</p>
        </div>
      </div>
    </div>
  );
};

export default CarDetail;