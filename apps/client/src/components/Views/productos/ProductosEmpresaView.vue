<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { useDebounce } from '@vueuse/core';
  import { computed, ref, watch } from 'vue';
  import AsyncAvatar from '@/components/common/AsyncAvatar.vue';
  import FichaProductoModal from '@/components/modals/productos/FichaProductoModal.vue';
  import { getProductos } from '@/services/productos.service';
  import { useHead } from '@unhead/vue';

  // --- SEO ---
  useHead({
    title: 'Catálogo de Productos',
    meta: [
      { name: 'description', content: 'Visualiza el catálogo de productos disponibles en tu empresa.' }
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });

  // State
  const search = ref('');
  const debouncedSearch = useDebounce(search, 300);
  const page = ref(1);
  const limit = ref(10);

  // Query
  const queryParams = computed(() => ({
    page: page.value,
    limit: limit.value,
    search: debouncedSearch.value
  }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['productos', queryParams],
    queryFn: () => getProductos(queryParams.value),
    keepPreviousData: true
  });

  const productos = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  // Headers
  const headers = [
    { title: 'Producto', key: 'nombre_producto', align: 'start' },
    { title: 'Subcategoría', key: 'subcategoria.nombre_subcategoria', align: 'start' },
    { title: 'Precio', key: 'precio_unitario', align: 'end' },
    { title: 'Stock', key: 'stock_actual', align: 'center' },
    { title: 'Acciones', key: 'actions', align: 'end', sortable: false }
  ];

  const selectedItem = ref(null);
  const showFichaModal = ref(false);

  function handleView (item) {
    selectedItem.value = item;
    showFichaModal.value = true;
  }

  function formatCurrency (value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  // Reset page on search
  watch(debouncedSearch, () => {
    page.value = 1;
  });
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <!-- Header -->
    <div class="d-flex align-center pa-4 gap-4 bg-white border-b">
      <div>
        <h1 class="text-h5 font-weight-bold">Catálogo de Productos</h1>
        <div class="text-subtitle-2 text-medium-emphasis">
          Visualiza los productos disponibles en tu empresa
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="d-flex align-center pa-4 gap-4 bg-grey-lighten-5 border-b">
      <v-text-field
        v-model="search"
        bg-color="white"
        density="compact"
        hide-details
        placeholder="Buscar producto..."
        prepend-inner-icon="mdi-magnify"
        style="max-width: 300px"
        variant="outlined"
      />
      <v-spacer />
      <v-btn icon :loading="isLoading" variant="text" @click="refetch">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </div>

    <!-- Table -->
    <v-data-table-server
      v-model:page="page"
      class="flex-grow-1"
      density="comfortable"
      :headers="headers"
      hover
      :items="productos"
      :items-length="totalItems"
      :items-per-page="limit"
      :loading="isLoading"
    >
      <template #item.nombre_producto="{ item }">
        <div class="d-flex align-center gap-2">
          <AsyncAvatar
            :name="item.nombre_producto"
            rounded="lg"
            size="40"
            :src="item.imagen_url"
          />
          <div>
            <div class="font-weight-medium">{{ item.nombre_producto }}</div>
            <div class="text-caption text-medium-emphasis text-truncate" style="max-width: 200px;">
              {{ item.descripcion_producto }}
            </div>
          </div>
        </div>
      </template>

      <template #item.precio_unitario="{ item }">
        <div class="font-weight-medium">{{ formatCurrency(item.precio_unitario) }}</div>
      </template>

      <template #item.stock_actual="{ item }">
        <v-chip
          :color="item.stock_actual <= item.stock_minimo ? 'error' : 'success'"
          size="small"
          variant="tonal"
        >
          {{ item.stock_actual }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <v-btn
          color="primary"
          icon
          size="small"
          variant="text"
          @click="handleView(item)"
        >
          <v-icon>mdi-eye</v-icon>
          <v-tooltip activator="parent" location="top">Ver Ficha</v-tooltip>
        </v-btn>
      </template>

      <template #no-data>
        <div class="d-flex flex-column align-center justify-center py-8 text-medium-emphasis">
          <v-icon class="mb-2 opacity-50" icon="mdi-package-variant-closed" size="48" />
          <span>No se encontraron productos</span>
        </div>
      </template>
    </v-data-table-server>
        
    <FichaProductoModal
      v-model="showFichaModal"
      :producto="selectedItem"
    />
  </div>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
