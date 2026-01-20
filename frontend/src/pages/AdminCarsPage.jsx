import { useState, useEffect } from 'react';
import axios from 'axios';
import ImageUploader from '../components/ImageUploader';

const AdminCarsPage = () => {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  
  useEffect(() => {
    fetchCars();
  }, []);
  
  const fetchCars = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/cars');
      setCars(response.data);
    } catch (error) {
      console.error('Ошибка загрузки авто:', error);
    }
  };
  
  return (
    <div className="app">
      <div className="container">
        <h1>Управление автомобилями</h1>
        
        <div className="admin-grid">
          {/* Список авто */}
          <div className="cars-list">
            <h2>Все автомобили ({cars.length})</h2>
            {cars.map(car => (
              <div 
                key={car.id}
                className={`car-admin-item ${selectedCar?.id === car.id ? 'selected' : ''}`}
                onClick={() => setSelectedCar(car)}
              >
                <div className="car-admin-preview">
                  {car.image ? (
                    <img src={`http://localhost:3001${car.image}`} alt={car.title} />
                  ) : (
                    <div className="no-image">Нет фото</div>
                  )}
                </div>
                <div className="car-admin-info">
                  <h3>{car.title}</h3>
                  <p>Цена: ${car.price}</p>
                  <p>Год: {car.year}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Загрузчик фото для выбранного авто */}
          <div className="uploader-panel">
            {selectedCar ? (
              <>
                <h2>Фото для: {selectedCar.title}</h2>
                <ImageUploader 
                  carId={selectedCar.id}
                  onUploadComplete={fetchCars}
                />
              </>
            ) : (
              <div className="select-car-prompt">
                <i className="fas fa-car" style={{ fontSize: '60px', color: '#666' }}></i>
                <p>Выберите автомобиль для загрузки фото</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};