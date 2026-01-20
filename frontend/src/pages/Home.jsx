import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <h1>Добро пожаловать в AutoImport Japan!</h1>
      <p>Прямые поставки автомобилей с японских аукционов</p>
      <Link to="/catalog" className="btn-primary">
        Перейти в каталог
      </Link>
    </div>
  );
};

export default Home;