<template>
  <v-container fluid>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4 font-weight-bold text-secondary">Gestión de Almacenes</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" to="/main/almacenes/crear">
        Nuevo Almacén
      </v-btn>
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
        


        <template #item.actions="{ item }">
          <v-btn
            color="info"
            icon="mdi-eye"
            size="small"
            variant="text"
            @click="openDetail(item)"
          />
          <v-btn
            color="primary"
            icon="mdi-pencil"
            size="small"
            :to="`/main/almacenes/editar/${item.id}`"
            variant="text"
          />
          <v-btn
            color="error"
            icon="mdi-delete"
            size="small"
            variant="text"
            @click="openDelete(item)"
          />
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Modals -->
    <DetalleAlmacenModal v-model="showDetailModal" :almacen="selectedAlmacen" />
    <DeleteAlmacenModal v-model="showDeleteModal" :almacen="selectedAlmacen" @deleted="onDeleted" />
  </v-container>
</template>


<script setup>
  import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
  import { useHead } from '@unhead/vue';
  import Swal from 'sweetalert2';
  import { ref, watch } from 'vue';
  import DeleteAlmacenModal from '@/components/modals/almacenes/DeleteAlmacenModal.vue';

  // Import Modals
  import DetalleAlmacenModal from '@/components/modals/almacenes/DetalleAlmacenModal.vue';
  import { getAlmacenes } from '@/services/almacenes.service';

  useHead({
    title: 'Almacenes | Nexus ERP',
    meta: [{ name: 'description', content: 'Gestión de Almacenes e Inventarios' }],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });

  const queryClient = useQueryClient();

  const headers = [
    { title: 'Nombre', key: 'nombre_almacen', align: 'start' },
    { title: 'Ubicación', key: 'ubicacion' },
    { title: 'Tipo', key: 'es_principal', align: 'center' },
    { title: 'Acciones', key: 'actions', align: 'end', sortable: false }
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
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['almacenes', loadParams],
    queryFn: () => getAlmacenes(loadParams.value),
    keepPreviousData: true
  });

  const serverItems = ref([]);
  const totalItems = ref(0);

  // Reactivity fix when data is cached
  watch(data, (newVal) => {
    if (newVal?.data) {
      serverItems.value = newVal.data;
      totalItems.value = newVal.count || newVal.data.length;
    }
  }, { immediate: true });

  function loadItems({ page: p, itemsPerPage: ipp, sortBy: sort, search: s }) {
    page.value = p;
    itemsPerPage.value = ipp;
    sortBy.value = sort;
  
    loadParams.value = {
      page: p,
      limit: ipp,
      search: s,
    };
  }

  function handleSearch(val) {
    search.value = val;
    loadParams.value.search = val;
    loadParams.value.page = 1;
  }

  // Logic for Modals
  const showDetailModal = ref(false);
  const showDeleteModal = ref(false);
  const selectedAlmacen = ref(null);

  function openDetail(item) {
    selectedAlmacen.value = item;
    showDetailModal.value = true;
  }

  function openDelete(item) {
    selectedAlmacen.value = item;
    showDeleteModal.value = true;
  }

  function onDeleted() {
    refetch();
  }
</script>

<style scoped>
.max-width-300 {
  max-width: 300px;
}
</style>
