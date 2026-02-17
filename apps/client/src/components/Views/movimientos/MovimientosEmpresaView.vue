<template>
  <v-container fluid>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4 font-weight-bold text-secondary">Mis Movimientos</h1>
      <!-- Maybe allow vendor to check stock here? -->
    </div>

    <v-card>
      <v-card-title>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Buscar Movimiento"
              single-line
              hide-details
              variant="outlined"
              density="compact"
              @update:model-value="handleSearch"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.tipo"
              label="Tipo Movimiento"
              :items="['Todos', 'Venta', 'Ajuste', 'Transferencia']" 
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="applyFilters"
            />
          </v-col>
        </v-row>
      </v-card-title>

      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="serverItems"
        :items-length="totalItems"
        :loading="isLoading"
        :search="search"
        @update:options="loadItems"
      >
        <template v-slot:item.tipo_movimiento="{ item }">
          <v-chip :color="getTypeColor(item.tipo_movimiento)">
            {{ item.tipo_movimiento }}
          </v-chip>
        </template>

        <template v-slot:item.fecha_movimiento="{ item }">
          {{ formatDate(item.fecha_movimiento) }}
        </template>
        
        <template v-slot:item.cantidad="{ item }">
           <span :class="item.cantidad < 0 ? 'text-error font-weight-bold' : 'text-success font-weight-bold'">
             {{ item.cantidad }}
           </span>
        </template>

        <template v-slot:item.details="{ item }">
           <div>
             <div class="font-weight-medium">{{ item.variante?.producto?.nombre_producto || 'Producto Desconocido' }}</div>
             <div class="text-caption text-medium-emphasis">SKU: {{ item.variante?.sku || 'N/A' }}</div>
           </div>
        </template>
      </v-data-table-server>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { getMovimientos } from '@/services/movimientos.service';
import { useHead } from '@unhead/vue';
import dayjs from 'dayjs';

useHead({
  title: 'Mis Movimientos | Nexus ERP',
  link: [
    { rel: 'canonical', href: window.location.href }
  ]
});

const headers = [
  { title: 'Fecha', key: 'fecha_movimiento', align: 'start' },
  { title: 'Tipo', key: 'tipo_movimiento' },
  { title: 'Almacén', key: 'almacen.nombre_almacen' },
  { title: 'Producto / Variante', key: 'details', sortable: false },
  { title: 'Cantidad', key: 'cantidad', align: 'end' }
];

const search = ref('');
const itemsPerPage = ref(10);
const page = ref(1);

const filters = ref({
  tipo: 'Todos'
});

const loadParams = ref({
  page: 1,
  limit: 10,
  search: '',
  tipo_movimiento: undefined,
  // id_almacen: should be filtered by backend for user/company context
});

const serverItems = ref([]);
const totalItems = ref(0);

// Query
const { data, isLoading } = useQuery({
  queryKey: ['movimientos-empresa', loadParams],
  queryFn: () => getMovimientos(loadParams.value),
  keepPreviousData: true
});

watch(data, (newVal) => {
  if (newVal?.data) {
    serverItems.value = newVal.data;
    totalItems.value = newVal.count || newVal.data.length;
  }
}, { immediate: true });

function loadItems({ page: p, itemsPerPage: ipp, itemsLength }) {
  page.value = p;
  itemsPerPage.value = ipp;
  
  loadParams.value = {
    ...loadParams.value,
    page: p,
    limit: ipp
  };
}

function handleSearch(val) {
    search.value = val;
    loadParams.value.search = val;
    loadParams.value.page = 1;
}

function applyFilters() {
    loadParams.value.page = 1;
    loadParams.value.tipo_movimiento = filters.value.tipo === 'Todos' ? undefined : filters.value.tipo;
}

function getTypeColor(type) {
    switch (type) {
        case 'Compra': return 'success';
        case 'Venta': return 'info';
        case 'Ajuste': return 'warning';
        case 'Transferencia': return 'purple';
        default: return 'default';
    }
}

function formatDate(date) {
    return dayjs(date).format('DD/MM/YYYY HH:mm');
}
</script>
