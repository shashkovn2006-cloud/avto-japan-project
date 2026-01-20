// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Главная страница
function HomePage() {
  return (
    <div className="app fade-in">
      <header className="header">
        <h1><i className="fas fa-car"></i> AutoJapan Pro</h1>
        <p>Прямые поставки автомобилей с японских аукционов</p>
        
        <div className="hero-buttons">
          <a href="/catalog" className="btn-primary">
            <i className="fas fa-car"></i> Смотреть каталог
          </a>
          <a href="/calculator" className="btn-secondary">
            <i className="fas fa-calculator"></i> Калькулятор стоимости
          </a>
        </div>
      </header>

      <div className="container">
        <h2>Почему выбирают нас</h2>
        <div className="features">
          <div className="feature">
            <i className="fas fa-shipping-fast"></i>
            <h3>Быстрая доставка</h3>
            <p>От 30 дней от аукциона до вашего города</p>
          </div>
          <div className="feature">
            <i className="fas fa-shield-alt"></i>
            <h3>Гарантия качества</h3>
            <p>Только проверенные автомобили</p>
          </div>
          <div className="feature">
            <i className="fas fa-calculator"></i>
            <h3>Прозрачный расчет</h3>
            <p>Все расходы включены в стоимость</p>
          </div>
          <div className="feature">
            <i className="fas fa-headset"></i>
            <h3>Поддержка 24/7</h3>
            <p>Консультации на всех этапах покупки</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Страница каталога
function CatalogPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    service: 'all',
    sortBy: 'year_desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchCars();
  }, [currentPage, filters]);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/cars');
      let filteredCars = response.data;
      
      // Фильтрация
      if (searchTerm) {
        filteredCars = filteredCars.filter(car => 
          car.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (filters.minPrice) {
        filteredCars = filteredCars.filter(car => car.price >= parseInt(filters.minPrice));
      }
      
      if (filters.maxPrice) {
        filteredCars = filteredCars.filter(car => car.price <= parseInt(filters.maxPrice));
      }
      
      if (filters.service && filters.service !== 'all') {
        filteredCars = filteredCars.filter(car => car.service === filters.service);
      }
      
      // Сортировка
      if (filters.sortBy === 'price_asc') {
        filteredCars.sort((a, b) => a.price - b.price);
      } else if (filters.sortBy === 'price_desc') {
        filteredCars.sort((a, b) => b.price - a.price);
      } else if (filters.sortBy === 'year_desc') {
        filteredCars.sort((a, b) => b.year - a.year);
      }
      
      setCars(filteredCars);
      setTotalPages(Math.ceil(filteredCars.length / itemsPerPage));
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCars();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      minPrice: '',
      maxPrice: '',
      service: 'all',
      sortBy: 'year_desc'
    });
    setCurrentPage(1);
    fetchCars();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Получаем автомобили для текущей страницы
  const paginatedCars = cars.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="app fade-in">
      {/* Заголовок */}
      <div className="container text-center">
        <h1>Каталог автомобилей из Японии</h1>
        <p className="text-secondary">Подборка лучших автомобилей с японских аукционов</p>
      </div>

      {/* Поиск и фильтры */}
      <div className="container">
        <form onSubmit={handleSearch} className="filters-form">
          <div className="search-container">
            <input
              type="text"
              placeholder="Поиск по марке или модели..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn-accent">
              <i className="fas fa-search"></i> Найти
            </button>
            <button type="button" onClick={resetFilters} className="btn-secondary">
              Сбросить
            </button>
          </div>

          <div className="filters">
            <div className="filter-group">
              <label>Цена от ($)</label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="0"
              />
            </div>
            
            <div className="filter-group">
              <label>Цена до ($)</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="100000"
              />
            </div>
            
            <div className="filter-group">
              <label>Сервис</label>
              <select
                name="service"
                value={filters.service}
                onChange={handleFilterChange}
              >
                <option value="all">Все сервисы</option>
                <option value="carfromjapan.com">CarFromJapan</option>
                <option value="beforward.jp">BeForward</option>
                <option value="japan-partner.com">Japan Partner</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Сортировка</label>
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
              >
                <option value="year_desc">Сначала новые</option>
                <option value="price_asc">Сначала дешевле</option>
                <option value="price_desc">Сначала дороже</option>
                <option value="mileage_asc">Меньший пробег</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Результаты */}
      {loading ? (
        <div className="container text-center">
          <div className="loader"></div>
          <p className="loading">Загрузка автомобилей...</p>
        </div>
      ) : paginatedCars.length === 0 ? (
        <div className="container text-center">
          <i className="fas fa-car" style={{ fontSize: '60px', color: 'var(--accent)', marginBottom: '20px' }}></i>
          <h3>Автомобили не найдены</h3>
          <p className="text-secondary">Попробуйте изменить параметры поиска</p>
        </div>
      ) : (
        <>
          <div className="container">
            <div className="results-header">
              <div>
                Найдено автомобилей: <span className="text-accent">{cars.length}</span>
              </div>
              <div className="text-secondary">
                Страница {currentPage} из {totalPages}
              </div>
            </div>

            <div className="cars-grid">
              {paginatedCars.map(car => (
                <div 
                  key={car.id} 
                  className="car-card hover-lift"
                  onClick={() => window.location.href = `/car/${car.id}`}
                >
                  <div className="car-image">
                    <div className="image-placeholder">
                      <i className="fas fa-car"></i>
                    </div>
                    <span className="car-badge">{car.service}</span>
                    <div className="auction-badge">
                      <i className="fas fa-gavel"></i>
                      {car.auctionGrade || '4.5'}/5
                    </div>
                  </div>

                  <div className="car-info">
                    <h3>{car.title}</h3>
                    
                    <div className="car-details">
                      <span>
                        <i className="fas fa-calendar"></i>
                        {car.year} год
                      </span>
                      <span>
                        <i className="fas fa-road"></i>
                        {car.mileage}
                      </span>
                      <span>
                        <i className="fas fa-gas-pump"></i>
                        {car.engine}
                      </span>
                      <span>
                        <i className="fas fa-map-marker-alt"></i>
                        Япония
                      </span>
                    </div>

                    <div className="car-price-section">
                      <div className="car-price">
                        <div className="price-label">Цена в Японии</div>
                        <div className="price-value">${car.price.toLocaleString()}</div>
                      </div>
                      
                      <button 
                        className="btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/car/${car.id}`;
                        }}
                      >
                        <i className="fas fa-eye"></i> Подробнее
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="container">
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-chevron-left"></i> Назад
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={currentPage === page ? 'active' : ''}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Вперед <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Страница деталей автомобиля
function CarDetailPage() {
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');

  const carId = window.location.pathname.split('/').pop();

  useEffect(() => {
    fetchCarDetails();
  }, []);

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/cars/${carId}`);
      setCar(response.data);
      setMainImage(response.data.image || '');
    } catch (error) {
      console.error('Ошибка загрузки деталей:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app text-center">
        <div className="loader"></div>
        <p className="loading">Загрузка данных автомобиля...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="app text-center">
        <h2>Автомобиль не найден</h2>
        <button 
          onClick={() => window.location.href = '/'}
          className="btn-primary mt-20"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  const galleryImages = [
    'https://images.unsplash.com/photo-1599912027806-cfec9f5944b6?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621330396175-92a4348e1eb8?w=800&auto=format&fit=crop'
  ];

  return (
    <div className="app fade-in">
      {/* Навигация */}
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

      <div className="container">
        <div className="car-detail-grid">
          {/* Левая колонка */}
          <div className="car-gallery">
            <div className="main-image">
              <div className="image-placeholder-large">
                <i className="fas fa-car"></i>
              </div>
              <span className="auction-badge-large">
                <i className="fas fa-gavel"></i> 
                Аукцион: {car.auctionGrade || '4.5'}/5
              </span>
            </div>
            
            {/* Галерея миниатюр */}
            <div className="thumbnails-grid">
              {galleryImages.map((img, index) => (
                <img 
                  key={index}
                  src={img}
                  alt={`${car.title} - фото ${index + 1}`}
                  className={`thumbnail ${mainImage === img ? 'active' : ''}`}
                  onClick={() => setMainImage(img)}
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/100x70/ff6b6b/ffffff?text=Photo+${index + 1}`;
                  }}
                />
              ))}
            </div>
          </div>

          {/* Правая колонка */}
          <div className="car-detail-info">
            <div className="car-header">
              <h1>{car.title}</h1>
              <span className="service-badge">
                <i className="fas fa-store"></i> {car.service}
              </span>
            </div>

            <div className="price-section">
              <div className="price-info">
                <span className="price-label">Цена в Японии:</span>
                <span className="price-value">${car.price.toLocaleString()}</span>
              </div>
              <button 
                onClick={() => window.location.href = '/calculator'}
                className="btn-accent"
              >
                <i className="fas fa-calculator"></i> 
                Рассчитать полную стоимость
              </button>
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
                <div className="spec-item">
                  <span className="spec-label">Локация:</span>
                  <span className="spec-value">{car.location || 'Tokyo, Japan'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Дата аукциона:</span>
                  <span className="spec-value">{car.auctionDate || '2024-01-15'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Оценка:</span>
                  <span className="spec-value">{car.auctionGrade || '4.5'}/5</span>
                </div>
              </div>
            </div>

            {/* Описание */}
            <div className="description-section">
              <h3><i className="fas fa-file-alt"></i> Описание</h3>
              <p>
                {car.description || `Автомобиль ${car.title} в отличном состоянии с японского аукциона. Полностью исправен, без ДТП. Идеальный вариант для комфортной езды по городу.`}
              </p>
            </div>

            {/* Кнопки действий */}
            <div className="action-buttons">
              <button className="btn-primary">
                <i className="fas fa-heart"></i> В избранное
              </button>
              <button className="btn-accent">
                <i className="fas fa-shopping-cart"></i> Купить сейчас
              </button>
              <button className="btn-secondary">
                <i className="fas fa-envelope"></i> Запросить консультацию
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Страница калькулятора
function CalculatorPage() {
  const [calcData, setCalcData] = useState({
    price: '',
    engineType: 'petrol',
    engineVolume: '2.0'
  });
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCalcData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateCustoms = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:3001/api/calculate', calcData);
      setCalculation(response.data);
    } catch (error) {
      console.error('Ошибка расчета:', error);
      alert('Ошибка расчета. Проверьте введенные данные.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app fade-in">
      <div className="container text-center">
        <h1>Калькулятор стоимости</h1>
        <p className="text-secondary">Рассчитайте полную стоимость ввоза автомобиля из Японии</p>
      </div>

      <div className="calculator-section">
        <div className="calculator">
          <div className="input-group">
            <label>Стоимость авто в Японии ($)</label>
            <input 
              type="number" 
              name="price"
              value={calcData.price}
              onChange={handleInputChange}
              placeholder="Например: 20000"
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
              <option value="electric">Электрический</option>
            </select>
          </div>
          
          <div className="input-group">
            <label>Объем двигателя (л)</label>
            <input 
              type="number" 
              name="engineVolume"
              value={calcData.engineVolume}
              onChange={handleInputChange}
              placeholder="Например: 2.0"
              step="0.1"
              min="0.5"
              max="6.0"
            />
          </div>
          
          <button 
            onClick={calculateCustoms}
            className="btn-calculate"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Расчет...
              </>
            ) : (
              <>
                <i className="fas fa-calculator"></i> Рассчитать
              </>
            )}
          </button>
          
          {calculation && (
            <div className="calculation-result">
              <h3>Результаты расчета</h3>
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
                  <span>ИТОГО к оплате:</span>
                  <span>${calculation.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Главный App компонент
function App() {
  return (
    <Router>
      <div className="app-wrapper">
        {/* Навигация */}
        <nav className="navbar">
          <div className="nav-content">
            <a href="/" className="logo">
              <i className="fas fa-car"></i>
              Auto<span className="text-gradient">Japan</span><span className="text-accent">Pro</span>
            </a>
            
            <div className="nav-links">
              <a href="/" className="nav-link">Главная</a>
              <a href="/catalog" className="nav-link">Каталог</a>
              <a href="/calculator" className="nav-link">Калькулятор</a>
              <a href="#contacts" className="nav-link">Контакты</a>
            </div>
            
            <button className="btn-accent">
              <i className="fas fa-user"></i> Войти
            </button>
          </div>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/car/:id" element={<CarDetailPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
          </Routes>
        </main>

        {/* Футер */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-section">
              <h3>AutoJapan Pro</h3>
              <p>Прямые поставки автомобилей из Японии с 2010 года</p>
            </div>
            <div className="footer-section">
              <h3>Контакты</h3>
              <p><i className="fas fa-phone"></i> +7 (XXX) XXX-XX-XX</p>
              <p><i className="fas fa-envelope"></i> info@autojapan.pro</p>
            </div>
            <div className="footer-section">
              <h3>Мы в соцсетях</h3>
              <div className="social-links">
                <a href="#"><i className="fab fa-telegram"></i></a>
                <a href="#"><i className="fab fa-whatsapp"></i></a>
                <a href="#"><i className="fab fa-vk"></i></a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 AutoJapan Pro. Все права защищены.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;