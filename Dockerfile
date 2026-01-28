# Dockerfile для React frontend
FROM node:20-alpine

WORKDIR /app

# Копирование package файлов
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование исходного кода
COPY . .

# Открытие порта
EXPOSE 5173

# Команда запуска dev сервера
CMD ["npm", "run", "dev", "--", "--host"]
