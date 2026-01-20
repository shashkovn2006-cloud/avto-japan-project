import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Путь к файлу базы данных
const dbPath = path.join(__dirname, 'db.json');

// Функция для безопасной загрузки фото
const safeImageUrl = (url, fallback = 'https://images.unsplash.com/photo-1599912027806-cfec9f5944b6?w=800&auto=format&fit=crop') => {
  if (!url || url.includes('undefined') || url.includes('null')) {
    return fallback;
  }
  return url;
};

// Галерея фото для автомобилей
const getGalleryImages = (carId) => {
  const galleries = [
    [
      'https://images.unsplash.com/photo-1599912027806-cfec9f5944b6?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621330396175-92a4348e1eb8?w=800&auto=format&fit=crop'
    ],
    [
      'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891999-82c6c06f48a0?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1566474603061-6bb158ec5f7f?w=800&auto=format&fit=crop'
    ],
    [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1563720223487-62f4f5c9a71b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&auto=format&fit=crop'
    ]
  ];
  return galleries[carId % galleries.length];
};

// Чтение базы данных
async function readDB() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Если файла нет, создаем новую базу
    const initialDB = {
      cars: [],
      users: [],
      favorites: []
    };
    await writeDB(initialDB);
    return initialDB;
  }
}

// Запись в базу данных
async function writeDB(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

// API маршруты
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'JSON file',
    version: '2.0.0',
    carsCount: 15
  });
});

// Тест изображений
app.get('/api/test-images', (req, res) => {
  res.json({
    message: 'Тестовые изображения',
    images: getGalleryImages(0),
    status: 'OK'
  });
});

// Получение всех автомобилей
app.get('/api/cars', async (req, res) => {
  try {
    const db = await readDB();
    const { search, minPrice, maxPrice, service, sortBy } = req.query;
    
    let cars = [...db.cars];
    
    // Фильтрация
    if (search) {
      cars = cars.filter(car => 
        car.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (minPrice) {
      cars = cars.filter(car => car.price >= parseFloat(minPrice));
    }
    
    if (maxPrice) {
      cars = cars.filter(car => car.price <= parseFloat(maxPrice));
    }
    
    if (service && service !== 'all') {
      cars = cars.filter(car => car.service === service);
    }
    
    // Сортировка
    if (sortBy === 'price_asc') {
      cars.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      cars.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'year_desc') {
      cars.sort((a, b) => b.year - a.year);
    } else if (sortBy === 'mileage_asc') {
      cars.sort((a, b) => {
        const aMileage = parseInt(a.mileage.replace(/[^\d]/g, ''));
        const bMileage = parseInt(b.mileage.replace(/[^\d]/g, ''));
        return aMileage - bMileage;
      });
    }
    
    // Добавляем безопасные изображения
    const carsWithSafeImages = cars.map(car => ({
      ...car,
      image: safeImageUrl(car.image)
    }));
    
    res.json(carsWithSafeImages);
  } catch (error) {
    console.error('Ошибка получения автомобилей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение одного автомобиля
app.get('/api/cars/:id', async (req, res) => {
  try {
    const db = await readDB();
    const carId = parseInt(req.params.id);
    const car = db.cars.find(c => c.id === carId);
    
    if (!car) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    
    // Определяем тип топлива
    const getFuelType = (engine) => {
      if (engine.includes('Hybrid') || engine.includes('PHEV')) return 'Гибрид';
      if (engine.includes('Diesel')) return 'Дизель';
      if (engine.includes('Electric')) return 'Электро';
      return 'Бензин';
    };
    
    // Определяем тип привода
    const getDriveType = (features) => {
      if (features?.some(f => f.includes('Полный'))) return 'Полный привод';
      return 'Передний привод';
    };
    
    // Определяем тип КПП
    const getTransmission = (features) => {
      if (features?.some(f => f.includes('Автомат') || f.includes('Вариатор'))) return 'Автоматическая';
      if (features?.some(f => f.includes('Механическая'))) return 'Механическая';
      return 'Автоматическая';
    };
    
    // Технические характеристики
    const technicalSpecs = {
      fuelType: getFuelType(car.engine),
      transmission: getTransmission(car.features),
      driveType: getDriveType(car.features),
      seats: car.title.includes('Alphard') || car.title.includes('Hiace') ? 7 : 
             car.title.includes('MX-5') ? 2 : 5,
      color: car.color || 'Не указан',
      bodyType: car.title.includes('SUV') || car.title.includes('X-Trail') || car.title.includes('RAV4') || car.title.includes('Forester') || car.title.includes('CX-5') ? 'Внедорожник' :
                car.title.includes('Hiace') || car.title.includes('Alphard') ? 'Минивэн' :
                car.title.includes('MX-5') ? 'Кабриолет' : 'Седан'
    };
    
    // Отчет осмотра
    const inspectionReport = {
      exterior: { 
        rating: (car.auctionGrade - 0.2).toFixed(1), 
        comments: "Незначительные следы эксплуатации, царапины на бампере" 
      },
      interior: { 
        rating: car.auctionGrade.toFixed(1), 
        comments: "Отличное состояние салона, без повреждений" 
      },
      engine: { 
        rating: (car.auctionGrade + 0.1).toFixed(1), 
        comments: "Двигатель работает исправно, без посторонних шумов" 
      },
      undercarriage: { 
        rating: (car.auctionGrade - 0.1).toFixed(1), 
        comments: "Без коррозии, элементы подвески в норме" 
      }
    };
    
    // История аукциона
    const auctionHistory = [
      { date: car.auctionDate, price: car.price * 0.95, status: 'Начальная ставка' },
      { date: new Date(new Date(car.auctionDate).getTime() + 86400000).toISOString().split('T')[0], 
        price: car.price, 
        status: 'Текущая ставка' }
    ];
    
    // Добавляем галерею фото и детали
    const carWithDetails = {
      ...car,
      image: safeImageUrl(car.image),
      images: [safeImageUrl(car.image), ...getGalleryImages(carId)],
      technicalSpecs,
      inspectionReport,
      auctionHistory,
      features: car.features || ['Кондиционер', 'Электростеклоподъемники', 'Центральный замок', 'Музыкальная система'],
      similarCars: db.cars
        .filter(c => c.id !== carId && c.service === car.service)
        .slice(0, 3)
        .map(c => ({ id: c.id, title: c.title, price: c.price }))
    };
    
    res.json(carWithDetails);
  } catch (error) {
    console.error('Ошибка получения автомобиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Поиск по маркам
app.get('/api/brands', async (req, res) => {
  try {
    const db = await readDB();
    const brands = {};
    
    db.cars.forEach(car => {
      const brand = car.title.split(' ')[0]; // Первое слово - марка
      if (!brands[brand]) {
        brands[brand] = 0;
      }
      brands[brand]++;
    });
    
    res.json({
      brands: Object.keys(brands),
      stats: brands,
      totalBrands: Object.keys(brands).length
    });
  } catch (error) {
    console.error('Ошибка получения марок:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение автомобилей по марке
app.get('/api/cars/brand/:brand', async (req, res) => {
  try {
    const db = await readDB();
    const brand = req.params.brand.toLowerCase();
    
    const cars = db.cars.filter(car => 
      car.title.toLowerCase().startsWith(brand + ' ')
    );
    
    res.json(cars.map(car => ({
      ...car,
      image: safeImageUrl(car.image)
    })));
  } catch (error) {
    console.error('Ошибка получения автомобилей по марке:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавление автомобиля (для админа)
app.post('/api/cars', async (req, res) => {
  try {
    const db = await readDB();
    const newCar = {
      id: db.cars.length > 0 ? Math.max(...db.cars.map(c => c.id)) + 1 : 1,
      ...req.body,
      image: safeImageUrl(req.body.image),
      createdAt: new Date().toISOString(),
      auctionGrade: req.body.auctionGrade || 4.0
    };
    
    db.cars.push(newCar);
    await writeDB(db);
    
    res.status(201).json(newCar);
  } catch (error) {
    console.error('Ошибка добавления автомобиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление автомобиля
app.put('/api/cars/:id', async (req, res) => {
  try {
    const db = await readDB();
    const carId = parseInt(req.params.id);
    const carIndex = db.cars.findIndex(c => c.id === carId);
    
    if (carIndex === -1) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    
    db.cars[carIndex] = {
      ...db.cars[carIndex],
      ...req.body,
      image: safeImageUrl(req.body.image || db.cars[carIndex].image),
      updatedAt: new Date().toISOString()
    };
    
    await writeDB(db);
    res.json(db.cars[carIndex]);
  } catch (error) {
    console.error('Ошибка обновления автомобиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удаление автомобиля
app.delete('/api/cars/:id', async (req, res) => {
  try {
    const db = await readDB();
    const carId = parseInt(req.params.id);
    const carIndex = db.cars.findIndex(c => c.id === carId);
    
    if (carIndex === -1) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    
    db.cars.splice(carIndex, 1);
    await writeDB(db);
    
    res.json({ message: 'Автомобиль удален' });
  } catch (error) {
    console.error('Ошибка удаления автомобиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Калькулятор
app.post('/api/calculate', (req, res) => {
  const { price, engineType, engineVolume } = req.body;
  
  // Расчеты
  let customsRate = 0.48;
  let exciseRate = 0.35;
  
  if (engineType === 'electric') {
    customsRate = 0.15;
    exciseRate = 0;
  } else if (engineType === 'hybrid') {
    customsRate = 0.17;
    exciseRate = engineVolume > 3.0 ? 0.2 : 0.15;
  } else if (engineType === 'diesel') {
    customsRate = 0.50;
    exciseRate = 0.40;
  }
  
  const customsDuty = price * customsRate;
  const exciseTax = price * exciseRate;
  const vat = (price + customsDuty + exciseTax) * 0.2;
  const processingFee = 500;
  const shipping = engineType === 'electric' ? 2000 : 1500;
  const registration = 300;
  
  const total = price + customsDuty + exciseTax + vat + processingFee + shipping + registration;
  
  res.json({
    price: parseInt(price),
    customs: Math.round(customsDuty),
    excise: Math.round(exciseTax),
    vat: Math.round(vat),
    processingFee,
    shipping,
    registration,
    total: Math.round(total),
    breakdown: {
      carPrice: price,
      customsDuty: Math.round(customsDuty),
      exciseTax: Math.round(exciseTax),
      vat: Math.round(vat),
      processingFee,
      shipping,
      registration
    }
  });
});

// Статистика
app.get('/api/stats', async (req, res) => {
  try {
    const db = await readDB();
    
    if (db.cars.length === 0) {
      return res.json({
        totalCars: 0,
        message: 'База данных пуста'
      });
    }
    
    const averagePrice = Math.round(db.cars.reduce((sum, car) => sum + car.price, 0) / db.cars.length);
    const currentYear = new Date().getFullYear();
    const recentCars = db.cars.filter(car => car.year >= currentYear - 2).length;
    
    // Самые популярные марки
    const brandCounts = {};
    db.cars.forEach(car => {
      const brand = car.title.split(' ')[0];
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    });
    
    const popularBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand, count]) => ({ brand, count }));
    
    // Распределение по ценам
    const priceRanges = {
      cheap: db.cars.filter(car => car.price < 15000).length,
      medium: db.cars.filter(car => car.price >= 15000 && car.price < 25000).length,
      expensive: db.cars.filter(car => car.price >= 25000).length
    };
    
    const stats = {
      totalCars: db.cars.length,
      averagePrice,
      minPrice: Math.min(...db.cars.map(car => car.price)),
      maxPrice: Math.max(...db.cars.map(car => car.price)),
      recentCars,
      popularBrands,
      priceRanges,
      services: [...new Set(db.cars.map(car => car.service))],
      totalUsers: db.users.length,
      totalFavorites: db.favorites.length,
      lastUpdated: new Date().toISOString()
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Инициализация начальных данных
async function initDatabase() {
  try {
    const db = await readDB();
    
    // Если база пустая, добавляем 15 автомобилей
    if (db.cars.length === 0) {
      db.cars = [
        {
          id: 1,
          title: "Toyota Crown 2020",
          price: 18500,
          service: "carfromjapan.com",
          year: 2020,
          mileage: "45,000 km",
          engine: "2.5L Hybrid",
          image: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&auto=format&fit=crop",
          auctionGrade: 4.5,
          description: "Toyota Crown 2020 года в идеальном состоянии. Японская комплектация, безаварийная история.",
          location: "Tokyo, Japan",
          auctionDate: "2024-01-15",
          features: ["Автоматическая коробка", "Кожаный салон", "Панорамная крыша", "Навигация", "Камера 360°"],
          color: "Черный",
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: "Honda Fit 2019",
          price: 12500,
          service: "beforward.jp",
          year: 2019,
          mileage: "32,000 km",
          engine: "1.5L Petrol",
          image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop",
          auctionGrade: 4.0,
          description: "Экономичный и практичный Honda Fit. Идеален для города, малый расход топлива.",
          location: "Osaka, Japan",
          auctionDate: "2024-01-20",
          features: ["Вариатор", "Климат-контроль", "Камера заднего вида", "Система стабилизации"],
          color: "Белый",
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          title: "Nissan X-Trail 2021",
          price: 22500,
          service: "japan-partner.com",
          year: 2021,
          mileage: "28,000 km",
          engine: "2.0L Turbo",
          image: "https://images.unsplash.com/photo-1555212697-194d092e3b8f?w=800&auto=format&fit=crop",
          auctionGrade: 4.5,
          description: "Nissan X-Trail 2021 года, полный привод, отличное состояние. Без ДТП.",
          location: "Nagoya, Japan",
          auctionDate: "2024-01-25",
          features: ["Полный привод", "Панорамная крыша", "Кожаный салон", "Подогрев сидений"],
          color: "Серый",
          createdAt: new Date().toISOString()
        },
        {
          id: 4,
          title: "Toyota Prius 2022",
          price: 19500,
          service: "carfromjapan.com",
          year: 2022,
          mileage: "15,000 km",
          engine: "1.8L Hybrid",
          image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&auto=format&fit=crop",
          auctionGrade: 5.0,
          description: "Toyota Prius 2022 - новейшая модель гибрида. Минимальный пробег, экономичный.",
          location: "Yokohama, Japan",
          auctionDate: "2024-02-01",
          features: ["Гибридный двигатель", "Беспроводная зарядка", "Apple CarPlay", "LED фары"],
          color: "Белый",
          createdAt: new Date().toISOString()
        },
        {
          id: 5,
          title: "Mazda CX-5 2020",
          price: 21500,
          service: "beforward.jp",
          year: 2020,
          mileage: "38,000 km",
          engine: "2.5L Petrol",
          image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&auto=format&fit=crop",
          auctionGrade: 4.0,
          description: "Mazda CX-5 с фирменным дизайном KODO. Премиум качество сборки.",
          location: "Kobe, Japan",
          auctionDate: "2024-02-05",
          features: ["Кожаный салон", "Bose акустика", "Круиз-контроль", "Светодиодные фары"],
          color: "Красный",
          createdAt: new Date().toISOString()
        },
        {
          id: 6,
          title: "Subaru Forester 2021",
          price: 23500,
          service: "japan-partner.com",
          year: 2021,
          mileage: "22,000 km",
          engine: "2.5L Boxer",
          image: "https://images.unsplash.com/photo-1593941707882-a5bba5338fe2?w=800&auto=format&fit=crop",
          auctionGrade: 4.5,
          description: "Subaru Forester с фирменной системой полного привода Symmetrical AWD.",
          location: "Sapporo, Japan",
          auctionDate: "2024-02-10",
          features: ["Полный привод", "Система EyeSight", "Подогрев руля", "Электропривод багажника"],
          color: "Синий",
          createdAt: new Date().toISOString()
        },
        {
          id: 7,
          title: "Lexus RX 2020",
          price: 32500,
          service: "carfromjapan.com",
          year: 2020,
          mileage: "30,000 km",
          engine: "3.5L V6 Hybrid",
          image: "https://images.unsplash.com/photo-1563720223487-62f4f5c9a71b?w=800&auto=format&fit=crop",
          auctionGrade: 4.8,
          description: "Lexus RX 2020 - роскошный кроссовер с гибридным двигателем. Премиум-комплектация.",
          location: "Kyoto, Japan",
          auctionDate: "2024-02-15",
          features: ["Премиум салон", "Адаптивный круиз", "Память сидений", "Камера 360°"],
          color: "Черный",
          createdAt: new Date().toISOString()
        },
        {
          id: 8,
          title: "Toyota Hiace 2019",
          price: 19500,
          service: "beforward.jp",
          year: 2019,
          mileage: "50,000 km",
          engine: "2.8L Diesel",
          image: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800&auto=format&fit=crop",
          auctionGrade: 4.2,
          description: "Toyota Hiace 2019 - коммерческий микроавтобус в отличном состоянии.",
          location: "Fukuoka, Japan",
          auctionDate: "2024-02-18",
          features: ["Кондиционер", "Круиз-контроль", "Боковые зеркала", "Большой багажник"],
          color: "Белый",
          createdAt: new Date().toISOString()
        },
        {
          id: 9,
          title: "Honda Civic 2021",
          price: 17500,
          service: "carfromjapan.com",
          year: 2021,
          mileage: "25,000 km",
          engine: "1.5L Turbo",
          image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop",
          auctionGrade: 4.7,
          description: "Honda Civic 2021 с турбированным двигателем. Спортивный дизайн.",
          location: "Hiroshima, Japan",
          auctionDate: "2024-02-22",
          features: ["Турбо-двигатель", "Спортивный режим", "Кожаный руль", "Цифровая панель"],
          color: "Серый",
          createdAt: new Date().toISOString()
        },
        {
          id: 10,
          title: "Toyota RAV4 2020",
          price: 24500,
          service: "japan-partner.com",
          year: 2020,
          mileage: "35,000 km",
          engine: "2.5L Hybrid",
          image: "https://images.unsplash.com/photo-1566474603061-6bb158ec5f7f?w=800&auto=format&fit=crop",
          auctionGrade: 4.6,
          description: "Toyota RAV4 2020 года. Популярный кроссовер, надежный гибрид.",
          location: "Sendai, Japan",
          auctionDate: "2024-02-25",
          features: ["Гибрид", "Полный привод", "Камера заднего вида", "Бесключевой доступ"],
          color: "Серебристый",
          createdAt: new Date().toISOString()
        },
        {
          id: 11,
          title: "Mitsubishi Outlander 2021",
          price: 20500,
          service: "beforward.jp",
          year: 2021,
          mileage: "20,000 km",
          engine: "2.4L PHEV",
          image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop",
          auctionGrade: 4.4,
          description: "Mitsubishi Outlander PHEV 2021. Подключаемый гибрид, экономичный.",
          location: "Nagasaki, Japan",
          auctionDate: "2024-03-01",
          features: ["Подключаемый гибрид", "Электропривод", "Большой багажник", "Панорамная крыша"],
          color: "Белый",
          createdAt: new Date().toISOString()
        },
        {
          id: 12,
          title: "Nissan Skyline 2020",
          price: 28500,
          service: "carfromjapan.com",
          year: 2020,
          mileage: "18,000 km",
          engine: "3.0L Twin-Turbo",
          image: "https://images.unsplash.com/photo-1593941707882-a5bba5338fe2?w=800&auto=format&fit=crop",
          auctionGrade: 4.9,
          description: "Nissan Skyline 2020 - легендарный спортивный седан. Мощный двигатель.",
          location: "Yokohama, Japan",
          auctionDate: "2024-03-05",
          features: ["Twin-Turbo", "Полный привод", "Спортивная подвеска", "Кожаный салон"],
          color: "Синий",
          createdAt: new Date().toISOString()
        },
        {
          id: 13,
          title: "Toyota Alphard 2022",
          price: 35500,
          service: "japan-partner.com",
          year: 2022,
          mileage: "12,000 km",
          engine: "2.5L Hybrid",
          image: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&auto=format&fit=crop",
          auctionGrade: 5.0,
          description: "Toyota Alphard 2022 - премиум минивэн для комфортных поездок.",
          location: "Osaka, Japan",
          auctionDate: "2024-03-10",
          features: ["Электропривод дверей", "Мягкие сиденья", "Развлекательная система", "Шумоизоляция"],
          color: "Черный",
          createdAt: new Date().toISOString()
        },
        {
          id: 14,
          title: "Subaru Impreza 2019",
          price: 16500,
          service: "beforward.jp",
          year: 2019,
          mileage: "40,000 km",
          engine: "2.0L Boxer",
          image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop",
          auctionGrade: 4.3,
          description: "Subaru Impreza 2019 с фирменным оппозитным двигателем. Надежный автомобиль.",
          location: "Tokyo, Japan",
          auctionDate: "2024-03-15",
          features: ["Оппозитный двигатель", "Полный привод", "Климат-контроль", "Музыкальная система"],
          color: "Красный",
          createdAt: new Date().toISOString()
        },
        {
          id: 15,
          title: "Mazda MX-5 2021",
          price: 27500,
          service: "carfromjapan.com",
          year: 2021,
          mileage: "8,000 km",
          engine: "2.0L Skyactiv",
          image: "https://images.unsplash.com/photo-1555212697-194d092e3b8f?w=800&auto=format&fit=crop",
          auctionGrade: 4.8,
          description: "Mazda MX-5 2021 - спортивный родстер. Низкий пробег, отличное состояние.",
          location: "Hiroshima, Japan",
          auctionDate: "2024-03-20",
          features: ["Спортивный родстер", "Механическая КПП", "Кожаный салон", "Люк"],
          color: "Красный",
          createdAt: new Date().toISOString()
        }
      ];
      
      await writeDB(db);
      console.log('✅ База данных инициализирована с 15 автомобилями');
    } else {
      console.log(`✅ База данных загружена: ${db.cars.length} автомобилей`);
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации базы:', error);
  }
}

// Запуск сервера
app.listen(PORT, async () => {
  await initDatabase();
  console.log(`🚗 Сервер запущен на http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 API cars: http://localhost:${PORT}/api/cars`);
  console.log(`📊 Статистика: http://localhost:${PORT}/api/stats`);
  console.log(`🏷️  Марки: http://localhost:${PORT}/api/brands`);
  console.log(`🖼️  Тест фото: http://localhost:${PORT}/api/test-images`);
  console.log(`📝 База данных: JSON файл (db.json)`);
});