<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { useHead } from '@unhead/vue';
  import { useDebounce } from '@vueuse/core';
  import { computed, ref, watch } from 'vue';
  import CreateTasaCambio from '@/components/modals/tasas/CreateTasaCambio.vue';
  import DeleteTasaCambio from '@/components/modals/tasas/DeleteTasaCambio.vue';
  import UpdateTasaCambio from '@/components/modals/tasas/UpdateTasaCambio.vue';
  import CalculadoraDivisasModal from '@/components/modals/tasas/CalculadoraDivisasModal.vue';
  import { getTasasCambio } from '@/services/tasasCambio.service';
  import { useAuth } from '@/hooks/useAuth';

  // --- SEO ---
  useHead({
    title: 'Tasas de Cambio',
    meta: [
      { name: 'description', content: 'Administración de la paridad de divisas para el ERP.' }
    ]
  });

  // State
  const search = ref('');
  const debouncedSearch = useDebounce(search, 300);
  const page = ref(1);
  const limit = ref(10);
  
  const createModalOpen = ref(false);
  const updateModalOpen = ref(false);
  const deleteModalOpen = ref(false);
  const calculatorModalOpen = ref(false);
  const selectedItem = ref(null);

  const { isSuperAdmin } = useAuth();

  // Query
  const queryParams = computed(() => ({
    page: page.value,
    limit: limit.value,
    search: debouncedSearch.value
  }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tasas-cambio', queryParams],
    queryFn: () => getTasasCambio(queryParams.value),
    keepPreviousData: true
  });

  const tasas = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  // Headers
  const headers = computed(() => {
    const base = [
      { title: 'Divisa Origen', key: 'origen_format', align: 'start' },
      { title: 'Divisa Destino', key: 'destino_format', align: 'start' },
      { title: 'Tasa de Cambio', key: 'tasa_cambio', align: 'center' }
    ];
    if (isSuperAdmin.value) {
      base.push({ title: 'Acciones', key: 'actions', align: 'end', sortable: false });
    }
    return base;
  });

  // Actions
  function handleEdit (item) {
    selectedItem.value = item;
    updateModalOpen.value = true;
  }

  function handleDelete (item) {
    selectedItem.value = item;
    deleteModalOpen.value = true;
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
        <h1 class="text-h5 font-weight-bold text-secondary">Tasas de Cambio</h1>
        <div class="text-subtitle-2 text-medium-emphasis">
          Gestión de paridad cambiaria entre monedas operativas.
        </div>
      </div>
      <v-spacer />
      <v-btn
        color="secondary"
        variant="tonal"
        prepend-icon="mdi-calculator"
        @click="calculatorModalOpen = true"
      >
        Convertidor
      </v-btn>
      <v-btn
        v-if="isSuperAdmin"
        color="primary"
        prepend-icon="mdi-plus"
        @click="createModalOpen = true"
      >
        Nueva Tasa
      </v-btn>
    </div>

    <!-- Toolbar -->
    <div class="d-flex align-center pa-4 gap-4 bg-grey-lighten-5 border-b">
      <v-text-field
        v-model="search"
        bg-color="white"
        density="compact"
        hide-details
        placeholder="Buscar por ISO..."
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
      :items="tasas"
      :items-length="totalItems"
      :items-per-page="limit"
      :loading="isLoading"
    >
      <template #item.origen_format="{ item }">
        <div class="d-flex align-center gap-2">
          <v-avatar color="primary" size="32" variant="tonal">
            {{ item.divisa_origen?.simbolo || '$' }}
          </v-avatar>
          <div class="font-weight-bold">{{ item.divisa_origen?.nombre_divisa || 'N/A' }} </div>
          <v-chip color="grey-darken-1" size="x-small" variant="flat">{{ item.codigo_iso_origen }}</v-chip>
        </div>
      </template>

      <template #item.destino_format="{ item }">
        <div class="d-flex align-center gap-2">
          <v-avatar color="secondary" size="32" variant="tonal">
            {{ item.divisa_destino?.simbolo || '$' }}
          </v-avatar>
          <div class="font-weight-bold">{{ item.divisa_destino?.nombre_divisa || 'N/A' }} </div>
          <v-chip color="grey-darken-1" size="x-small" variant="flat">{{ item.codigo_iso_destino }}</v-chip>
        </div>
      </template>

      <template #item.tasa_cambio="{ item }">
        <v-chip
          class="font-weight-bold" 
          color="success"
          size="small"
          variant="tonal"
        >
          1 {{ item.codigo_iso_origen }} = {{ item.tasa_cambio }} {{ item.codigo_iso_destino }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <div class="d-flex justify-end gap-1">
          <v-btn
            color="primary"
            icon
            size="small"
            variant="text"
            @click="handleEdit(item)"
          >
            <v-icon>mdi-pencil</v-icon>
            <v-tooltip activator="parent" location="top">Editar</v-tooltip>
          </v-btn>
          <v-btn
            color="error"
            icon
            size="small"
            variant="text"
            @click="handleDelete(item)"
          >
            <v-icon>mdi-delete</v-icon>
            <v-tooltip activator="parent" location="top">Eliminar</v-tooltip>
          </v-btn>
        </div>
      </template>
    </v-data-table-server>

    <!-- Modals -->
    <CreateTasaCambio
      v-model="createModalOpen"
      @success="refetch"
    />

    <UpdateTasaCambio
      v-model="updateModalOpen"
      :tasa="selectedItem"
      @success="refetch"
    />

    <DeleteTasaCambio
      v-model="deleteModalOpen"
      :tasa="selectedItem"
      @success="refetch"
    />

    <CalculadoraDivisasModal 
      v-model="calculatorModalOpen" 
    />
  </div>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
.gap-1 { gap: 4px; }
</style>
