```markdown
# Plan de Refactorización: Nexus VCI

## 1. Lógica de Inventario Multibodega

### ¿Por qué implementarlo ahora?
*   **Realidad del Negocio:** En El Salvador, incluso una empresa pequeña suele tener una "Bodega Central" y el "Punto de Venta" (Sala de ventas). Sin separación de stock, el sistema asume una ubicación única.
*   **Refactorización de Compras:** Al recibir una compra, es indispensable indicar a qué bodega ingresa la mercadería.

### Propuesta de Cambio Mínimo
*   **Tabla `almacenes`**: `(id, id_empresa, nombre_almacen, ubicacion_almacen, es_principal)`
*   **Tabla `stock_almacenes`**: `(id, id_variante, id_almacen, stock_actual)`
    *   *Restricción:* `UNIQUE KEY unique_stock_almacen (id_variante, id_almacen)`
*   **Cambio en `producto_variantes`**: Eliminar el campo `stock_actual`. El stock total será ahora la suma de las existencias en todos los almacenes asociados a dicha variante.

---

## 2. Reportes Inteligentes (IA Local)
Para implementar "Reportes Inteligentes" sin costos de APIs externas ni servidores pesados, se sugieren las siguientes librerías de JavaScript:

### A. Brain.js (Redes Neuronales)
Ideal para predicciones numéricas (regresiones).
*   **Uso:** Entrenar modelos ligeros con el historial de pedidos para predecir tendencias de ventas mensuales.

### B. ML.js (Machine Learning)
Conjunto de algoritmos para análisis avanzado:
*   **K-Means (Clustering):** Segmentación de clientes según frecuencia y monto de compra.
*   **Random Forest / Decision Trees:** Predicción de riesgos de ruptura de stock basados en tiempos de entrega de proveedores.

---

## 3. Datos Adicionales Requeridos

### Nuevos Campos en `proveedores`
*   `nit_dui_proveedor` (VARCHAR 20)
*   `direccion_proveedor` (TEXT)
*   `categoria_suministro` (VARCHAR 100)
*   `descripcion_productos_provee` (TEXT)
*   `dias_credito` (INT): Permite a la IA alertar sobre vencimientos de facturas y gestión de liquidez.

### Métodos de Pago y Referencias
*   **Tablas:** `compras` y `pedidos`.
*   **Campos:** `metodo_pago` (ENUM) y `referencia_pago` (VARCHAR).
*   **Propósito:** Predecir el flujo de caja real.

### Kardex / Historial de Movimientos
*   **Nueva Tabla `movimientos_inventario`**: `(id, id_variante, id_almacen, cantidad, tipo_movimiento, id_referencia)`
*   **Tipos:** Compra, Venta, Ajuste, Traslado.
*   **Propósito:** Trazabilidad total del stock.

---

## 4. Ajustes en Compras y Ventas
Para gestionar correctamente el origen y destino de la mercadería:

*   **Tabla `compras`**: Agregar `id_almacen_destino`.
*   **Tabla `pedidos`**: Agregar `id_almacen_origen`.
```

### Plan de implementación:

#### Fase 1: Preparación y Dependencias
- [x] **Instalación de paquetes para IA y Matemáticas:**
    - `npm install brain.js ml-matrix ml-cart` (Brain.js para redes neuronales, ML.js para árboles de decisión/clustering)
- [x] **Verificación de entorno:**
    - Asegurar que MariaDB esté corriendo y accesible.
    - Asegurar que `sequelize-cli` funcione correctamente.

#### Fase 2: Base de Datos (Migraciones)
- [x] **Crear tabla `almacenes`:**
    - Campos: `id`, `id_empresa`, `nombre_almacen`, `ubicacion`, `es_principal`, `created_at`, `updated_at`, `deleted_at`.
- [x] **Crear tabla `stock_almacenes`:**
    - Campos: `id`, `id_variante`, `id_almacen`, `stock_actual`, `created_at`, `updated_at`, `deleted_at`.
    - Clave única compuesta: `(id_variante, id_almacen)`.
- [x] **Crear tabla `movimientos_inventario` (Kardex):**
    - Campos: `id`, `id_variante`, `id_almacen`, `tipo_movimiento` (ENUM: 'Compra', 'Venta', 'Ajuste', 'Traslado'), `cantidad`, `costo_unitario`, `id_referencia` (Id de la compra/pedido), `fecha_movimiento`, `created_at`, `updated_at`, `deleted_at`.
- [x] **Actualizar tabla `proveedores`:**
    - Agregar: `nit_dui`, `direccion`, `dias_credito`.
- [x] **Actualizar tabla `compras`:**
    - Agregar: `id_almacen_destino`, `metodo_pago`, `referencia_pago`.
- [x] **Actualizar tabla `pedidos`:**
    - Agregar: `id_almacen_origen` (De donde sale la mercadería).
- [x] **Migración de Datos (Script):**
    - Crear un script que mueva el `stock_actual` existente en `producto_variantes` a un "Almacén Principal" por defecto en `stock_almacenes`.

#### Fase 3: Backend Core (Modelos y Controladores)
- [x] **Modelos Sequelize:**
    - Crear `Almacen.js`, `StockAlmacen.js`, `MovimientoInventario.js`.
    - Actualizar `Compra.js`, `Pedido.js`, `Proveedor.js`.
    - Definir asociaciones (HasMany, BelongsTo) entre Variantes <-> Stock <-> Almacenes.
- [x] **Refactorización `ProductosController`:**
    - `getProductos`: Incluir sumatoria de stock desde `stock_almacenes`.
- [x] **Refactorización `ComprasController`:**
    - `store/update`: Al recibir compra, incrementar stock en `stock_almacenes` (no en variantes) y registrar `movimiento_inventario`.
- [x] **Refactorización `PedidosController`:**
    - `store/update`: Al vender, decrementar stock de `stock_almacenes` y registrar `movimiento_inventario`.
- [x] **Nuevo `InventarioController`:**
    - Endpoints para transferencias entre almacenes.
    - Endpoint para consultar Kardex.

#### Fase 5: Inteligencia Artificial (Servicios)
- [ ] **Servicio `PredictionService.js`:**
    - Implementar lógica con `brain.js` para predecir demanda futura basada en historial de `pedidos`.
- [ ] **Servicio `RecomendacionCompraService.js`:**
    - Algoritmo que analice `stock_minimo`, `dias_credito` de proveedor y velocidad de venta para sugerir reabastecimiento.
- [ ] **Endpoints de Reportes Inteligentes:**
    - `GET /api/kpis/prediccion-ventas`
    - `GET /api/kpis/sugerencia-compras`
