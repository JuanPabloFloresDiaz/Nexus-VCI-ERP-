<script setup>
  import { useMutation, useQuery } from '@tanstack/vue-query';
  import { useHead } from '@unhead/vue';
  import Swal from 'sweetalert2';
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import * as XLSX from 'xlsx';
  import { getAlmacenesList } from '@/services/almacenes.service';
  import { createBulkCompras } from '@/services/compras.service';
  import { getProductos } from '@/services/productos.service';
  import { getProveedores } from '@/services/proveedores.service';

  // --- SEO ---
  useHead({
    title: 'Nuevas Compras masivas',
    meta: [
      { name: 'description', content: 'Registro de nuevas compras masivas de inventario.' }
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });

  const router = useRouter();

  // --- State ---
  const file = ref(null);
  const parsedData = ref([]);
  const loading = ref(false);
  const processing = ref(false);
  const selectedWarehouse = ref(null);

  // --- Data Fetching for Validation/Mapping ---
  const { data: almacenesData } = useQuery({
    queryKey: ['almacenes-list-bulk'],
    queryFn: () => getAlmacenesList()
  });

  const { data: productosData } = useQuery({
    queryKey: ['productos-list-bulk'],
    queryFn: () => getProductos({ limit: 10_000 })
  });

  const { data: proveedoresData } = useQuery({
    queryKey: ['proveedores-list-bulk'],
    queryFn: () => getProveedores('limit=1000')
  });

  const productosMap = computed(() => {
    // Map SKU -> Variant Obj
    // Map Name -> Product Obj
    const skuMap = {};
    const nameMap = {};

    if (productosData.value?.data) for (const p of productosData.value?.data) {
      if (p.nombre_producto) nameMap[p.nombre_producto.toLowerCase().trim()] = p;
        
      if (p.variantes && p.variantes.length > 0) {
        for (const v of p.variantes) {
          if (v.sku) {
            skuMap[v.sku.toLowerCase().trim()] = {
              ...v,
              // enriched info
              product_name_display: `${p.nombre_producto} (${v.sku})`,
              parent_product: p
            };
          }
        }
      }
    }

    return { skuMap, nameMap };
  });

  const proveedoresMap = computed(() => {
    const map = {};
    if (proveedoresData.value?.data) for (const p of proveedoresData.value?.data) {
      if (p.nombre_proveedor) map[p.nombre_proveedor.toLowerCase().trim()] = p.id;
    }
    return map;
  });

  // --- Methods ---

  function downloadTemplate() {
    const data = [
      {
        nombre_proveedor: 'Distribuidora Ejemplo',
        producto: 'SKU-001', // SKU Priority
        cantidad: 10,
        precio_costo: 15.5,
        fecha_entrega: '2024-03-20',
        estado: 'Recibido'
      },
      {
        nombre_proveedor: 'Distribuidora Ejemplo',
        producto: 'Camisa Polo', // Name (only if single variant)
        cantidad: 5,
        precio_costo: 50,
        fecha_entrega: '2024-03-20',
        estado: 'Recibido'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Compras");
    XLSX.writeFile(wb, "plantilla_compras_variantes.xlsx");
  }

  function processFile() {
    if (!file.value) return;
    
    processing.value = true;
    const reader = new FileReader();
    
    reader.addEventListener('load', (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
            
        groupAndValidate(json);
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo leer el archivo', 'error');
      } finally {
        processing.value = false;
      }
    });
    
    reader.readAsArrayBuffer(file.value);
  }

  function groupAndValidate(rows) {
    if (rows.length === 0) {
      parsedData.value = [];
      return;
    }

    const groups = {};

    for (const [index, row] of rows.entries()) {
      // Skip empty rows
      if (!row.nombre_proveedor && !row.producto) continue;

      const provName = (row.nombre_proveedor || '').toString().trim();
      
      // Excel Date Parsing
      let rawDate = row.fecha_entrega;
      let finalDate = null;
      if (typeof rawDate === 'number') {
        // Excel Serial Date to JS Date
        // 25569 is offset for 1970-01-01
        const date = new Date((rawDate - 25_569) * 86_400 * 1000);
        finalDate = isNaN(date) ? null : date.toISOString().split('T')[0];
      } else if (typeof rawDate === 'string' && rawDate.trim() !== '') {
        // Try to handle DD/MM/YYYY manually if needed, or rely on standard string
        // If format is DD/MM/YYYY, simple Date() might fail or parse as MM/DD/YYYY depending on locale.
        // Let's assume standard ISO or let backend handle if valid string.
        // But user screenshot shows 20/2/2026.
        if (rawDate.includes('/')) {
          const parts = rawDate.split('/');
          if (parts.length === 3 && // Assume DD/MM/YYYY
            parts[2].length === 4) {
            finalDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        } else {
          finalDate = rawDate.trim();
        }
      }

      const dateKey = finalDate || 'SIN_FECHA';
      const key = `${provName}|${dateKey}`;

      if (!groups[key]) {
        groups[key] = {
          valid: true,
          errors: [],
          id_proveedor: proveedoresMap.value[provName.toLowerCase()] || null,
          nuevo_proveedor: proveedoresMap.value[provName.toLowerCase()] ? null : { nombre_proveedor: provName },
          nombre_proveedor: provName,
          fecha_entrega_estimada: finalDate, // Use parsed date
          estado_compra: row.estado || 'Recibido',
          detalles: []
        };
      }

      const group = groups[key];
        
      // Product Logic
      const prodIdentifier = (row.producto || '').toString().trim().toLowerCase();
      let foundVariant = null;
      let foundProduct = null;

      // 1. Try SKU
      if (productosMap.value.skuMap[prodIdentifier]) {
        foundVariant = productosMap.value.skuMap[prodIdentifier];
      } 
      // 2. Try Name
      else if (productosMap.value.nameMap[prodIdentifier]) {
        foundProduct = productosMap.value.nameMap[prodIdentifier];
        // Check Variants logic
        if (foundProduct.variantes && foundProduct.variantes.length === 1) {
          foundVariant = {
            ...foundProduct.variantes[0],
            product_name_display: foundProduct.nombre_producto,
            parent_product: foundProduct
          };
        } else if (foundProduct.variantes && foundProduct.variantes.length > 1) {
          // Ambiguous
          group.valid = false;
          group.errors.push(`Fila ${index + 2}: Producto '${row.producto}' tiene múltiples variantes. Use el SKU específico.`);
          continue; // Skip adding detail
        } else {
          // No variants?
          group.valid = false;
          group.errors.push(`Fila ${index + 2}: Producto '${row.producto}' no tiene variantes configuradas.`);
          continue;
        }
      } 
      else {
        group.valid = false;
        group.errors.push(`Fila ${index + 2}: Producto/SKU '${row.producto}' no encontrado.`);
        continue;
      }

      if (!row.cantidad || row.cantidad <= 0) {
        group.valid = false;
        group.errors.push(`Fila ${index + 2}: Cantidad inválida.`);
      }

      // Add
      if (foundVariant) {
        group.detalles.push({
          id_variante: foundVariant.id,
          id_producto: foundVariant.parent_product?.id,
          cantidad: row.cantidad,
          precio_costo_historico: row.precio_costo || 0,
          product_name: foundVariant.product_name_display || row.producto
        });
      }
    }

    parsedData.value = Object.values(groups);
  }

  const { mutate } = useMutation({
    mutationFn: createBulkCompras,
    onSuccess: (data) => {
      Swal.fire({
        icon: 'success',
        title: 'Carga Completada',
        text: `Se crearon ${data.data.length} órdenes de compra exitosamente`
      });
      router.push('/main/compras');
    },
    onError: (error) => {
      Swal.fire('Error', error.response?.data?.message || 'Falló la carga masiva', 'error');
    },
    onSettled: () => {
      loading.value = false;
    }
  });

  function submit() {
    if (!selectedWarehouse.value) {
      Swal.fire('Error', 'Debe seleccionar un almacén destino', 'error');
      return;
    }

    const invalidGroups = parsedData.value.filter(g => !g.valid);
    if (invalidGroups.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Errores detectados',
        html: `Hay ${invalidGroups.length} grupos con errores.<br>Corrige el archivo y vuelve a subirlo.<br><br>
            <div class="text-left" style="max-height: 200px; overflow-y: auto;">
            ${invalidGroups.flatMap(g => g.errors).map(e => `<small>- ${e}</small>`).join('<br>')}
            </div>`
      });
      return;
    }

    if (parsedData.value.length === 0) return;

    loading.value = true;
    
    // Prepare payload
    const comprasPayload = parsedData.value.map(g => ({
      id_proveedor: g.id_proveedor,
      nuevo_proveedor: g.nuevo_proveedor,
      fecha_entrega_estimada: g.fecha_entrega_estimada,
      estado_compra: g.estado_compra,
      detalles: g.detalles.map(d => ({
        id_variante: d.id_variante, // Crucial Change
        cantidad: Number(d.cantidad),
        precio_costo_historico: Number(d.precio_costo_historico)
      }))
    }));

    mutate({
      compras: comprasPayload,
      id_almacen_destino: selectedWarehouse.value
    });
  }
</script>

<template>
  <v-container class="pa-6" fluid>
    <div class="mb-6 d-flex flex-wrap align-center justify-space-between">
      <div>
        <h1 class="text-h4 font-weight-bold text-secondary">Carga Masiva de Compras</h1>
        <p class="text-body-1 text-medium-emphasis">Importar compras desde Excel</p>
      </div>
      <v-btn prepend-icon="mdi-arrow-left" variant="text" @click="router.back()">
        Volver
      </v-btn>
    </div>

    <v-card class="rounded-lg pa-6 border" elevation="0">
      <v-row align="center">
        <v-col cols="12" md="6">
          <v-select
            v-model="selectedWarehouse"
            class="mb-4"
            item-title="nombre_almacen"
            item-value="id"
            :items="almacenesData?.data || []"
            label="Almacén Destino"
            :rules="[v => !!v || 'Requerido']"
            variant="outlined"
          />
          <v-file-input
            v-model="file"
            accept=".xlsx, .xls"
            label="Seleccionar Archivo Excel"
            :loading="processing"
            prepend-icon="mdi-microsoft-excel"
            show-size
            variant="outlined"
            @update:model-value="processFile"
          />
        </v-col>
        <v-col class="d-flex justify-end gap-2" cols="12" md="6">
          <v-btn color="info" prepend-icon="mdi-download" variant="tonal" @click="downloadTemplate">
            Descargar Plantilla
          </v-btn>
          <v-btn 
            color="primary" 
            :disabled="parsedData.length === 0 || loading" 
            :loading="loading" 
            prepend-icon="mdi-upload"
            @click="submit"
          >
            Procesar Carga
          </v-btn>
        </v-col>
      </v-row>

      <v-expand-transition>
        <div v-if="parsedData.length > 0" class="mt-6">
          <div class="text-h6 mb-2">Previsualización (Agrupado por Proveedor/Fecha)</div>
                    
          <v-expansion-panels variant="accordion">
            <v-expansion-panel
              v-for="(group, i) in parsedData"
              :key="i"
              :class="{'border-error': !group.valid}"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center gap-4 w-100">
                  <v-icon :color="group.valid ? 'success' : 'error'">
                    {{ group.valid ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                  </v-icon>
                  <div class="font-weight-bold">{{ group.nombre_proveedor }}</div>
                  <div class="text-caption">{{ group.detalles.length }} productos</div>
                  <v-spacer />
                  <div class="text-caption text-medium-emphasis mr-4">
                    {{ group.fecha_entrega_estimada || 'Sin Fecha' }}
                  </div>
                  <v-chip :color="group.valid ? 'success' : 'error'" size="small" variant="tonal">
                    {{ group.valid ? 'Válido' : 'Errores' }}
                  </v-chip>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div v-if="!group.valid" class="text-error bg-error-lighten-5 pa-2 rounded mb-2">
                  <ul>
                    <li v-for="(err, k) in group.errors" :key="k">{{ err }}</li>
                  </ul>
                </div>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>Producto / SKU</th>
                      <th>Cant.</th>
                      <th>Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(d, k) in group.detalles" :key="k">
                      <td>{{ d.product_name }}</td>
                      <td>{{ d.cantidad }}</td>
                      <td>${{ d.precio_costo_historico }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </v-expand-transition>
    </v-card>
  </v-container>
</template>

<style scoped>
.border-error {
    border: 1px solid rgb(var(--v-theme-error)) !important;
}
</style>
