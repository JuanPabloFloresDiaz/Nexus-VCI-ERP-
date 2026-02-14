# Planificación de Tareas Programadas (Cron Jobs)

Este documento detalla los trabajos programados que se implementarán en el sistema utilizando `node-cron`.

**Nota Importante:** Recuerda instalar la librería necesaria para manejar los cron jobs:
```bash
npm install node-cron
```

---

## Configuración General

Todos los jobs se ejecutarán diariamente a las **4:00 AM**, utilizando la expresión cron configurada en las variables de entorno:
`CRON_EXPRESION="30 4 * * *"`

## Jobs Propuestos

### 1. Compresión de Imágenes en MinIO
**Objetivo:** Optimizar el espacio de almacenamiento y mejorar los tiempos de carga reduciendo el tamaño de las imágenes subidas por los usuarios.

**Lógica:**
1.  Iterar sobre los buckets de imágenes (ej. `productos`, `logos`, `perfiles`).
2.  Identificar imágenes que superen un umbral de tamaño (ej. > 1MB) y que no hayan sido procesadas previamente.
3.  Descargar la imagen, comprimirla (usando `sharp` u otra librería de procesamiento de imágenes) manteniendo una calidad aceptable.
4.  Reemplazar la imagen original en MinIO con la versión comprimida.
5.  Registrar el ahorro de espacio obtenido.

### 2. Limpieza de Imágenes Huérfanas (Orphan Cleanup)
**Objetivo:** Eliminar archivos en MinIO que no están referenciados en la base de datos para liberar espacio y mantener la integridad del almacenamiento.

**Lógica:**
1.  Obtener la lista completa de objetos (imágenes) almacenados en MinIO.
2.  Consultar la base de datos para obtener todas las referencias de imágenes válidas (tablas: `productos.imagen_url`, `empresas.logo_url`, `usuarios.foto_perfil_url`, etc.).
3.  Comparar ambas listas.
4.  Identificar los archivos en MinIO que **NO** están en la lista de la base de datos.
5.  Eliminar estos archivos "huérfanos" de MinIO.
6.  Generar un log con los archivos eliminados.

### 3. Notificación de Aniversario de Empresa
**Objetivo:** Fomentar la fidelización enviando un correo de felicitación a las empresas en la fecha de su aniversario de registro.

**Lógica:**
1.  Consultar la base de datos para encontrar empresas cuya fecha de creación (`createdAt`) coincida con el día y mes actual.
2.  Para cada empresa encontrada, enviar un correo electrónico personalizado al `correo_empresa` o al administrador principal.
3.  El correo puede incluir un mensaje de agradecimiento y resumen de su tiempo con nosotros.

### 4. Reporte Diario de Rendimiento
**Objetivo:** Proveer a los administradores de empresa un resumen ejecutivo de la actividad del día anterior.

**Lógica:**
1.  Iterar sobre todas las empresas activas.
2.  Para cada empresa, calcular métricas del día anterior (ej. 00:00 a 23:59):
    *   Total de ventas (Pedidos completados).
    *   Número de nuevos clientes.
    *   Productos más vendidos.
    *   Alertas de stock bajo.
3.  Generar un reporte (puede ser un correo con formato HTML o un PDF adjunto).
4.  Enviar el reporte al correo de la empresa.

---

## Siguientes Pasos
1.  Crear el archivo `jobs/index.js` para inicializar y programar estas tareas.
2.  Implementar cada job como un módulo separado en la carpeta `jobs/`.
3.  Configurar la inyección de dependencias necesaria (servicios de base de datos, servicio de storage, mailer).
