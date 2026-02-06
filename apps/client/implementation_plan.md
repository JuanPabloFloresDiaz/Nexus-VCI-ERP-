# 📋 Plan de Implementación Frontend - Nexus VCI (ERP)

## 🛠️ Tecnologías Core
* **Framework:** Vue 3 (Composition API).
* **UI Library:** Vuetify 3 (Versión estable).
* **State Management:** Pinia (Estado global de empresa y sesión).
* **Data Fetching:** Axios + TanStack Query (para caché y estados de carga).
* **Validación:** Zod (Esquemas de formularios).
* **Utilidades:** Xlsx (Reportes/Cargas) y Sentry SDK (Monitoreo Cloud).

## 🎨 Paleta de Colores y Estética (UI Design)

Para Nexus VCI, se propone una paleta **"Slate & Tech Blue"**. El objetivo es reducir la fatiga visual del administrador y proyectar una imagen de sistema robusto y moderno, alejándose de los colores planos por defecto.

### 🌑 Paleta Principal
- **Primary (Blue Tech):** #1E293B (Un azul oscuro pizarra para la barra lateral y navegación. Transmite seriedad y elegancia).
- **Secondary (Action Blue):** #3B82F6 (Un azul vibrante pero equilibrado para botones de acción principal y estados activos).
- **Accent (Gold Sand):** #F59E0B (Un ámbar suave para resaltar elementos clave como alertas de stock o estados pendientes, sin ser tan agresivo como el amarillo puro).

### 🚦 Estados y Feedback
- **Success (Emerald):** #10B981 (Para confirmaciones de pedidos y carga de Excel exitosa).
- **Error (Rosewood):** #E11D48 (Para errores críticos y validaciones).
- **Warning (Amber):** #FBBF24 (Para stock bajo o avisos preventivos).
- **Info (Sky):** #0EA5E9 (Para tooltips y guías de usuario).

### 🖥️ Superficies y Fondos
- **Background:** #F8FAFC (Un gris casi blanco, frío, que hace que el texto sea mucho más legible que el blanco puro).
- **Surface:** #FFFFFF (Blanco puro para las tarjetas de productos y filas de tablas para generar contraste).

## 📐 Reglas de Diseño UI/UX
- **Tipografía:** Roboto (500 para cuerpo, 700 para títulos) para máxima legibilidad.
- **Componentes:** - Bordes suavemente redondeados (border-radius: 8px) para un look moderno.
    - Elevaciones bajas (elevation-1) en las tablas para separar visualmente los datos del fondo.
- **Navegación:** Uso estricto de **Tabs** para procesos de varios pasos (Categorización) y **Buscador Global** con acceso rápido (Ctrl + K).
- **Minimalismo:** Evitar el uso de CSS personalizado; extender los temas de Vuetify 4 para mantener la consistencia del framework.

## 1. Módulos de Acceso y Navegación

### 🏢 Registro de Empresa y Usuario (Nuevo)
* **Funcionalidad:** Formulario tipo "Stepper" de 2 pasos.
    1. **Datos de Empresa:** Nombre, NIT/DUI, dirección y carga de Logo a Minio.
    2. **Cuenta Master:** Registro del primer usuario Administrador vinculado a esa empresa.
* **Lógica:** Generación de UUID para la empresa que heredarán todos los registros posteriores para garantizar el aislamiento de datos.

### 🔐 Login Evolucionado
* **Funcionalidad:** Autenticación con persistencia de id_empresa en el estado global.
* **Seguridad:** Interceptores de Axios para inyectar el Token y el contexto de empresa en cada petición al backend.

### 📊 Dashboard
* **Funcionalidad:** Pantalla de bienvenida con métricas clave y estadísticas rápidas de ventas.

### 🛠️ MainLayout (Menú Dinámico)
* **Opciones:** Dashboard, Usuarios, Clientes, Categorización, Productos, Pedidos, Reportes, Gráficas.
* **Buscador Global:** Capacidad de búsqueda por palabras clave. Ejemplo: Buscar "Filtros" redirigirá o mostrará las opciones de "Gestión de Productos" y "Categorización".

---

## 2. Gestión de Entidades (CRUDs)

### 🏭 Perfil de Empresa
* **Funcionalidad:** Gestión centralizada de la identidad corporativa.
* **Acciones:** Actualización de datos fiscales y personalización de la interfaz (Logos).

### 🗑️ Papelera (Exclusivo Administradores)
* **Lógica:** Interfaz basada en **Tabs** para visualizar registros con `deleted_at`.
* **Acciones:** Restauración de registros o eliminación definitiva (Hard Delete).

### 👥 Usuarios
* **Funcionalidad:** CRUD completo para Administradores y Vendedores.
* **Acciones:** Crear, actualizar, cambiar estado (activo/inactivo) y Soft Delete.

### 👤 Clientes
* **Funcionalidad:** Gestión administrativa de clientes.
* **Extras:** * Visualización de historial de pedidos por cliente.
    * **Carga Masiva:** Importación desde Excel usando `xlsx`.

### 🗂️ Categorización (Estructura Anidada)
* **Funcionalidad:** Gestión de Categorías, Subcategorías, Filtros y Opciones.
* **UX:** Uso de **Tabs** o navegación por pantallas (evitando Modales) para profundizar en la configuración de filtros (ej: Ropa -> Camisa -> Talla -> S, M, L).
* **Carga Masiva:** Plantilla de Excel para importar toda la jerarquía de golpe.

### 📦 Productos
* **Funcionalidad:** Administración de catálogo.
* **Detalles:** * Gestión de stock y estados.
    * Personalización de filtros dinámicos durante la creación/edición.
    * **Carga Masiva:** Importación de productos y detalles desde Excel.
* **Ficha de Producto:**
    * Visualización comparativa de **Costo vs. Precio**.
    * Configuración de **Stock Mínimo** (Trigger esencial para la lógica de IA).
    * Galería de imágenes integrada con el servicio de Minio.

---

## 3. Operaciones y Salidas
### 🛒 Módulo de Compras (Abastecimiento)
* **Funcionalidad:** Registro y seguimiento de entrada de mercadería.
* **Flujo de Trabajo:** Gestión de órdenes de compra con estados: `Pendiente`, `Recibido` (suma stock automáticamente) y `Cancelado`.
* **Gestión de Datos:** Soporte para restauración de registros y eliminación forzada.

### 📝 Pedidos
* **Funcionalidad:** Ciclo de vida de la venta.
* **Acciones:** CRUD de pedidos, cambio de estados y carga masiva de registros históricos mediante Excel.
* **Notificaciones:** El registro individual dispara automáticamente el servicio de correo (Noreply) de confirmación.
* **Validación:** Control de stock en tiempo real basado en inventario para evitar inconsistencias.

### 📈 Gráficas
* **Funcionalidad:** Visualización de métricas de artículos vendidos y rendimiento temporal.

### 📄 Reportes
* **Funcionalidad:** Generación de documentos y reportes de utilidad para la toma de decisiones administrativa, cada uno de estos reportes debe tener su propio modal para la configuración de filtros, rangos de fecha, además de permitir la selección de campos que se desean incluir en el reporte, debe ser generable en formato PDF o Excel.