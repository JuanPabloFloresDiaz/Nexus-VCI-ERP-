<script setup>
import { useMutation, useQuery } from '@tanstack/vue-query';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import * as XLSX from 'xlsx';
import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
import { bulkCreatePedidos } from '@/services/pedidos.service';
import { getProductos } from '@/services/productos.service';

const router = useRouter();

const file = ref(null);
const parsedData = ref([]);
const isProcessing = ref(false);
const showPreview = ref(false);

// --- Data Fetching ---
const { data: productosData } = useQuery({
    queryKey: ['productos-list-bulk-pedidos'],
    queryFn: () => getProductos({ limit: 10000 })
});

const productosMap = computed(() => {
    const skuMap = {};
    const nameMap = {};

    productosData.value?.data?.forEach(p => {
        if (p.nombre_producto) nameMap[p.nombre_producto.toLowerCase().trim()] = p;
        if (p.variantes) {
            p.variantes.forEach(v => {
                if (v.sku) {
                    skuMap[v.sku.toLowerCase().trim()] = {
                        ...v,
                        product_name_display: `${p.nombre_producto} (${v.sku})`,
                        parent_product: p
                    };
                }
            });
        }
    });

    return { skuMap, nameMap };
});

function downloadTemplate () {
    const ws = XLSX.utils.json_to_sheet([
      { 
        id_cliente: 'UUID_CLIENTE (o ID)', 
        id_usuario_creador: '', 
        producto: 'SKU-001 (o Nombre)', 
        cantidad: 1, 
        precio: 100, 
        detalles_json: '{}' 
      },
      { 
        id_cliente: 'UUID_CLIENTE (o ID)', 
        id_usuario_creador: '', 
        producto: 'Camisa Polo', 
        cantidad: 2, 
        precio: 150, 
        detalles_json: '{}' 
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
    
    rows.forEach((row, index) => {
        if (!row.id_cliente && !row.producto) return; // Skip empty

        const clientId = (row.id_cliente || '').toString().trim();
        const key = clientId;

        if (!grouped[key]) {
            grouped[key] = {
                id_cliente: clientId,
                id_usuario_creador: row.id_usuario_creador || null,
                detalles: [],
                valid: true,
                errors: []
            };
        }
        
        const group = grouped[key];
        const prodId = (row.producto || '').toString().trim().toLowerCase();
        
        // Resolve Variant
        let foundVariant = null;
        
        // 1. Try SKU
        if (productosMap.value.skuMap[prodId]) {
            foundVariant = productosMap.value.skuMap[prodId];
        } 
        // 2. Try Name
        else if (productosMap.value.nameMap[prodId]) {
            const p = productosMap.value.nameMap[prodId];
            if (p.variantes?.length === 1) {
                foundVariant = { ...p.variantes[0], product_name_display: p.nombre_producto, parent_product: p };
            } else {
                group.valid = false;
                group.errors.push(`Fila ${index + 2}: Producto '${row.producto}' ambiguo (múltiples variantes). Use SKU.`);
            }
        } else {
            group.valid = false;
            group.errors.push(`Fila ${index + 2}: Producto '${row.producto}' no encontrado.`);
        }

        if (foundVariant) {
             group.detalles.push({
                id_producto: foundVariant.parent_product?.id,
                id_variante: foundVariant.id, // KEY FIELD
                cantidad: row.cantidad || 1,
                precio_historico: row.precio || foundVariant.precio_unitario, // Use excel price or current price
                detalles_producto: row.detalles_json ? JSON.parse(row.detalles_json || '{}') : {},
                display_name: foundVariant.product_name_display,
                sku: foundVariant.sku
            });
        }
    });

    parsedData.value = Object.values(grouped);
}

const { mutate, isPending } = useMutation({
    mutationFn: bulkCreatePedidos,
    onSuccess: (data) => {
      showSuccessToast(`${data.data?.length || 0} pedidos creados exitosamente`);
      router.push('/main/pedidos');
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.message || 'Error en carga masiva');
    }
});

function uploadData () {
    const invalid = parsedData.value.filter(g => !g.valid);
    if (invalid.length > 0) {
        showErrorToast(`Hay ${invalid.length} pedidos con errores. Revise la vista previa.`);
        return;
    }
    
    // Payload construction
    const payload = parsedData.value.map(g => ({
        id_cliente: g.id_cliente,
        id_usuario_creador: g.id_usuario_creador,
        detalles: g.detalles.map(d => ({
            id_variante: d.id_variante,
            cantidad: Number(d.cantidad),
            precio_historico: Number(d.precio_historico),
            detalles_producto: d.detalles_producto
        }))
    }));

    mutate(payload);
}
</script>

<template>
  <v-container class="pa-6" fluid>
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold text-primary">Carga Masiva de Pedidos</h1>
      <p class="text-body-1 text-medium-emphasis">Importar pedidos desde Excel</p>
    </div>

    <v-card class="pa-6 border rounded-lg" elevation="0" max-width="800">
      <div class="d-flex align-center justify-space-between mb-6">
        <div>
          <h2 class="text-h6">Instrucciones</h2>
          <ul class="ml-4 text-body-2 text-medium-emphasis mt-2">
            <li>Descargue la plantilla de Excel.</li>
            <li>Columna 'Producto': Use SKU (recomendado) o Nombre exacto (solo para productos sin variantes).</li>
            <li>Columna 'id_cliente': UUID del cliente.</li>
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
                v-for="(pedido, index) in parsedData.slice(0, 50)" 
                :key="index"
                :class="{'border-error': !pedido.valid}"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center w-100">
                    <v-icon :color="pedido.valid ? 'success' : 'error'" class="mr-2">
                        {{ pedido.valid ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                    </v-icon>
                    Pedido {{ index + 1 }} - Cliente: {{ pedido.id_cliente }}
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
              :loading="isPending"
              prepend-icon="mdi-cloud-upload"
              @click="uploadData"
              :disabled="parsedData.some(p => !p.valid)"
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
