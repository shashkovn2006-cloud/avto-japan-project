import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Catalog.css';

const Catalog = () => {
  const [cars, setCars] = useState([]);
  
  useEffect(() => {
    fetchCars();
  }, []);
  
  const fetchCars = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/cars');
      setCars(response.data);
    } catch (error) {
      console.error('Ошибка загрузки каталога:', error);
    }
  };
  
  return (
    <div className="catalog">
      <h1>Каталог автомобилей</h1>
      <div className="cars-grid">
        {cars.map(car => (
          <div key={car.id} className="car-card">
            <img src={car.image} alt={car.title} />
            <h3>{car.title}</h3>
            <p>Цена: ${car.price.toLocaleString()}</p>
            <Link to={`/car/${car.id}`} className="btn-details">
              Подробнее
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Catalog;