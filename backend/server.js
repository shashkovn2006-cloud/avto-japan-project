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
    version: '1.0.0'
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
    }
    
    res.json(cars);
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
    
    // Добавляем галерею фото
    const carWithGallery = {
      ...car,
      images: [
        car.image,
        'https://images.unsplash.com/photo-1599912027806-cfec9f5944b6?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1621330396175-92a4348e1eb8?w=800&auto=format&fit=crop'
      ]
    };
    
    res.json(carWithGallery);
  } catch (error) {
    console.error('Ошибка получения автомобиля:', error);
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
      createdAt: new Date().toISOString()
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
  
  // Расчеты (как раньше)
  let customsRate = 0.48;
  let exciseRate = 0.35;
  
  if (engineType === 'electric') {
    customsRate = 0.15;
    exciseRate = 0;
  } else if (engineType === 'hybrid') {
    customsRate = 0.17;
    exciseRate = engineVolume > 3.0 ? 0.2 : 0.15;
  }
  
  const customsDuty = price * customsRate;
  const exciseTax = price * exciseRate;
  const vat = (price + customsDuty + exciseTax) * 0.2;
  const processingFee = 500;
  const shipping = engineType === 'electric' ? 2000 : 1500;
  
  const total = price + customsDuty + exciseTax + vat + processingFee + shipping;
  
  res.json({
    price: parseInt(price),
    customs: Math.round(customsDuty),
    excise: Math.round(exciseTax),
    vat: Math.round(vat),
    processingFee,
    shipping,
    total: Math.round(total)
  });
});

// Статистика
app.get('/api/stats', async (req, res) => {
  try {
    const db = await readDB();
    const stats = {
      totalCars: db.cars.length,
      averagePrice: db.cars.length > 0 
        ? Math.round(db.cars.reduce((sum, car) => sum + car.price, 0) / db.cars.length)
        : 0,
      totalUsers: db.users.length,
      totalFavorites: db.favorites.length,
      popularServices: [...new Set(db.cars.map(car => car.service))],
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
    
    // Если база пустая, добавляем тестовые данные
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
          description: "Экономичный и практичный Honda Fit. Идеален для города.",
          location: "Osaka, Japan",
          auctionDate: "2024-01-20",
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
          description: "Nissan X-Trail 2021 года, полный привод, отличное состояние.",
          location: "Nagoya, Japan",
          auctionDate: "2024-01-25",
          createdAt: new Date().toISOString()
        }
      ];
      
      await writeDB(db);
      console.log('✅ База данных инициализирована с тестовыми данными');
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
  console.log(`📝 База данных: JSON файл (db.json)`);
});