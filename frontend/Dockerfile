# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar package.json primero (para aprovechar caché)
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código (ignorando node_modules)
COPY . .

# Construir la aplicación
RUN npm run build

# Instalar serve
RUN npm install -g serve

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]