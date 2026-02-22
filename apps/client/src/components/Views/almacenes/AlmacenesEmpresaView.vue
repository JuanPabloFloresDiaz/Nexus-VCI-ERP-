<template>
  <v-container fluid>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4 font-weight-bold text-secondary">Mis Almacenes</h1>
      <!-- Vendors might not create warehouses, only view them. If they can, uncomment btn -->
      <!-- <v-btn color="primary" prepend-icon="mdi-plus" to="/almacenes/crear">New</v-btn> -->
    </div>

    <v-card>
      <v-card-title>
        <v-text-field
          v-model="search"
          class="max-width-300"
          density="compact"
          hide-details
          label="Buscar Almacén"
          prepend-inner-icon="mdi-magnify"
          single-line
          variant="outlined"
          @update:model-value="handleSearch"
        />
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
        <template #item.es_principal="{ item }">
          <v-chip :color="item.es_principal ? 'success' : 'default'">
            {{ item.es_principal ? 'Principal' : 'Secundario' }}
          </v-chip>
        </template>
        


        <!-- No Actions for Vendor/Empresa View unless specified -->
        <template #item.actions="{ item }">
          <!-- Maybe view details? For now empty -->
        </template>
      </v-data-table-server>
    </v-card>
  </v-container>
</template>

<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { useHead } from '@unhead/vue';
  import { ref, watch } from 'vue';
  import { getAlmacenes } from '@/services/almacenes.service';

  useHead({
    title: 'Mis Almacenes | Nexus ERP',
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });

  const headers = [
    { title: 'Nombre', key: 'nombre_almacen', align: 'start' },
    { title: 'Ubicación', key: 'ubicacion' },
    { title: 'Tipo', key: 'es_principal', align: 'center' },
  // { title: 'Acciones', key: 'actions', align: 'end', sortable: false }
  ];

  const search = ref('');
  const itemsPerPage = ref(10);
  const page = ref(1);
  const sortBy = ref([]);

  const loadParams = ref({
    page: 1,
    limit: 10,
    search: ''
  });

  // Query
  const { data, isLoading } = useQuery({
    queryKey: ['almacenes-empresa', loadParams],
    queryFn: () => getAlmacenes(loadParams.value), // Should already be filtered by company in backend
    keepPreviousData: true
  });

  const serverItems = ref([]);
  const totalItems = ref(0);

  watch(data, (newVal) => {
    if (newVal?.data) {
      serverItems.value = newVal.data;
      totalItems.value = newVal.count || newVal.data.length;
    }
  });

  function loadItems({ page: p, itemsPerPage: ipp, sortBy: sort, search: s }) {
    page.value = p;
    itemsPerPage.value = ipp;
    sortBy.value = sort;
  
    loadParams.value = {
      page: p,
      limit: ipp,
      search: s
    };
  }

  function handleSearch(val) {
    search.value = val;
    loadParams.value.search = val;
    loadParams.value.page = 1;
  }
</script>

<style scoped>
.max-width-300 {
  max-width: 300px;
}
</style>
