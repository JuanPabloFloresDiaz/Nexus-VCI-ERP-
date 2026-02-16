# Usar la imagen oficial de Node.js 22 como base
FROM node:22-alpine

# Instalar herramientas básicas de sistema y dependencias de compilación
# python3, make, g++ son necesarios para node-gyp
# py3-setuptools proporciona distutils para Python 3.12+ en Alpine
RUN apk add --no-cache bash python3 make g++ py3-setuptools

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar SOLO package.json (ignorando package-lock.json para evitar conflictos con opsys)
COPY package.json ./

# Instalar dependencias ignorando scripts de compilación (fix para gl/brain.js en Alpine)
RUN npm install --ignore-scripts

# Copiar el resto de la aplicación
COPY . .

# Exponer el puerto de la API
EXPOSE ${API_PORT}

# Comando por defecto usando el nuevo modo watch nativo de Node 22
CMD ["sh", "-c", "npx sequelize-cli db:migrate && node --watch src/server.js"]