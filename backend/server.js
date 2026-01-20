import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const carId = req.params.id || 'temp';
    const uploadPath = path.join(__dirname, 'uploads', 'cars', carId);
    
    fs.mkdir(uploadPath, { recursive: true }).then(() => {
      cb(null, uploadPath);
    }).catch(err => {
      cb(err, uploadPath);
    });
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Путь к файлу базы данных
const dbPath = path.join(__dirname, 'db.json');

// Чтение базы данных
async function readDB() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
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

// API маршруты
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'JSON file',
    version: '3.0.0',
    features: ['upload-images', 'gallery', 'admin']
  });
});

// Получение всех автомобилей
app.get('/api/cars', async (req, res) => {
  try {
    const db = await readDB();
    const { search, minPrice, maxPrice, service, sortBy } = req.query;
    
    let cars = [...db.cars];
    
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
    
    const carsWithSafeImages = cars.map(car => ({
      ...car,
      image: car.image ? `http://localhost:${PORT}${car.image}` : safeImageUrl(null)
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
    
    const getFuelType = (engine) => {
      if (engine.includes('Hybrid') || engine.includes('PHEV')) return 'Гибрид';
      if (engine.includes('Diesel')) return 'Дизель';
      if (engine.includes('Electric')) return 'Электро';
      return 'Бензин';
    };
    
    const getDriveType = (features) => {
      if (features?.some(f => f.includes('Полный'))) return 'Полный привод';
      return 'Передний привод';
    };
    
    const getTransmission = (features) => {
      if (features?.some(f => f.includes('Автомат') || f.includes('Вариатор'))) return 'Автоматическая';
      if (features?.some(f => f.includes('Механическая'))) return 'Механическая';
      return 'Автоматическая';
    };
    
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
    
    const auctionHistory = [
      { date: car.auctionDate, price: car.price * 0.95, status: 'Начальная ставка' },
      { date: new Date(new Date(car.auctionDate).getTime() + 86400000).toISOString().split('T')[0], 
        price: car.price, 
        status: 'Текущая ставка' }
    ];
    
    const carWithDetails = {
      ...car,
      image: car.image ? `http://localhost:${PORT}${car.image}` : safeImageUrl(null),
      images: car.image ? 
        [`http://localhost:${PORT}${car.image}`, ...getGalleryImages(carId)] : 
        getGalleryImages(carId),
      gallery: (car.gallery || []).map(img => `http://localhost:${PORT}${img}`),
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

// ========== API ДЛЯ ЗАГРУЗКИ ФОТО ==========

// Загрузка основной фотографии
app.post('/api/cars/:id/upload-main', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    
    const db = await readDB();
    const carId = parseInt(req.params.id);
    const carIndex = db.cars.findIndex(c => c.id === carId);
    
    if (carIndex === -1) {
      fs.unlink(req.file.path).catch(console.error);
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    
    const imageUrl = `/uploads/cars/${carId}/${req.file.filename}`;
    db.cars[carIndex].image = imageUrl;
    db.cars[carIndex].updatedAt = new Date().toISOString();
    
    await writeDB(db);
    
    res.json({
      success: true,
      message: 'Основное фото загружено',
      imageUrl: imageUrl,
      fullUrl: `http://localhost:${PORT}${imageUrl}`
    });
  } catch (error) {
    console.error('Ошибка загрузки фото:', error);
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
});

// Загрузка нескольких фото в галерею
app.post('/api/cars/:id/upload-gallery', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Файлы не загружены' });
    }
    
    const db = await readDB();
    const carId = parseInt(req.params.id);
    const carIndex = db.cars.findIndex(c => c.id === carId);
    
    if (carIndex === -1) {
      req.files.forEach(file => {
        fs.unlink(file.path).catch(console.error);
      });
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    
    const uploadedImages = req.files.map(file => 
      `/uploads/cars/${carId}/${file.filename}`
    );
    
    if (!db.cars[carIndex].gallery) {
      db.cars[carIndex].gallery = [];
    }
    
    db.cars[carIndex].gallery.push(...uploadedImages);
    db.cars[carIndex].updatedAt = new Date().toISOString();
    
    await writeDB(db);
    
    res.json({
      success: true,
      message: `Загружено ${req.files.length} фото`,
      images: uploadedImages.map(img => `http://localhost:${PORT}${img}`),
      totalInGallery: db.cars[carIndex].gallery.length
    });
  } catch (error) {
    console.error('Ошибка загрузки галереи:', error);
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
});

// Удаление фото из галереи
app.delete('/api/cars/:id/gallery/:filename', async (req, res) => {
  try {
    const db = await readDB();
    const carId = parseInt(req.params.id);
    const filename = req.params.filename;
    const carIndex = db.cars.findIndex(c => c.id === carId);
    
    if (carIndex === -1) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    
    const car = db.cars[carIndex];
    const filePath = path.join(__dirname, 'uploads', 'cars', carId.toString(), filename);
    
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error('Ошибка удаления файла:', err);
    }
    
    if (car.gallery) {
      car.gallery = car.gallery.filter(img => !img.includes(filename));
    }
    
    if (car.image && car.image.includes(filename)) {
      car.image = null;
    }
    
    car.updatedAt = new Date().toISOString();
    await writeDB(db);
    
    res.json({
      success: true,
      message: 'Фото удалено'
    });
  } catch (error) {
    console.error('Ошибка удаления фото:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение списка фото автомобиля
app.get('/api/cars/:id/images', async (req, res) => {
  try {
    const db = await readDB();
    const carId = parseInt(req.params.id);
    const car = db.cars.find(c => c.id === carId);
    
    if (!car) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    
    const carFolder = path.join(__dirname, 'uploads', 'cars', carId.toString());
    let files = [];
    
    try {
      files = await fs.readdir(carFolder);
    } catch (err) {
      files = [];
    }
    
    const images = files.map(file => ({
      filename: file,
      url: `/uploads/cars/${carId}/${file}`,
      fullUrl: `http://localhost:${PORT}/uploads/cars/${carId}/${file}`,
      isMain: car.image && car.image.includes(file)
    }));
    
    res.json({
      carId,
      mainImage: car.image ? `http://localhost:${PORT}${car.image}` : null,
      gallery: (car.gallery || []).map(img => `http://localhost:${PORT}${img}`),
      uploadedFiles: images,
      total: images.length
    });
  } catch (error) {
    console.error('Ошибка получения фото:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Установка фото как основного
app.put('/api/cars/:id/set-main/:filename', async (req, res) => {
  try {
    const db = await readDB();
    const carId = parseInt(req.params.id);
    const filename = req.params.filename;
    const carIndex = db.cars.findIndex(c => c.id === carId);
    
    if (carIndex === -1) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    
    db.cars[carIndex].image = `/uploads/cars/${carId}/${filename}`;
    db.cars[carIndex].updatedAt = new Date().toISOString();
    
    await writeDB(db);
    
    res.json({
      success: true,
      message: 'Фото установлено как основное',
      imageUrl: `http://localhost:${PORT}/uploads/cars/${carId}/${filename}`
    });
  } catch (error) {
    console.error('Ошибка установки основного фото:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавление автомобиля
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
    
    const brandCounts = {};
    db.cars.forEach(car => {
      const brand = car.title.split(' ')[0];
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    });
    
    const popularBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand, count]) => ({ brand, count }));
    
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
          image: null,
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
          image: null,
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
          image: null,
          auctionGrade: 4.5,
          description: "Nissan X-Trail 2021 года, полный привод, отличное состояние. Без ДТП.",
          location: "Nagoya, Japan",
          auctionDate: "2024-01-25",
          features: ["Полный привод", "Панорамная крыша", "Кожаный салон", "Подогрев сидений"],
          color: "Серый",
          createdAt: new Date().toISOString()
        }
      ];
      
      await writeDB(db);
      console.log('✅ База данных инициализирована с тестовыми данными');
    } else {
      console.log(`✅ База данных загружена: ${db.cars.length} автомобилей`);
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации базы:', error);
  }
}

// Запуск сервера
app.listen(PORT, async () => {
  await fs.mkdir(path.join(__dirname, 'uploads'), { recursive: true });
  await initDatabase();
  console.log(`🚗 Сервер запущен на http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 API cars: http://localhost:${PORT}/api/cars`);
  console.log(`📁 Загрузки: http://localhost:${PORT}/uploads/`);
  console.log(`📊 Статистика: http://localhost:${PORT}/api/stats`);
});