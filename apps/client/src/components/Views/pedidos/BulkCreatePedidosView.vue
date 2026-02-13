<script setup>
  import { useMutation } from '@tanstack/vue-query';
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import * as XLSX from 'xlsx';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { bulkCreatePedidos } from '@/services/pedidos.service';

  const router = useRouter();

  const file = ref(null);
  const parsedData = ref([]);
  const isProcessing = ref(false);
  const showPreview = ref(false);

  const headers = [
    { title: 'Cliente (ID)', key: 'id_cliente' },
    { title: 'Creador (ID)', key: 'id_usuario_creador' }, // Optional
    { title: 'Producto (ID)', key: 'id_producto' },
    { title: 'Cantidad', key: 'cantidad' },
    { title: 'Precio', key: 'precio_historico' },
    { title: 'Detalles (JSON)', key: 'detalles_producto' },
  ];

  function downloadTemplate () {
    const ws = XLSX.utils.json_to_sheet([
      { 
        id_cliente: 'UUID_CLIENTE', 
        id_usuario_creador: 'UUID_CREADOR (Opcional)', 
        id_producto: 'UUID_PRODUCTO', 
        cantidad: 1, 
        precio_historico: 100, 
        detalles_producto: '{"talla":"M", "color":"Azul"}' 
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Transform flat structure to nested structure if needed
        // Expected Backend Structure:
        // [ { id_cliente, id_usuario_creador, detalles: [ { id_producto, cantidad, precio_historico, details... } ] }, ... ]
            
        // Current flat row: { id_cliente, id_producto, cantidad, ... }
        // Group by id_cliente (and maybe create separate orders per row or group them?)
        // Usually bulk upload implies one row = one detail line, but we need to group them into orders.
        // Let's assume grouping by `id_cliente` is risky if one client has multiple separate orders.
        // Maybe we need a `group_id` or `numero_pedido` column in Excel to group items?
        // Or just treat each row as a separate order with 1 item?
        // Or assume the Excel represents a list of *orders* where details are flattened?
        // Let's grouping by `id_cliente` adjacent rows? 
            
        // Simplest approach: Each row is a separate order OR we use a "Reference" column.
        // Let's assume for now 1 Row = 1 Order with 1 Item (simplest) OR
        // Better: Group by `id_reference` if provided, otherwise 1 order.
        // Wait, standard bulk pattern usually has a grouping key.
        // Let's add `referencia_pedido` to template.
            
        // For now, let's map each row to a potential order item.
        // I will implement a simple Grouper by Customer for now, or just 1-to-1 if no grouping key.
        // Let's stick to 1 row = 1 item, and we group by client + sequential?
        // Actually, usually bulk uploads for orders are complex. 
        // Let's keep it simple: List of items.
        // The backend `bulkStore` expects `[{ id_cliente, detalles: [...] }, ...]`.
            
        // Let's group by `id_cliente` for now.
        const grouped = {};
        for (const row of jsonData) {
          const key = row.id_cliente; 
          if (!grouped[key]) {
            grouped[key] = {
              id_cliente: row.id_cliente,
              id_usuario_creador: row.id_usuario_creador || null,
              detalles: []
            };
          }
          grouped[key].detalles.push({
            id_producto: row.id_producto,
            cantidad: row.cantidad,
            precio_historico: row.precio_historico,
            detalles_producto: row.detalles_producto ? JSON.parse(row.detalles_producto || '{}') : {}
          });
        }
            
        parsedData.value = Object.values(grouped);
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
    mutate(parsedData.value);
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
            <li>Llene los datos requeridos (IDs deben ser UUIDs válidos).</li>
            <li>El campo 'detalles_producto' debe ser un JSON válido stringified (opcional).</li>
            <li>Las filas se agruparán por <strong>ID Cliente</strong> (un pedido por cliente en el archivo).</li>
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
            Se encontraron <strong>{{ parsedData.length }}</strong> pedidos para crear (Agrupados por Cliente).
          </v-alert>
                    
          <v-expansion-panels class="mb-4" variant="accordion">
            <v-expansion-panel v-for="(pedido, index) in parsedData.slice(0, 5)" :key="index">
              <v-expansion-panel-title>
                Pedido {{ index + 1 }} - Cliente: {{ pedido.id_cliente }} ({{ pedido.detalles.length }} items)
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cant.</th>
                      <th>Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(d, i) in pedido.detalles" :key="i">
                      <td>{{ d.id_producto }}</td>
                      <td>{{ d.cantidad }}</td>
                      <td>{{ d.precio_historico }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
          <div v-if="parsedData.length > 5" class="text-center text-caption mb-4">
            ... y {{ parsedData.length - 5 }} más
          </div>

          <div class="d-flex justify-end gap-2">
            <v-btn variant="text" @click="router.back()">Cancelar</v-btn>
            <v-btn
              color="success"
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
