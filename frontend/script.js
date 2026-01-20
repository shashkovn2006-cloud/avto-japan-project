const API_BASE = 'http://localhost:3001/api';

async function searchCars() {
    const searchTerm = document.getElementById('searchInput').value;
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    
    loading.style.display = 'block';
    results.innerHTML = '';
    
    try {
        const response = await fetch(`${API_BASE}/cars?search=${encodeURIComponent(searchTerm)}`);
        const cars = await response.json();
        displayResults(cars);
    } catch (error) {
        console.error('Ошибка:', error);
        results.innerHTML = '<p>Ошибка загрузки данных</p>';
    } finally {
        loading.style.display = 'none';
    }
}


// Моковые данные для демонстрации
const mockCars = [
    {
        id: 1,
        title: "Toyota Crown 2020",
        price: 18500,
        service: "carfromjapan.com",
        year: 2020,
        mileage: "45,000 km"
    },
    {
        id: 2, 
        title: "Honda Fit 2019",
        price: 12500,
        service: "beforward.jp",
        year: 2019,
        mileage: "32,000 km"
    },
    {
        id: 3,
        title: "Nissan X-Trail 2021",
        price: 22500,
        service: "japan-partner.com",
        year: 2021,
        mileage: "28,000 km"
    }
];

function searchCars() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    
    // Показываем загрузку
    loading.style.display = 'block';
    results.innerHTML = '';
    
    // Имитация поиска (в реальности будет запрос к бэкенду)
    setTimeout(() => {
        const filteredCars = mockCars.filter(car => 
            car.title.toLowerCase().includes(searchTerm)
        );
        
        displayResults(filteredCars);
        loading.style.display = 'none';
    }, 1000);
}

function displayResults(cars) {
    const container = document.getElementById('results');
    
    if (cars.length === 0) {
        container.innerHTML = '<p>Автомобили не найдены. Попробуйте другой запрос.</p>';
        return;
    }
    
    container.innerHTML = cars.map(car => `
        <div class="car-card">
            <h3>${car.title}</h3>
            <div class="car-price">$${car.price.toLocaleString()}</div>
            <div>Год: ${car.year} | Пробег: ${car.mileage}</div>
            <span class="service-badge">${car.service}</span>
            <button onclick="viewCar(${car.id})" style="margin-top: 10px; padding: 5px 10px;">Подробнее</button>
        </div>
    `).join('');
}

function viewCar(carId) {
    const car = mockCars.find(c => c.id === carId);
    if (car) {
        alert(`Детали: ${car.title}\nЦена: $${car.price}\nСервис: ${car.service}`);
    }
}

// Показываем все автомобили при загрузке
document.addEventListener('DOMContentLoaded', () => {
    displayResults(mockCars);
});