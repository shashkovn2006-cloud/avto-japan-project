// frontend/src/components/CarCard/CarCard.jsx
import { Link } from 'react-router-dom';
import './CarCard.css';

const CarCard = ({ car }) => {
  return (
    <div className="car-card">
      <div className="car-image">
        <img src={car.image} alt={car.title} />
        <span className="service-badge">{car.service}</span>
      </div>
      <div className="car-info">
        <h3>{car.title}</h3>
        <div className="car-details">
          <span>📅 {car.year}</span>
          <span>🛣️ {car.mileage}</span>
          <span>⚙️ {car.engine}</span>
        </div>
        <div className="car-price">${car.price.toLocaleString()}</div>
        <Link to={`/car/${car.id}`} className="btn-details">
          Подробнее
        </Link>
      </div>
    </div>
  );
};

export default CarCard;