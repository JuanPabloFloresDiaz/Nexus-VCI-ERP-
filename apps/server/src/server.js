const app = require('./app');
const dotenv = require('dotenv');
const { initBucket } = require('./config/minio');

dotenv.config(); // Carga variables de entorno desde .env

const PORT = process.env.API_PORT;

initBucket().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
});