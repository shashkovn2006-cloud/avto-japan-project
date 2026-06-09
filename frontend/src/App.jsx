import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import './App.css';
import CarDetailPage from './pages/CarDetailPage';
import MyOrdersPage from './pages/MyOrdersPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import { Toaster } from 'react-hot-toast';
import { useNotifications } from './hooks/useNotifications';

const API_BASE = 'http://localhost:3001';
const AuthContext = createContext();

// Хук для использования авторизации
export const useAuth = () => useContext(AuthContext);

// Компонент защиты маршрутов
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loader"></div>;
  
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  
  return children;
};

// Компонент входа/регистрации
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email, password } : { email, password, name };
      
      const response = await axios.post(`${API_BASE}${endpoint}`, payload, {
        withCredentials: true
      });
      
      if (response.data.success) {
        if (isLogin) {
          login(response.data.user);
          window.location.href = '/';
        } else {
          setSuccess('Регистрация успешна! Теперь войдите в аккаунт.');
          setIsLogin(true);
          setEmail('');
          setPassword('');
          setName('');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon">
            <i className="fas fa-car"></i>
          </div>
          <h2>{isLogin ? 'Добро пожаловать!' : 'Создать аккаунт'}</h2>
          <p>{isLogin ? 'Войдите, чтобы продолжить' : 'Зарегистрируйтесь для покупки авто'}</p>
        </div>
        
        {error && (
          <div className="auth-error">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}
        
        {success && (
          <div className="auth-success">
            <i className="fas fa-check-circle"></i>
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="auth-input-group">
              <label><i className="fas fa-user"></i> Имя</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Введите ваше имя"
                required 
              />
            </div>
          )}
          
          <div className="auth-input-group">
            <label><i className="fas fa-envelope"></i> Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="example@mail.com"
              required 
            />
          </div>
          
          <div className="auth-input-group">
            <label><i className="fas fa-lock"></i> Пароль</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>
          
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Загрузка...</>
            ) : (
              <><i className={`fas ${isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'}`}></i> {isLogin ? 'Войти' : 'Зарегистрироваться'}</>
            )}
          </button>
        </form>
        
        <div className="auth-switch">
          <p>
            {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
            <button onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
            }}>
              {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </div>
        
        <div className="auth-test-accounts">
          <p><i className="fas fa-info-circle"></i> Тестовые аккаунты:</p>
          <div className="accounts-list">
            <div className="account-item">
              <span>👑 Админ:</span> admin@auto.pro / 1
            </div>
            <div className="account-item">
              <span>👤 Пользователь:</span> user@auto.pro / 2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Главная страница
function HomePage() {
  const { user } = useAuth();
  
  return (
    <div className="app fade-in">
      <header className="header">
        <h1><i className="fas fa-car"></i> AutoJapan Pro</h1>
        <p>Прямые поставки автомобилей с японских аукционов</p>
        {user && <p style={{ color: 'var(--success)' }}>Добро пожаловать, {user.name}!</p>}
        <div className="hero-buttons">
          <a href="/catalog" className="btn-primary"><i className="fas fa-car"></i> Смотреть каталог</a>
          <a href="/calculator" className="btn-secondary"><i className="fas fa-calculator"></i> Калькулятор стоимости</a>
        </div>
      </header>
      <div className="container">
        <h2>Почему выбирают нас</h2>
        <div className="features">
          <div className="feature"><i className="fas fa-shipping-fast"></i><h3>Быстрая доставка</h3><p>От 30 дней от аукциона до вашего города</p></div>
          <div className="feature"><i className="fas fa-shield-alt"></i><h3>Гарантия качества</h3><p>Только проверенные автомобили</p></div>
          <div className="feature"><i className="fas fa-calculator"></i><h3>Прозрачный расчет</h3><p>Все расходы включены в стоимость</p></div>
          <div className="feature"><i className="fas fa-headset"></i><h3>Поддержка 24/7</h3><p>Консультации на всех этапах покупки</p></div>
        </div>
      </div>
    </div>
  );
}

// Страница каталога
function CatalogPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceInput, setPriceInput] = useState({ minPrice: '', maxPrice: '' });
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
      if (params.toString()) url += '?' + params.toString();
      const response = await axios.get(url);
      setCars(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handlePriceInputChange = (e) => {
    const { name, value } = e.target;
    setPriceInput(prev => ({ ...prev, [name]: value }));
  };

  const applyPriceFilter = () => {
    setFilters(prev => ({ ...prev, minPrice: priceInput.minPrice, maxPrice: priceInput.maxPrice }));
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setPriceInput({ minPrice: '', maxPrice: '' });
    setFilters({ minPrice: '', maxPrice: '', service: 'all', sortBy: 'year_desc' });
    setCurrentPage(1);
    setTimeout(() => fetchCars(), 0);
  };

  const paginatedCars = cars.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(cars.length / itemsPerPage);

  if (loading) {
    return (
      <div className="app">
        <div className="container text-center">
          <div className="loader"></div>
          <p>Загрузка автомобилей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app fade-in">
      <div className="container text-center">
        <h1>Каталог автомобилей из Японии</h1>
        <p className="text-secondary">Подборка лучших автомобилей с японских аукционов</p>
      </div>
      <div className="container">
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Поиск по марке или модели..." 
            value={searchInput} 
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="btn-accent" onClick={handleSearch}>
            <i className="fas fa-search"></i> Найти
          </button>
          <button className="btn-secondary" onClick={resetFilters}>
            Сбросить
          </button>
        </div>
        <div className="filters">
          <div className="filter-group">
            <label>Цена от ($)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="number" 
                name="minPrice" 
                value={priceInput.minPrice} 
                onChange={handlePriceInputChange} 
                placeholder="0" 
              />
              <button className="btn-small" onClick={applyPriceFilter}>ОК</button>
            </div>
          </div>
          <div className="filter-group">
            <label>Цена до ($)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="number" 
                name="maxPrice" 
                value={priceInput.maxPrice} 
                onChange={handlePriceInputChange} 
                placeholder="100000" 
              />
              <button className="btn-small" onClick={applyPriceFilter}>ОК</button>
            </div>
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
          <i className="fas fa-car" style={{ fontSize: '60px', color: 'var(--accent)', marginBottom: '20px' }}></i>
          <h3>Автомобили не найдены</h3>
          <p className="text-secondary">Попробуйте изменить параметры поиска</p>
          <button className="btn-primary" onClick={resetFilters}>Сбросить фильтры</button>
        </div>
      ) : (
        <>
          <div className="container">
            <div className="results-header">
              <div>Найдено автомобилей: <span className="text-accent">{cars.length}</span></div>
              <div className="text-secondary">Страница {currentPage} из {totalPages}</div>
            </div>
            <div className="cars-grid">
              {paginatedCars.map(car => (
                <div key={car.id} className="car-card hover-lift" onClick={() => window.location.href = `/car/${car.id}`}>
                  <div className="car-image">
                    {car.image ? <img src={car.image} alt={car.title} /> : <div className="image-placeholder"><i className="fas fa-car"></i></div>}
                    <span className="car-badge">{car.service}</span>
                    <div className="auction-badge"><i className="fas fa-gavel"></i>{car.auctionGrade || '4.5'}/5</div>
                  </div>
                  <div className="car-info">
                    <h3>{car.title}</h3>
                    <div className="car-details">
                      <span><i className="fas fa-calendar"></i>{car.year} год</span>
                      <span><i className="fas fa-road"></i>{car.mileage}</span>
                      <span><i className="fas fa-gas-pump"></i>{car.engine}</span>
                    </div>
                    <div className="car-price-section">
                      <div className="car-price">
                        <div className="price-label">Цена в Японии</div>
                        <div className="price-value">${(typeof car.price === 'string' ? parseInt(car.price) : car.price).toLocaleString()}</div>
                      </div>
                      <button className="btn-primary" onClick={(e) => { e.stopPropagation(); window.location.href = `/car/${car.id}`; }}>Подробнее</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {totalPages > 1 && (
            <div className="container">
              <div className="pagination">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>← Назад</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => <button key={page} onClick={() => setCurrentPage(page)} className={currentPage === page ? 'active' : ''}>{page}</button>)}
                {totalPages > 5 && <span>...</span>}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>Вперед →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Страница калькулятора
function CalculatorPage() {
  const [calcData, setCalcData] = useState({ price: '', engineType: 'petrol', engineVolume: '2.0' });
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateCustoms = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/api/calculate`, calcData);
      setCalculation(response.data);
    } catch (error) { alert('Ошибка расчета'); }
    finally { setLoading(false); }
  };

  return (
    <div className="app fade-in">
      <div className="container text-center"><h1>Калькулятор стоимости</h1><p>Рассчитайте полную стоимость ввоза автомобиля из Японии</p></div>
      <div className="calculator-section"><div className="calculator">
        <div className="input-group"><label>Стоимость авто ($)</label><input type="number" name="price" value={calcData.price} onChange={(e) => setCalcData({...calcData, price: e.target.value})} placeholder="20000" /></div>
        <div className="input-group"><label>Тип двигателя</label><select name="engineType" value={calcData.engineType} onChange={(e) => setCalcData({...calcData, engineType: e.target.value})}><option value="petrol">Бензин</option><option value="diesel">Дизель</option><option value="hybrid">Гибрид</option><option value="electric">Электрический</option></select></div>
        <div className="input-group"><label>Объем двигателя (л)</label><input type="number" name="engineVolume" value={calcData.engineVolume} onChange={(e) => setCalcData({...calcData, engineVolume: e.target.value})} step="0.1" /></div>
        <button onClick={calculateCustoms} className="btn-calculate" disabled={loading}>{loading ? "Расчет..." : "Рассчитать"}</button>
        {calculation && (<div className="calculation-result"><h3>Результаты расчета</h3><div className="breakdown"><div className="breakdown-item"><span>Стоимость авто:</span><span>${calculation.price.toLocaleString()}</span></div><div className="breakdown-item"><span>Таможенная пошлина:</span><span>${calculation.customs.toLocaleString()}</span></div><div className="breakdown-item"><span>Акцизный сбор:</span><span>${calculation.excise.toLocaleString()}</span></div><div className="breakdown-item"><span>НДС (20%):</span><span>${calculation.vat.toLocaleString()}</span></div><div className="breakdown-item"><span>Утилизационный сбор:</span><span>${calculation.processingFee.toLocaleString()}</span></div><div className="breakdown-item"><span>Доставка:</span><span>${calculation.shipping.toLocaleString()}</span></div><div className="breakdown-item total"><span>ИТОГО:</span><span>${calculation.total.toLocaleString()}</span></div></div></div>)}
      </div></div>
    </div>
  );
}

// Админка автомобилей (только для админов)
function AdminCarsPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', price: '', service: '', year: '', mileage: '', engine: '', 
    auctionGrade: '4.5', description: '', location: 'Tokyo, Japan', color: '', features: [] 
  });

  useEffect(() => { fetchCars(); }, []);

  const fetchCars = async () => {
    try { 
      const res = await axios.get(`${API_BASE}/api/cars`); 
      setCars(res.data); 
    } catch (error) { console.error(error); } 
    finally { setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Удалить автомобиль?')) { 
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
    } catch (error) { alert('Ошибка сохранения'); }
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
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true
    });
    fetchCars();
  };

  if (loading) return <div className="container text-center"><div className="loader"></div><p>Загрузка...</p></div>;

  const containerStyle = { padding: '24px', maxWidth: '1400px', margin: '0 auto', background: '#f1f5f9', minHeight: '100vh' };
  const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' };
  const titleStyle = { fontSize: '28px', margin: 0, color: '#0f172a' };
  const addBtnStyle = { background: '#3b82f6', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' };
  const tableWrapperStyle = { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' };
  const tableStyle = { width: '100%', borderCollapse: 'collapse' };
  const thStyle = { padding: '12px 16px', textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' };
  const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#334155' };
  const thumbStyle = { width: '50px', height: '35px', objectFit: 'cover', borderRadius: '6px' };
  const actionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', margin: '0 5px' };
  const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const modalStyle = { background: 'white', borderRadius: '16px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' };
  const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' };
  const modalBodyStyle = { padding: '24px' };
  const formGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
  const inputStyle = { padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', width: '100%' };
  const fullWidthStyle = { gridColumn: 'span 2' };
  const buttonGroupStyle = { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' };
  const cancelBtnStyle = { background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer' };
  const saveBtnStyle = { background: '#3b82f6', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer' };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>🚗 Управление автомобилями</h1>
        <button style={addBtnStyle} onClick={() => { setEditingCar(null); setFormData({ title: '', price: '', service: '', year: '', mileage: '', engine: '', auctionGrade: '4.5', description: '', location: 'Tokyo, Japan', color: '', features: '' }); setShowForm(true); }}>
          + Добавить автомобиль
        </button>
      </div>

      {showForm && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{margin:0}}>{editingCar ? 'Редактировать автомобиль' : 'Новый автомобиль'}</h3>
              <button onClick={() => setShowForm(false)} style={{background:'none', border:'none', fontSize:'24px', cursor:'pointer'}}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={modalBodyStyle}>
                <div style={formGridStyle}>
                  <input type="text" placeholder="Название" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={inputStyle} />
                  <input type="number" placeholder="Цена ($)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required style={inputStyle} />
                  <input type="text" placeholder="Сервис" value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} required style={inputStyle} />
                  <input type="number" placeholder="Год" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required style={inputStyle} />
                  <input type="text" placeholder="Пробег" value={formData.mileage} onChange={e => setFormData({...formData, mileage: e.target.value})} required style={inputStyle} />
                  <input type="text" placeholder="Двигатель" value={formData.engine} onChange={e => setFormData({...formData, engine: e.target.value})} required style={inputStyle} />
                  <input type="text" placeholder="Оценка" value={formData.auctionGrade} onChange={e => setFormData({...formData, auctionGrade: e.target.value})} style={inputStyle} />
                  <input type="text" placeholder="Локация" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} style={inputStyle} />
                  <input type="text" placeholder="Цвет" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} style={inputStyle} />
                  <input type="text" placeholder="Комплектация (через запятую)" value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} style={inputStyle} />
                  <textarea rows="3" placeholder="Описание" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{...inputStyle, ...fullWidthStyle}}></textarea>
                </div>
                <div style={buttonGroupStyle}>
                  <button type="button" style={cancelBtnStyle} onClick={() => setShowForm(false)}>Отмена</button>
                  <button type="submit" style={saveBtnStyle}>Сохранить</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>ID</th><th style={thStyle}>Фото</th><th style={thStyle}>Название</th><th style={thStyle}>Цена</th><th style={thStyle}>Год</th><th style={thStyle}>Сервис</th><th style={thStyle}>Действия</th></tr>
          </thead>
          <tbody>
            {cars.map(car => (
              <tr key={car.id}>
                <td style={tdStyle}>{car.id}</td>
                <td style={tdStyle}>{car.image ? <img src={car.image} style={thumbStyle} /> : '—'}</td>
                <td style={tdStyle}><strong>{car.title}</strong></td>
                <td style={tdStyle}>${car.price?.toLocaleString()}</td>
                <td style={tdStyle}>{car.year}</td>
                <td style={tdStyle}>{car.service}</td>
                <td style={tdStyle}>
                  <button onClick={() => handleEdit(car)} style={actionBtnStyle} title="Редактировать">✏️</button>
                  <label style={actionBtnStyle} title="Загрузить фото">📷<input type="file" style={{display:'none'}} onChange={e => handleUploadImage(car.id, e.target.files[0])} /></label>
                  <button onClick={() => handleDelete(car.id)} style={{...actionBtnStyle, color:'#ef4444'}} title="Удалить">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Главный App с авторизацией
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useNotifications();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/auth/me`, { withCredentials: true });
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    await axios.post(`${API_BASE}/api/auth/logout`, {}, { withCredentials: true });
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      <Router>
        <div className="app-wrapper">
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--success)',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--accent)',
                  secondary: 'white',
                },
              },
            }}
          />
          <nav className="navbar">
            <div className="nav-content">
              <a href="/" className="logo">
                <i className="fas fa-car"></i>Auto<span className="text-gradient">Japan</span><span className="text-accent">Pro</span>
              </a>
              <div className="nav-links">
                <a href="/" className="nav-link">Главная</a>
                <a href="/catalog" className="nav-link">Каталог</a>
                <a href="/calculator" className="nav-link">Калькулятор</a>
                {user && user.role !== 'admin' && (
                  <a href="/my-orders" className="nav-link">
                    <i className="fas fa-truck"></i> Мои заказы
                  </a>
                )}
                {user?.role === 'admin' && (
                  <>
                    <a href="/admin/cars" className="nav-link">
                      <i className="fas fa-cog"></i> Управление авто
                    </a>
                    <a href="/admin/orders" className="nav-link">
                      <i className="fas fa-clipboard-list"></i> Заказы
                    </a>
                  </>
                )}
                {user && (
                  <a href="/favorites" className="nav-link">
                    <i className="fas fa-heart"></i> Избранное
                  </a>
                )}
              </div>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{user.name}</span>
                  <button onClick={logout} className="btn-secondary" style={{ padding: '8px 20px' }}>Выйти</button>
                </div>
              ) : (
                <a href="/login" className="btn-accent"><i className="fas fa-user"></i> Войти</a>
              )}
            </div>
          </nav>
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/car/:id" element={<CarDetailPage />} />
              <Route path="/calculator" element={<CalculatorPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/my-orders" element={
                <ProtectedRoute>
                  <MyOrdersPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/cars" element={
                <ProtectedRoute adminOnly={true}>
                  <AdminCarsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <ProtectedRoute adminOnly={true}>
                  <AdminOrdersPage />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
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
    </AuthContext.Provider>
  );
}

export default App;