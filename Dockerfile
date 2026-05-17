FROM node:20-slim

WORKDIR /app

# better-sqlite3 için derleme araçları
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Bağımlılıkları önce kopyala (cache için)
COPY package*.json ./
RUN npm ci --omit=dev

# Uygulama dosyalarını kopyala
COPY . .

# Data klasörü oluştur (SQLite için)
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server.js"]
