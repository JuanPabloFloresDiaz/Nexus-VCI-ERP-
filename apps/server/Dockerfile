# Usar la imagen oficial de Node.js 22 como base
FROM node:22-alpine

# Instalar herramientas básicas de sistema
RUN apk add --no-cache bash

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto de la aplicación
COPY . .

# Exponer el puerto de la API
EXPOSE ${API_PORT}

# Comando por defecto usando el nuevo modo watch nativo de Node 22
CMD ["sh", "-c", "npx sequelize-cli db:migrate && node --watch src/server.js"]