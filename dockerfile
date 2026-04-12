# Используем официальный образ Node.js
FROM node:20-slim

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем файлы с зависимостями
COPY package.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Устанавливаем все зависимости
RUN npm run install-all

# Копируем весь остальной код
COPY . .

# Собираем фронтенд
RUN npm run build

# Открываем порт, который использует Render (по умолчанию 10000)
EXPOSE 10000

# Команда для запуска сервера
CMD ["npm", "run", "start"]