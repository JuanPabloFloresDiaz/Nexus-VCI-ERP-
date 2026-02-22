### 🛠️ Implementación: Configuración Global, Divisas y Tasas de Cambio

Esta actualización integra un sistema de localización financiera en **Nexus VCI**, permitiendo la gestión multimoneda y la automatización de tipos de cambio mediante servicios externos.

---

#### 1. Estructura de Base de Datos (Tablas)

Todas las tablas utilizan **UUID** como llave primaria y cuentan con campos de auditoría (`created_at`, `updated_at`, `deleted_at`) para garantizar la trazabilidad exigida por el sistema.

* **`divisas`**: Catálogo maestro de monedas.
    * `id`: `CHAR(36)` (UUID).
    * `nombre_divisa`: `VARCHAR(50)`.
    * `codigo_iso`: `CHAR(3)` (Unique, ej: USD, GTQ).
    * `simbolo`: `VARCHAR(5)`.
* **`tasas_cambio`**: Repositorio de paridad cambiaria.
    * `id`: `CHAR(36)` (UUID).
    * `codigo_iso_origen`: `CHAR(3)`.
    * `codigo_iso_destino`: `CHAR(3)`.
    * `tasa_cambio`: `DECIMAL(15, 6)`.
* **`configuraciones_globales`**: Configuración regional por empresa.
    * `id_empresa`: `CHAR(36)` (PK, Relación 1:1 con `empresas`).
    * `id_divisa_base`: `CHAR(36)` (FK a `divisas`).

---

#### 2. Lógica de Automatización (Node-cron & API)

Para mantener los valores financieros actualizados sin intervención manual, se implementará la siguiente lógica:



* **API Externa**: Sincronización con `exchangerate-api.com`.
* **Job Programado**: Uso de `node-cron` para ejecutar una actualización automática cada día a las **4:00 AM**.
* **Endpoint Manual**: `POST /api/v1/config/sync-rates`. Permite ejecutar la sincronización en entornos de desarrollo (Docker) o bajo demanda por el **SuperAdministrador**.

---

#### 3. Matriz de Permisos (RBAC)

El acceso a estos módulos está restringido para asegurar la integridad de los costos y precios:

1.  **SuperAdministrador**: Único con acceso total a las tablas de `divisas` y `tasas_cambio`, además de la ejecución del endpoint de sincronización.
2.  **Administrador de Empresa**: Puede visualizar las tasas y es el único con permiso para modificar la `configuracion_global` (divisa base) de su propia empresa.

---

#### 4. Plan de Migraciones

Se utilizará una migración independiente por cada tabla para asegurar la consistencia:

1.  **Migración Divisas**: Creación de la tabla e inserción de la semilla (seed) con divisas centroamericanas (USD, GTQ, HNL, NIO, CRC, PAB).
2.  **Migración Tasas de Cambio**: Creación de la tabla y carga de valores iniciales.
3.  **Migración Configuración Global**: Creación de la tabla y vinculación de empresas existentes a la divisa USD por defecto.