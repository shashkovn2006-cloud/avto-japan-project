import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Catalog.css';

const Catalog = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ minPrice: '', maxPrice: '', service: 'all', sortBy: 'year_desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchCars();
  }, [filters, searchTerm]);

  const fetchCars = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:3001/api/cars';
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.service && filters.service !== 'all') params.append('service', filters.service);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await axios.get(url);
      setCars(response.data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({ minPrice: '', maxPrice: '', service: 'all', sortBy: 'year_desc' });
    setCurrentPage(1);
    setTimeout(() => fetchCars(), 0);
  };

  const paginatedCars = cars.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(cars.length / itemsPerPage);

  if (loading) {
    return (
      <div className="catalog">
        <div className="container text-center">
          <div className="loader"></div>
          <p>Загрузка автомобилей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="catalog">
      <div className="container text-center">
        <h1>Каталог автомобилей из Японии</h1>
        <p className="text-secondary">Подборка лучших автомобилей с японских аукционов</p>
      </div>
      
      <div className="container">
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Поиск по марке или модели..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchCars()}
          />
          <button className="btn-accent" onClick={fetchCars}>
            🔍 Найти
          </button>
          <button className="btn-secondary" onClick={resetFilters}>
            Сбросить
          </button>
        </div>
        
        <div className="filters">
          <div className="filter-group">
            <label>Цена от ($)</label>
            <input type="number" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="0" />
          </div>
          <div className="filter-group">
            <label>Цена до ($)</label>
            <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="100000" />
          </div>
          <div className="filter-group">
            <label>Сервис</label>
            <select name="service" value={filters.service} onChange={handleFilterChange}>
              <option value="all">Все</option>
              <option value="carfromjapan.com">CarFromJapan</option>
              <option value="beforward.jp">BeForward</option>
              <option value="japan-partner.com">Japan Partner</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Сортировка</label>
            <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
              <option value="year_desc">Сначала новые</option>
              <option value="price_asc">Сначала дешевле</option>
              <option value="price_desc">Сначала дороже</option>
            </select>
          </div>
        </div>
      </div>

      {cars.length === 0 ? (
        <div className="container text-center">
          <h3>Автомобили не найдены</h3>
          <p className="text-secondary">Попробуйте изменить параметры поиска</p>
          <button className="btn-primary" onClick={resetFilters}>Сбросить фильтры</button>
        </div>
      ) : (
        <>
          <div className="container">
            <div className="results-header">
              <div>Найдено автомобилей: <strong>{cars.length}</strong></div>
              <div>Страница {currentPage} из {totalPages}</div>
            </div>

            <div className="cars-grid">
              {paginatedCars.map(car => (
                <div key={car.id} className="car-card">
                  <div className="car-image">
                    {car.image ? (
                      <img src={car.image} alt={car.title} />
                    ) : (
                      <div className="image-placeholder">
                        🚗
                      </div>
                    )}
                    <span className="car-badge">{car.service}</span>
                    <div className="auction-badge">
                      📊 {car.auctionGrade || '4.5'}/5
                    </div>
                  </div>
                  <div className="car-info">
                    <h3>{car.title}</h3>
                    <div className="car-details">
                      <span>📅 {car.year} год</span>
                      <span>🛣️ {car.mileage}</span>
                      <span>⚙️ {car.engine}</span>
                    </div>
                    <div className="car-price-section">
                      <div className="car-price">
                        <div className="price-label">Цена в Японии</div>
                        <div className="price-value">${(typeof car.price === 'string' ? parseInt(car.price) : car.price).toLocaleString()}</div>
                      </div>
                      <Link to={`/car/${car.id}`} className="btn-primary">
                        Подробнее →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="container">
              <div className="pagination">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>
                  ← Назад
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={currentPage === page ? 'active' : ''}>
                    {page}
                  </button>
                ))}
                {totalPages > 5 && <span>...</span>}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>
                  Вперед →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Catalog;