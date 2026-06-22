# frontend/Dockerfile
FROM node:22-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Instalar serve para servir la aplicación
RUN npm install -g serve

# Exponer el puerto
EXPOSE 5173

# Servir la aplicación
CMD ["serve", "-s", "dist", "-l", "5173"]