import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import pkg from 'pg';
import fs from 'fs/promises';


const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;
const JWT_SECRET = 'your-super-secret-key-change-in-production-2024';

// Подключение к PostgreSQL (измените пароль если нужно)
const pool = new Pool({
  user: 'postgres',
  password: '',  // Если пароль пустой
  host: 'localhost',
  port: 5432,
  database: 'avto_japan_db'
});

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

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Недействительный токен' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Требуются права администратора' });
  next();
};

// ========== АВТОРИЗАЦИЯ ==========

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) return res.status(400).json({ error: 'Пользователь уже существует' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, name, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, name, hashedPassword, 'user']
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, user, token });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Неверный email или пароль' });
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ========== API для автомобилей ==========

app.get('/api/cars', async (req, res) => {
  try {
    let query = 'SELECT * FROM cars';
    const conditions = [];
    const values = [];
    let idx = 1;
    const { search, minPrice, maxPrice, service, sortBy } = req.query;
    
    if (search) { conditions.push(`title ILIKE $${idx}`); values.push(`%${search}%`); idx++; }
    if (minPrice) { conditions.push(`price >= $${idx}`); values.push(parseFloat(minPrice)); idx++; }
    if (maxPrice) { conditions.push(`price <= $${idx}`); values.push(parseFloat(maxPrice)); idx++; }
    if (service && service !== 'all') { conditions.push(`service = $${idx}`); values.push(service); idx++; }
    
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    
    if (sortBy === 'price_asc') query += ' ORDER BY price ASC';
    else if (sortBy === 'price_desc') query += ' ORDER BY price DESC';
    else if (sortBy === 'year_desc') query += ' ORDER BY year DESC';
    else query += ' ORDER BY id ASC';
    
    const result = await pool.query(query, values);
    const carsWithImages = result.rows.map(car => ({
      ...car,
      image: car.image && !car.image.startsWith('http') ? `http://localhost:${PORT}${car.image}` : car.image
    }));
    res.json(carsWithImages);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/cars/:id', async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    const result = await pool.query('SELECT * FROM cars WHERE id = $1', [carId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Автомобиль не найден' });
    const car = result.rows[0];
    const galleryResult = await pool.query('SELECT image_url FROM car_gallery WHERE car_id = $1', [carId]);
    car.image = car.image && !car.image.startsWith('http') ? `http://localhost:${PORT}${car.image}` : car.image;
    car.gallery = galleryResult.rows.map(g => g.image_url.startsWith('http') ? g.image_url : `http://localhost:${PORT}${g.image_url}`);
    res.json(car);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/cars', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, price, service, year, mileage, engine, auctionGrade, description, location, auctionDate, features, color } = req.body;
    const result = await pool.query(
      'INSERT INTO cars (title, price, service, year, mileage, engine, auction_grade, description, location, auction_date, features, color) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [title, price, service, year, mileage, engine, auctionGrade, description, location, auctionDate, features || [], color]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/cars/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    const { title, price, service, year, mileage, engine, auctionGrade, description, location, auctionDate, features, color } = req.body;
    const result = await pool.query(
      'UPDATE cars SET title=$1, price=$2, service=$3, year=$4, mileage=$5, engine=$6, auction_grade=$7, description=$8, location=$9, auction_date=$10, features=$11, color=$12, updated_at=CURRENT_TIMESTAMP WHERE id=$13 RETURNING *',
      [title, price, service, year, mileage, engine, auctionGrade, description, location, auctionDate, features || [], color, carId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Автомобиль не найден' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/cars/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    const carFolder = path.join(__dirname, 'uploads', 'cars', String(carId));
    try { await fs.rm(carFolder, { recursive: true, force: true }); } catch (err) {}
    await pool.query('DELETE FROM car_gallery WHERE car_id = $1', [carId]);
    await pool.query('DELETE FROM favorites WHERE car_id = $1', [carId]);
    const result = await pool.query('DELETE FROM cars WHERE id = $1 RETURNING id', [carId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Автомобиль не найден' });
    res.json({ message: 'Автомобиль удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/cars/:id/upload-main', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
    const carId = parseInt(req.params.id);
    const imageUrl = `/uploads/cars/${carId}/${req.file.filename}`;
    await pool.query('UPDATE cars SET image = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [imageUrl, carId]);
    await pool.query('INSERT INTO car_gallery (car_id, image_url) VALUES ($1, $2)', [carId, imageUrl]);
    res.json({ success: true, imageUrl, fullUrl: `http://localhost:${PORT}${imageUrl}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cars/:id/images', authenticateToken, isAdmin, async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    const result = await pool.query('SELECT image_url FROM car_gallery WHERE car_id = $1', [carId]);
    const carResult = await pool.query('SELECT image FROM cars WHERE id = $1', [carId]);
    const images = result.rows.map(row => ({
      url: row.image_url,
      fullUrl: row.image_url.startsWith('http') ? row.image_url : `http://localhost:${PORT}${row.image_url}`,
      isMain: carResult.rows[0]?.image === row.image_url
    }));
    res.json({ uploadedFiles: images, total: images.length });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/favorites/:carId', authenticateToken, async (req, res) => {
  try {
    await pool.query('INSERT INTO favorites (user_id, car_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, parseInt(req.params.carId)]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/favorites/:carId', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND car_id = $2', [req.user.id, parseInt(req.params.carId)]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT c.* FROM cars c JOIN favorites f ON c.id = f.car_id WHERE f.user_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/calculate', (req, res) => {
  try {
    let price = parseFloat(req.body.price);
    let engineVolume = parseFloat(req.body.engineVolume);
    let engineType = req.body.engineType;
    if (isNaN(price) || price <= 0) return res.status(400).json({ error: 'Укажите корректную цену' });
    if (isNaN(engineVolume) || engineVolume <= 0) engineVolume = 2.0;
    
    let customsRate = 0.48, exciseRate = 0.35;
    if (engineType === 'electric') { customsRate = 0.15; exciseRate = 0; }
    else if (engineType === 'hybrid') { customsRate = 0.17; exciseRate = engineVolume > 3.0 ? 0.20 : 0.15; }
    else if (engineType === 'diesel') { customsRate = 0.50; exciseRate = 0.40; }
    
    const customsDuty = price * customsRate;
    const exciseTax = price * exciseRate;
    const vat = (price + customsDuty + exciseTax) * 0.2;
    const processingFee = 500;
    const shipping = engineType === 'electric' ? 2000 : 1500;
    const total = price + customsDuty + exciseTax + vat + processingFee + shipping;
    
    res.json({
      price: Math.round(price), customs: Math.round(customsDuty), excise: Math.round(exciseTax),
      vat: Math.round(vat), processingFee, shipping, total: Math.round(total)
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка расчёта' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const totalCars = await pool.query('SELECT COUNT(*) FROM cars');
    const avgPrice = await pool.query('SELECT AVG(price) FROM cars WHERE price > 0');
    const minPrice = await pool.query('SELECT MIN(price) FROM cars WHERE price > 0');
    const maxPrice = await pool.query('SELECT MAX(price) FROM cars');
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    res.json({
      totalCars: parseInt(totalCars.rows[0].count),
      averagePrice: Math.round(parseFloat(avgPrice.rows[0].avg) || 0),
      minPrice: parseInt(minPrice.rows[0].min) || 0,
      maxPrice: parseInt(maxPrice.rows[0].max) || 0,
      totalUsers: parseInt(totalUsers.rows[0].count),
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), database: 'PostgreSQL' });
});

async function initUploads() {
  await fs.mkdir(path.join(__dirname, 'uploads'), { recursive: true });
  console.log('✅ Папка uploads готова');
}

// ========== ДОСТАВКА И ЗАКАЗЫ ==========

// Создание заказа на доставку
app.post('/api/delivery/create', authenticateToken, async (req, res) => {
  try {
    const { 
      car_id, customer_name, customer_phone, customer_email, 
      customer_city, customer_address, delivery_type, comment 
    } = req.body;
    
    const user_id = req.user.id;
    
    // Получаем информацию об автомобиле
    const carResult = await pool.query('SELECT price FROM cars WHERE id = $1', [car_id]);
    if (carResult.rows.length === 0) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    
    // Рассчитываем стоимость доставки
    let delivery_price = 0;
    if (delivery_type === 'standard') delivery_price = 1500;
    else if (delivery_type === 'express') delivery_price = 2500;
    else if (delivery_type === 'air') delivery_price = 5000;
    
    const car_price = carResult.rows[0].price;
    const total_price = car_price + delivery_price;
    
    const result = await pool.query(
      `INSERT INTO delivery_orders (car_id, user_id, customer_name, customer_phone, customer_email, 
       customer_city, customer_address, delivery_type, delivery_price, total_price, comment, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending') RETURNING *`,
      [car_id, user_id, customer_name, customer_phone, customer_email, 
       customer_city, customer_address, delivery_type, delivery_price, total_price, comment]
    );
    
    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение заказов пользователя
app.get('/api/delivery/my-orders', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, c.title as car_title, c.image as car_image 
       FROM delivery_orders o 
       JOIN cars c ON o.car_id = c.id 
       WHERE o.user_id = $1 
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение всех заказов (только для админа)
app.get('/api/delivery/all-orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, c.title as car_title, u.name as user_name, u.email as user_email 
       FROM delivery_orders o 
       JOIN cars c ON o.car_id = c.id 
       JOIN users u ON o.user_id = u.id 
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление статуса заказа (только для админа)
app.put('/api/delivery/update-status/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    
    const result = await pool.query(
      `UPDATE delivery_orders SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [status, orderId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    
    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// После создания app:
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  }
});

// Хранилище активных соединений
const userSockets = new Map();

// WebSocket подключения
io.on('connection', (socket) => {
  console.log('Новое подключение:', socket.id);
  
  socket.on('register', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`Пользователь ${userId} зарегистрирован`);
  });
  
  socket.on('disconnect', () => {
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

// Функция отправки уведомления
export const sendNotification = (userId, title, message, type = 'info') => {
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit('notification', { title, message, type });
  }
};

// Обновите эндпоинт обновления статуса заказа:
app.put('/api/delivery/update-status/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    
    // Получаем информацию о заказе для уведомления
    const orderInfo = await pool.query(
      'SELECT user_id, car_id FROM delivery_orders WHERE id = $1',
      [orderId]
    );
    
    const result = await pool.query(
      `UPDATE delivery_orders SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [status, orderId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    
    // Отправляем уведомление пользователю
    const statusMessages = {
      'processing': { title: 'Заказ в обработке', message: 'Ваш заказ принят и обрабатывается' },
      'shipped': { title: 'Заказ отправлен', message: 'Ваш заказ отправлен. Ожидайте доставку' },
      'delivered': { title: 'Заказ доставлен', message: 'Ваш заказ успешно доставлен! Спасибо за покупку' },
      'cancelled': { title: 'Заказ отменён', message: 'Ваш заказ был отменён' }
    };
    
    if (statusMessages[status]) {
      sendNotification(
        orderInfo.rows[0].user_id,
        statusMessages[status].title,
        statusMessages[status].message,
        status === 'cancelled' ? 'error' : 'success'
      );
    }
    
    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Раздача статики frontend (после всех API-маршрутов)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Все остальные запросы отдаём index.html (для React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});



// В конце файла замените app.listen на server.listen:
server.listen(PORT, async () => {
  await initUploads();
  console.log(`🚗 Сервер запущен на http://localhost:${PORT}`);
  console.log(`🗄️ База данных: PostgreSQL`);
  console.log(`🔌 WebSocket сервер запущен`);
});