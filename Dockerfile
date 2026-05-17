FROM node:20-alpine

WORKDIR /app

# Bağımlılıkları önce kopyala (cache için)
COPY package*.json ./
RUN npm ci --omit=dev

# Uygulama dosyalarını kopyala
COPY . .

# Data klasörü oluştur (SQLite için)
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server.js"]
