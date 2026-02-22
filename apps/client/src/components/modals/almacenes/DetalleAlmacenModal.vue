<template>
  <v-dialog v-model="dialog" max-width="900px" scrollable>
    <v-card>
      <v-toolbar color="primary" dark>
        <v-toolbar-title>Detalle de Almacén</v-toolbar-title>
        <v-spacer />
        <v-btn dark icon @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-4">
        <v-row v-if="almacen">
          <v-col cols="12" md="6">
            <div class="text-subtitle-1 font-weight-bold">Nombre:</div>
            <div class="text-body-1">{{ almacen.nombre_almacen }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-subtitle-1 font-weight-bold">Ubicación:</div>
            <div class="text-body-1">{{ almacen.ubicacion || 'N/A' }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-subtitle-1 font-weight-bold">Tipo:</div>
            <v-chip :color="almacen.es_principal ? 'success' : 'default'" size="small">
              {{ almacen.es_principal ? 'Principal' : 'Secundario' }}
            </v-chip>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-subtitle-1 font-weight-bold">Estado:</div>
            <v-chip :color="totalStockItems > 0 ? 'success' : 'default'" size="small">
              {{ totalStockItems > 0 ? 'Activo' : 'Inactivo' }}
            </v-chip>
          </v-col>
        </v-row>

        <v-divider class="my-4" />
        <h3 class="text-h6 mb-2">Inventario Actual</h3>

        <v-text-field
          v-model="searchStock"
          class="mb-3"
          density="compact"
          hide-details
          label="Buscar producto en este almacén..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          @update:model-value="handleSearchStock"
        />

        <v-data-table-server
          v-model:items-per-page="itemsPerPage"
          class="elevation-1"
          density="compact"
          :headers="headers"
          :items="stockItems"
          :items-length="totalStockItems"
          :loading="loadingStock"
          :search="searchStock"
          @update:options="loadStock"
        >
          <template #item.producto="{ item }">
            <div>
              <div class="font-weight-bold">{{ item.variante?.producto?.nombre_producto || 'Desconocido' }}</div>
              <div class="text-caption text-disabled">{{ item.variante?.sku }}</div>
            </div>
          </template>
            
          <template #item.precio_unitario="{ item }">
            {{ formatCurrency(item.variante?.precio_unitario) }}
          </template>

          <template #item.valor_total="{ item }">
            {{ formatCurrency((item.variante?.precio_unitario || 0) * item.stock_actual) }}
          </template>
        </v-data-table-server>

      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue';
  import { getStock } from '@/services/almacenes.service';

  const props = defineProps({
    modelValue: Boolean,
    almacen: Object
  });

  const emit = defineEmits(['update:modelValue']);

  const dialog = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  });

  // Stock Table Logic
  const headers = [
    { title: 'Producto', key: 'producto', align: 'start', sortable: false },
    { title: 'Variante', key: 'variante.sku', align: 'start', sortable: false },
    { title: 'Stock', key: 'stock_actual', align: 'end' },
    { title: 'Precio Unit.', key: 'precio_unitario', align: 'end', sortable: false },
    { title: 'Valor Total', key: 'valor_total', align: 'end', sortable: false }
  ];

  const stockItems = ref([]);
  const totalStockItems = ref(0);
  const loadingStock = ref(false);
  const searchStock = ref('');
  const itemsPerPage = ref(5);
  const page = ref(1);

  const loadParams = ref({
    page: 1,
    limit: 5,
    search: ''
  });

  // Watch for modal open to reset and load
  watch(() => props.modelValue, (val) => {
    if (val && props.almacen?.id) {
      searchStock.value = '';
      loadParams.value = { page: 1, limit: 5, search: '' };
      // Trigger load via table or manually if table doesn't trigger automatically on mount
    }
  });

  async function loadStock({ page: p, itemsPerPage: ipp }) {
    if (!props.almacen?.id) return;

    loadingStock.value = true;
    try {
      const res = await getStock(props.almacen.id, {
        page: p,
        limit: ipp,
        search: searchStock.value
      });
        
      if (res.data) {
        stockItems.value = res.data;
        totalStockItems.value = res.count;
      }
    } catch (error) {
      console.error("Error loading stock", error);
    } finally {
      loadingStock.value = false;
    }
  }

  function handleSearchStock(val) {
    searchStock.value = val;
    // Debounce could be added here
    loadParams.value.search = val;
    loadParams.value.page = 1;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  }
</script>
