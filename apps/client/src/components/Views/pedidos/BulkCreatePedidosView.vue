<script setup>
  import { useMutation, useQuery } from '@tanstack/vue-query';
  import { useHead } from '@unhead/vue';
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import * as XLSX from 'xlsx';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { getAlmacenesList } from '@/services/almacenes.service';
  import { bulkCreatePedidos } from '@/services/pedidos.service';
  import { getProductos } from '@/services/productos.service';

  // --- SEO ---
  useHead({
    title: 'Carga Masiva de Pedidos',
    meta: [
      { name: 'description', content: 'Importación masiva de pedidos históricos o nuevos desde Excel.' }
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });

  const router = useRouter();

  const file = ref(null);
  const parsedData = ref([]);
  const isProcessing = ref(false);
  const showPreview = ref(false);
  const selectedWarehouse = ref(null);

  const { data: almacenesData } = useQuery({
    queryKey: ['almacenes-list-bulk-pedidos'],
    queryFn: () => getAlmacenesList()
  });

  const { data: productosData } = useQuery({
    queryKey: ['productos-list-bulk-pedidos'],
    queryFn: () => getProductos({ limit: 10_000 })
  });

  const productosMap = computed(() => {
    const skuMap = {};
    const nameMap = {};

    if (productosData.value?.data) for (const p of productosData.value?.data) {
      if (p.nombre_producto) nameMap[p.nombre_producto.toLowerCase().trim()] = p;
      if (p.variantes) {
        for (const v of p.variantes) {
          if (v.sku) {
            skuMap[v.sku.toLowerCase().trim()] = {
              ...v,
              product_name_display: `${p.nombre_producto} (${v.sku})`,
              parent_product: p
            };
          }
        }
      }
    }

    return { skuMap, nameMap };
  });

  function downloadTemplate () {
    const ws = XLSX.utils.json_to_sheet([
      { 
        nombre_cliente: 'Juan',
        apellido_cliente: 'Perez',
        dui_cliente: '12345678-9',
        correo_cliente: 'juan@example.com',
        telefono_cliente: '7777-7777',
        sku_producto: 'SKU-001', 
        cantidad: 1, 
        precio_unitario: 100, 
        fecha_pedido: '2023-12-31',
        estado: 'Completado' 
      },
      { 
        nombre_cliente: 'Juan', 
        apellido_cliente: 'Perez',
        dui_cliente: '12345678-9',
        correo_cliente: 'juan@example.com',
        telefono_cliente: '7777-7777',
        sku_producto: 'SKU-002', 
        cantidad: 2, 
        precio_unitario: 50, 
        fecha_pedido: '2023-12-31',
        estado: 'Completado' 
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Pedidos");
    XLSX.writeFile(wb, `plantilla_pedidos_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  function handleFileUpload (event) {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    isProcessing.value = true;
    const reader = new FileReader();

    reader.addEventListener('load', (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        groupAndValidate(jsonData);
        
        showPreview.value = true;
      } catch (error) {
        showErrorToast('Error al procesar el archivo. Verifique el formato.');
        console.error(error);
      } finally {
        isProcessing.value = false;
      }
    });
    reader.readAsArrayBuffer(uploadedFile);
  }

  function groupAndValidate(rows) {
    if (rows.length === 0) {
      parsedData.value = [];
      return;
    }

    const grouped = {};
    
    for (const [index, row] of rows.entries()) {
      // Identity Key: DUI or Email or Name+Apellido
      const dui = (row.dui_cliente || '').toString().trim();
      const email = (row.correo_cliente || '').toString().trim();
        
      // If neither DUI nor Email is present, skip or error? 
      // Plan says Email is required.
      if (!email && !dui) {
        // Maybe log error? For now skip invalid rows to avoid crash
        continue;
      }

      const key = dui || email; // Prefer DUI as key

      if (!grouped[key]) {
        // Excel Date Parsing
        let rawDate = row.fecha_pedido;
        let finalDate = null;
        if (typeof rawDate === 'number') {
          // Excel Serial Date to JS Date
          const date = new Date((rawDate - 25_569) * 86_400 * 1000);
          // Adjust for timezone or just use UTC date part
          // Excel dates are technically "floating", but usually interpreted as local.
          // However, the formula gives UTC timestamp for that "floating" date at 00:00 UTC.
          // So .toISOString().split('T')[0] gives the correct YYYY-MM-DD.
          // Note: There's a 2-day bug in Excel (1900 is not leap, plus 1-based), but usually offset 25569 covers 1970+.
          // Let's perform a quick sanity check: 45305 -> 1705190400000 -> 2024-01-14.
          // If the user is in GMT-6, new Date(1705190400000) is Jan 13 18:00.
          // using .toISOString() uses UTC (Jan 14). So it is correct.
          finalDate = isNaN(date) ? null : date.toISOString().split('T')[0];
        } else if (typeof rawDate === 'string' && rawDate.trim() !== '') {
          finalDate = rawDate.trim();
        }

        grouped[key] = {
          // Client Data Object
          cliente: {
            nombre_cliente: row.nombre_cliente,
            apellido_cliente: row.apellido_cliente,
            dui_cliente: dui,
            correo_cliente: email,
            telefono_cliente: row.telefono_cliente
          },
          // Order Metadata (Take from first row)
          fecha_pedido: finalDate,
          estado_pedido: row.estado,
                
          detalles: [],
          valid: true,
          errors: []
        };
      }
        
      const group = grouped[key];
        
      // Validation: Client Fields
      if (!group.cliente.nombre_cliente || !group.cliente.apellido_cliente || !group.cliente.correo_cliente) {
        group.valid = false;
        if (!group.errors.includes('Datos de cliente incompletos (Nombre, Apellido, Correo)')) {
          group.errors.push('Datos de cliente incompletos (Nombre, Apellido, Correo)');
        }
      }

      // Product Resolution
      const sku = (row.sku_producto || '').toString().trim().toLowerCase();
      const name = (row.sku_producto || row.producto || '').toString().trim().toLowerCase(); // Fallback to 'producto' col if they use old template? No, force new column 'sku_producto' but keep robust.

      let foundVariant = null;
        
      // 1. Try SKU (Exact Match)
      if (productosMap.value.skuMap[sku]) {
        foundVariant = productosMap.value.skuMap[sku];
      } 
      // 2. Try Name (Fallback for simple products)
      else if (productosMap.value.nameMap[name]) {
        const p = productosMap.value.nameMap[name];
        if (p.variantes?.length === 1) {
          foundVariant = { ...p.variantes[0], product_name_display: p.nombre_producto, parent_product: p };
        } else {
          group.valid = false;
          group.errors.push(`Fila ${index + 2}: Producto '${name}' ambiguo (múltiples variantes). Use SKU.`);
        }
      } else {
        group.valid = false;
        group.errors.push(`Fila ${index + 2}: Producto/SKU '${sku || name}' no encontrado.`);
      }

      if (foundVariant) {
        group.detalles.push({
          sku: foundVariant.sku, // Send SKU to backend
          id_variante: foundVariant.id, // Keep ID for frontend display if needed, but backend uses SKU now? 
          // Wait, Controller uses SKU to find variant.
                
          cantidad: Number(row.cantidad) || 1,
          precio_historico: Number(row.precio_unitario) || foundVariant.precio_unitario,
          detalles_producto: {}, // JSON parsing if column exists? Let's assume standard simple import for now.
          display_name: foundVariant.product_name_display
        });
      }
    }

    parsedData.value = Object.values(grouped);
  }

  const { mutate, isPending } = useMutation({
    mutationFn: bulkCreatePedidos,
    onSuccess: (data) => {
      showSuccessToast(`${data.data?.length || 0} pedidos creados exitosamente`);
      router.push('/main/pedidos');
    },
    onError: (error) => {
      // Improve error message display
      const msg = error.response?.data?.message || error.message || 'Error en carga masiva';
      showErrorToast(msg);
    }
  });

  function uploadData () {
    if (!selectedWarehouse.value) {
      showErrorToast('Debe seleccionar un almacén origen');
      return;
    }

    const invalid = parsedData.value.filter(g => !g.valid);
    if (invalid.length > 0) {
      showErrorToast(`Hay ${invalid.length} pedidos con errores. Revise la vista previa.`);
      return;
    }
    
    // Payload construction matches new Schema
    const pedidosPayload = parsedData.value.map(g => ({
      cliente: g.cliente,
      fecha_pedido: g.fecha_pedido, // Frontend should ensure format? Excel usually gives YYYY-MM-DD string or number. 
      // If string '2023-12-31', it's fine.
      estado_pedido: g.estado_pedido,
      detalles: g.detalles.map(d => ({
        sku: d.sku,
        cantidad: Number(d.cantidad),
        precio_historico: Number(d.precio_historico),
        detalles_producto: d.detalles_producto
      }))
    }));

    mutate({
      pedidos: pedidosPayload,
      id_almacen_origen: selectedWarehouse.value
    });
  }
</script>

<template>
  <v-container class="pa-6" fluid>
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold text-secondary">Carga Masiva de Pedidos</h1>
      <p class="text-body-1 text-medium-emphasis">Importar pedidos históricos o masivos dede Excel</p>
    </div>

    <v-card class="pa-6 border rounded-lg" elevation="0" max-width="800">
      <div class="d-flex align-center justify-space-between mb-6">
        <div>
          <h2 class="text-h6">Instrucciones</h2>
          <ul class="ml-4 text-body-2 text-medium-emphasis mt-2">
            <li>Descargue la plantilla actualizada.</li>
            <li><strong>Cliente:</strong> Llene Nombre, Apellido y Correo (Obligatorios). DUI (Opcional).</li>
            <li><strong>Producto:</strong> Use SKU válido del sistema.</li>
            <li><strong>Configuración:</strong> Puede especificar Fecha y Estado (Completado/Pendiente).</li>
          </ul>
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-download"
          variant="tonal"
          @click="downloadTemplate"
        >
          Descargar Plantilla
        </v-btn>
      </div>

      <v-select
        v-model="selectedWarehouse"
        class="mb-4"
        item-title="nombre_almacen"
        item-value="id"
        :items="almacenesData?.data || []"
        label="Almacén Origen"
        :rules="[v => !!v || 'Requerido']"
        variant="outlined"
      />

      <v-file-input
        v-model="file"
        accept=".xlsx, .xls"
        label="Seleccionar archivo Excel (.xlsx)"
        :loading="isProcessing"
        prepend-icon="mdi-file-excel"
        show-size
        variant="outlined"
        @change="handleFileUpload"
      />

      <v-slide-y-transition>
        <div v-if="parsedData.length > 0" class="mt-4">
          <v-alert class="mb-4" type="info" variant="tonal">
            Se encontraron <strong>{{ parsedData.length }}</strong> pedidos potenciales.
          </v-alert>
                    
          <v-expansion-panels class="mb-4" variant="accordion">
            <v-expansion-panel 
              v-for="(pedido, index) in parsedData" 
              :key="index"
              :class="{'border-error': !pedido.valid}"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center w-100">
                  <v-icon class="mr-2" :color="pedido.valid ? 'success' : 'error'">
                    {{ pedido.valid ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                  </v-icon>
                  <div>
                    <div class="font-weight-bold">
                      {{ pedido.cliente.nombre_cliente }} {{ pedido.cliente.apellido_cliente }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ pedido.cliente.dui_cliente || pedido.cliente.correo_cliente }} | 
                      {{ pedido.fecha_pedido || 'Fecha Actual' }} | {{ pedido.estado_pedido || 'Completado' }}
                    </div>
                  </div>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div v-if="!pedido.valid" class="text-error bg-error-lighten-5 pa-2 mb-2 rounded">
                  <div v-for="(err, k) in pedido.errors" :key="k">{{ err }}</div>
                </div>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>Producto / SKU</th>
                      <th>Cant.</th>
                      <th>Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(d, i) in pedido.detalles" :key="i">
                      <td>{{ d.display_name }}</td>
                      <td>{{ d.cantidad }}</td>
                      <td>{{ d.precio_historico }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <div class="d-flex justify-end gap-2">
            <v-btn variant="text" @click="router.back()">Cancelar</v-btn>
            <v-btn
              color="success"
              :disabled="parsedData.some(p => !p.valid)"
              :loading="isPending"
              prepend-icon="mdi-cloud-upload"
              @click="uploadData"
            >
              Procesar Pedidos
            </v-btn>
          </div>
        </div>
      </v-slide-y-transition>
    </v-card>
  </v-container>
</template>

<style scoped>
.border-error {
    border: 1px solid rgb(var(--v-theme-error)) !important;
}
</style>
