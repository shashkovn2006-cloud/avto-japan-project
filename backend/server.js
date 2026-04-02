import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { createWriteStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-super-secret-key-change-in-production-2024';

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer настройки
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const carId = req.params.id;
    if (!carId || carId === 'temp') {
      return cb(new Error('Сначала сохраните автомобиль'));
    }
    const uploadPath = path.join(__dirname, 'uploads', 'cars', String(carId));
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
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
      cb(new Error('Только изображения'));
    }
  }
});

const dbPath = path.join(__dirname, 'db.json');

async function readDB() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    const initialDB = { cars: [], users: [], favorites: [], orders: [] };
    await writeDB(initialDB);
    return initialDB;
  }
}

async function writeDB(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Недействительный токен' });
  }
};

// Middleware для проверки админа
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  next();
};

// ========== АВТОРИЗАЦИЯ ==========

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const db = await readDB();
    
    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      id: db.users.length + 1,
      email,
      name,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    await writeDB(db);
    
    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ 
      success: true, 
      user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      token 
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'JSON file'
  });
});

// Вход
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await readDB();
    
    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token 
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Выход
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Выход выполнен' });
});

// Проверка текущего пользователя
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const db = await readDB();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ========== API для автомобилей ==========

// Получение всех автомобилей (исправленный)
app.get('/api/cars', async (req, res) => {
  try {
    const db = await readDB();
    
    let cars = [...db.cars];
    
    const { search, minPrice, maxPrice, service, sortBy } = req.query;
    
    if (search) {
      cars = cars.filter(car => car.title.toLowerCase().includes(search.toLowerCase()));
    }
    if (minPrice) {
      cars = cars.filter(car => {
        const price = typeof car.price === 'string' ? parseInt(car.price) : car.price;
        return price >= parseFloat(minPrice);
      });
    }
    if (maxPrice) {
      cars = cars.filter(car => {
        const price = typeof car.price === 'string' ? parseInt(car.price) : car.price;
        return price <= parseFloat(maxPrice);
      });
    }
    if (service && service !== 'all') {
      cars = cars.filter(car => car.service === service);
    }
    if (sortBy === 'price_asc') {
      cars.sort((a, b) => {
        const priceA = typeof a.price === 'string' ? parseInt(a.price) : a.price;
        const priceB = typeof b.price === 'string' ? parseInt(b.price) : b.price;
        return priceA - priceB;
      });
    } else if (sortBy === 'price_desc') {
      cars.sort((a, b) => {
        const priceA = typeof a.price === 'string' ? parseInt(a.price) : a.price;
        const priceB = typeof b.price === 'string' ? parseInt(b.price) : b.price;
        return priceB - priceA;
      });
    } else if (sortBy === 'year_desc') {
      cars.sort((a, b) => b.year - a.year);
    }
    
    const carsWithImages = cars.map(car => {
      let imageUrl = car.image;
      if (imageUrl) {
        // Если URL уже полный, не добавляем localhost
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          // Всё хорошо, оставляем как есть
        } else if (imageUrl.startsWith('/uploads')) {
          imageUrl = `http://localhost:${PORT}${imageUrl}`;
        } else {
          imageUrl = `http://localhost:${PORT}${imageUrl}`;
        }
      }
      
      return {
        ...car,
        price: typeof car.price === 'string' ? parseInt(car.price) : car.price,
        image: imageUrl
      };
    });
    
    res.json(carsWithImages);
  } catch (error) {
    console.error('Ошибка получения автомобилей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение одного автомобиля (исправленный)
app.get('/api/cars/:id', async (req, res) => {
  try {
    const db = await readDB();
    const carId = parseInt(req.params.id);
    const car = db.cars.find(c => c.id === carId);
    
    if (!car) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    
    let imageUrl = car.image;
    if (imageUrl) {
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        // Уже полный URL
      } else if (imageUrl.startsWith('/uploads')) {
        imageUrl = `http://localhost:${PORT}${imageUrl}`;
      } else {
        imageUrl = `http://localhost:${PORT}${imageUrl}`;
      }
    }
    
    const carWithDetails = {
      ...car,
      price: typeof car.price === 'string' ? parseInt(car.price) : car.price,
      image: imageUrl,
      images: imageUrl ? [imageUrl] : [],
      gallery: (car.gallery || []).map(img => {
        if (img.startsWith('http')) return img;
        return `http://localhost:${PORT}${img}`;
      })
    };
    
    res.json(carWithDetails);
  } catch (error) {
    console.error('Ошибка получения автомобиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавление автомобиля (только админ)
app.post('/api/cars', authenticateToken, isAdmin, async (req, res) => {
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
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление автомобиля (только админ)
app.put('/api/cars/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const db = await readDB();
    const carId = parseInt(req.params.id);
    const carIndex = db.cars.findIndex(c => c.id === carId);
    
    if (carIndex === -1) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    
    db.cars[carIndex] = { ...db.cars[carIndex], ...req.body, updatedAt: new Date().toISOString() };
    await writeDB(db);
    res.json(db.cars[carIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удаление автомобиля (только админ)
app.delete('/api/cars/:id', authenticateToken, isAdmin, async (req, res) => {
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
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Загрузка фото (только админ)
app.post('/api/cars/:id/upload-main', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    
    const db = await readDB();
    const carId = parseInt(req.params.id);
    const carIndex = db.cars.findIndex(c => c.id === carId);
    
    if (carIndex === -1) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    
    const imageUrl = `/uploads/cars/${carId}/${req.file.filename}`;
    db.cars[carIndex].image = imageUrl;
    db.cars[carIndex].updatedAt = new Date().toISOString();
    
    await writeDB(db);
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      fullUrl: `http://localhost:${PORT}${imageUrl}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение списка фото
app.get('/api/cars/:id/images', authenticateToken, isAdmin, async (req, res) => {
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
    
    res.json({ carId, uploadedFiles: images, total: images.length });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Избранное (для авторизованных пользователей)
app.post('/api/favorites/:carId', authenticateToken, async (req, res) => {
  try {
    const db = await readDB();
    const userId = req.user.id;
    const carId = parseInt(req.params.carId);
    
    if (!db.favorites) db.favorites = [];
    
    const existing = db.favorites.find(f => f.userId === userId && f.carId === carId);
    if (existing) {
      return res.status(400).json({ error: 'Уже в избранном' });
    }
    
    db.favorites.push({ userId, carId, createdAt: new Date().toISOString() });
    await writeDB(db);
    res.json({ success: true, message: 'Добавлено в избранное' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/favorites/:carId', authenticateToken, async (req, res) => {
  try {
    const db = await readDB();
    const userId = req.user.id;
    const carId = parseInt(req.params.carId);
    
    db.favorites = db.favorites.filter(f => !(f.userId === userId && f.carId === carId));
    await writeDB(db);
    res.json({ success: true, message: 'Удалено из избранного' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const db = await readDB();
    const userId = req.user.id;
    
    const favoriteCars = db.favorites
      .filter(f => f.userId === userId)
      .map(f => db.cars.find(c => c.id === f.carId))
      .filter(c => c);
    
    res.json(favoriteCars);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Калькулятор (публичный)
app.post('/api/calculate', (req, res) => {
  try {
    let price = parseFloat(req.body.price);
    let engineVolume = parseFloat(req.body.engineVolume);
    let engineType = req.body.engineType;
    
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'Укажите корректную цену' });
    }
    if (isNaN(engineVolume) || engineVolume <= 0) {
      engineVolume = 2.0;
    }
    
    let customsRate = 0.48;
    let exciseRate = 0.35;
    
    if (engineType === 'electric') {
      customsRate = 0.15;
      exciseRate = 0;
    } else if (engineType === 'hybrid') {
      customsRate = 0.17;
      exciseRate = engineVolume > 3.0 ? 0.20 : 0.15;
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
      price: Math.round(price),
      customs: Math.round(customsDuty),
      excise: Math.round(exciseTax),
      vat: Math.round(vat),
      processingFee: processingFee,
      shipping: shipping,
      registration: registration,
      total: Math.round(total)
    });
  } catch (error) {
    console.error('Ошибка калькулятора:', error);
    res.status(500).json({ error: 'Ошибка расчёта' });
  }
});

// Статистика (исправленная)
app.get('/api/stats', async (req, res) => {
  try {
    const db = await readDB();
    
    if (db.cars.length === 0) {
      return res.json({ 
        totalCars: 0, 
        message: 'Нет автомобилей',
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0
      });
    }
    
    // Принудительно преобразуем цены в числа
    const prices = db.cars.map(car => {
      const price = typeof car.price === 'string' ? parseInt(car.price) : car.price;
      return isNaN(price) ? 0 : price;
    });
    
    const validPrices = prices.filter(p => p > 0);
    const averagePrice = validPrices.length > 0 
      ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length)
      : 0;
    
    res.json({
      totalCars: db.cars.length,
      averagePrice: averagePrice,
      minPrice: Math.min(...validPrices),
      maxPrice: Math.max(...validPrices),
      totalUsers: db.users?.length || 0,
      totalFavorites: db.favorites?.length || 0,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Ошибка статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ========== ИМПОРТ ФОТО (упрощённая версия без cheerio) ==========

// Функция для скачивания изображения
const downloadImage = async (url, filepath) => {
  const axiosMod = await import('axios');
  const axios = axiosMod.default;
  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  return new Promise((resolve, reject) => {
    const writer = createWriteStream(filepath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

// API: Импорт фото по URL страницы
app.post('/api/admin/import-images', authenticateToken, isAdmin, async (req, res) => {
  try {
    const axiosMod = await import('axios');
    const axios = axiosMod.default;
    
    const { pageUrl, carId } = req.body;
    
    if (!pageUrl || !carId) {
      return res.status(400).json({ error: 'Укажите URL страницы и ID автомобиля' });
    }
    
    // Скачиваем HTML страницы
    const { data: html } = await axios.get(pageUrl);
    
    // Простой поиск всех URL изображений через регулярное выражение
    const imgRegex = /https?:\/\/[^\s<>"'\)]+\.(jpg|jpeg|png|gif|webp)/gi;
    const foundImages = html.match(imgRegex) || [];
    
    // Фильтруем дубликаты и убираем мусор
    const uniqueImages = [...new Set(foundImages)];
    const filteredImages = uniqueImages.filter(img => {
      return !img.includes('icon') && 
             !img.includes('logo') && 
             !img.includes('avatar') &&
             !img.includes('data:image');
    });
    
    const imagesToImport = filteredImages.slice(0, 20);
    
    if (imagesToImport.length === 0) {
      return res.json({ success: false, message: 'Изображения не найдены на странице' });
    }
    
    // Создаём папку для автомобиля
    const carFolder = path.join(__dirname, 'uploads', 'cars', String(carId));
    await fs.mkdir(carFolder, { recursive: true });
    
    // Скачиваем изображения
    const downloaded = [];
    for (let i = 0; i < imagesToImport.length; i++) {
      const imgUrl = imagesToImport[i];
      const ext = path.extname(imgUrl.split('?')[0]) || '.jpg';
      const filename = `imported-${Date.now()}-${i}${ext}`;
      const filepath = path.join(carFolder, filename);
      
      try {
        await downloadImage(imgUrl, filepath);
        const imageUrl = `/uploads/cars/${carId}/${filename}`;
        downloaded.push(imageUrl);
      } catch (err) {
        console.error(`Ошибка загрузки:`, err.message);
      }
    }
    
    // Обновляем базу данных
    const db = await readDB();
    const carIndex = db.cars.findIndex(c => c.id === parseInt(carId));
    
    if (carIndex !== -1) {
      if (!db.cars[carIndex].gallery) db.cars[carIndex].gallery = [];
      
      const galleryImages = downloaded.slice(0, 10);
      db.cars[carIndex].gallery.push(...galleryImages);
      
      if (!db.cars[carIndex].image && downloaded[0]) {
        db.cars[carIndex].image = downloaded[0];
      }
      
      db.cars[carIndex].updatedAt = new Date().toISOString();
      await writeDB(db);
    }
    
    res.json({
      success: true,
      message: `Импортировано ${downloaded.length} фото из ${imagesToImport.length}`,
      imported: downloaded.map(img => `http://localhost:${PORT}${img}`)
    });
    
  } catch (error) {
    console.error('Ошибка импорта:', error);
    res.status(500).json({ error: 'Ошибка импорта: ' + error.message });
  }
});

// API: Предпросмотр изображений
app.post('/api/admin/preview-images', authenticateToken, isAdmin, async (req, res) => {
  try {
    const axiosMod = await import('axios');
    const axios = axiosMod.default;
    
    const { pageUrl } = req.body;
    
    if (!pageUrl) {
      return res.status(400).json({ error: 'Укажите URL страницы' });
    }
    
    const { data: html } = await axios.get(pageUrl);
    
    const imgRegex = /https?:\/\/[^\s<>"'\)]+\.(jpg|jpeg|png|gif|webp)/gi;
    const foundImages = html.match(imgRegex) || [];
    const uniqueImages = [...new Set(foundImages)];
    const filteredImages = uniqueImages.filter(img => {
      return !img.includes('icon') && !img.includes('logo') && !img.includes('avatar');
    });
    
    res.json({
      success: true,
      images: filteredImages.slice(0, 30),
      total: filteredImages.length
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения изображений' });
  }
});

// Инициализация базы данных
async function initDatabase() {
  try {
    const db = await readDB();
    
    if (db.cars.length === 0) {
      db.cars = [
        { id: 1, title: "Toyota Crown 2020", price: 18500, service: "carfromjapan.com", year: 2020, mileage: "45,000 km", engine: "2.5L Hybrid", image: "https://images.unsplash.com/photo-1599912027806-cfec9f5944b6?w=500&h=300&fit=crop", auctionGrade: 4.5, description: "Toyota Crown 2020 года в идеальном состоянии.", location: "Tokyo, Japan", auctionDate: "2024-01-15", features: ["Автоматическая коробка", "Кожаный салон"], color: "Черный", createdAt: new Date().toISOString() },
        { id: 2, title: "Honda Fit 2019", price: 12500, service: "beforward.jp", year: 2019, mileage: "32,000 km", engine: "1.5L Petrol", image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500&h=300&fit=crop", auctionGrade: 4.0, description: "Экономичный и практичный Honda Fit.", location: "Osaka, Japan", auctionDate: "2024-01-20", features: ["Вариатор", "Климат-контроль"], color: "Белый", createdAt: new Date().toISOString() },
        { id: 3, title: "Nissan X-Trail 2021", price: 22500, service: "japan-partner.com", year: 2021, mileage: "28,000 km", engine: "2.0L Turbo", image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=500&h=300&fit=crop", auctionGrade: 4.5, description: "Nissan X-Trail 2021 года, полный привод.", location: "Nagoya, Japan", auctionDate: "2024-01-25", features: ["Полный привод", "Панорамная крыша"], color: "Серый", createdAt: new Date().toISOString() }
      ];
    }
    
    // Создание админа по умолчанию, если нет пользователей
    if (db.users.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      db.users.push({
        id: 1,
        email: 'admin@autojapan.pro',
        name: 'Администратор',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      db.users.push({
        id: 2,
        email: 'user@autojapan.pro',
        name: 'Тестовый пользователь',
        password: hashedPassword,
        role: 'user',
        createdAt: new Date().toISOString()
      });
    }
    
    await writeDB(db);
    console.log('✅ База данных инициализирована');
    console.log('👑 Админ: admin@autojapan.pro / admin123');
    console.log('👤 Пользователь: user@autojapan.pro / admin123');
  } catch (error) {
    console.error('❌ Ошибка инициализации:', error);
  }
}

app.listen(PORT, async () => {
  await fs.mkdir(path.join(__dirname, 'uploads'), { recursive: true });
  await initDatabase();
  console.log(`🚗 Сервер запущен на http://localhost:${PORT}`);
  console.log(`🔐 Авторизация: http://localhost:${PORT}/api/auth/login`);
});