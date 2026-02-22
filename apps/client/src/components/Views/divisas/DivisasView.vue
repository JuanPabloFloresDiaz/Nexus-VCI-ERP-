<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { useHead } from '@unhead/vue';
  import { useDebounce } from '@vueuse/core';
  import { computed, ref, watch } from 'vue';
  import CreateDivisaModal from '@/components/modals/divisas/CreateDivisaModal.vue';
  import DeleteDivisaModal from '@/components/modals/divisas/DeleteDivisaModal.vue';
  import UpdateDivisaModal from '@/components/modals/divisas/UpdateDivisaModal.vue';
  import { getDivisas } from '@/services/divisas.service';
  import { useAuth } from '@/hooks/useAuth';

  // --- SEO ---
  useHead({
    title: 'Catálogo de Divisas',
    meta: [
      { name: 'description', content: 'Administración del catálogo de monedas permitidas en el ERP.' }
    ]
  });

  const { isSuperAdmin } = useAuth();

  // State
  const search = ref('');
  const debouncedSearch = useDebounce(search, 300);
  const page = ref(1);
  const limit = ref(10);
  
  const createModalOpen = ref(false);
  const updateModalOpen = ref(false);
  const deleteModalOpen = ref(false);
  const selectedItem = ref(null);

  // Query
  const queryParams = computed(() => ({
    page: page.value,
    limit: limit.value,
    search: debouncedSearch.value
  }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['divisas', queryParams],
    queryFn: () => getDivisas(queryParams.value),
    keepPreviousData: true
  });

  const divisas = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  // Headers
  const headers = computed(() => {
    const base = [
      { title: 'Nombre de Divisa', key: 'nombre_divisa', align: 'start' },
      { title: 'Código ISO', key: 'codigo_iso', align: 'center' },
      { title: 'Símbolo', key: 'simbolo', align: 'center' }
    ];
    // Solo SuperAdmin ve y tiene columna de acciones
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
        <h1 class="text-h5 font-weight-bold text-secondary">Catálogo de Divisas</h1>
        <div class="text-subtitle-2 text-medium-emphasis">
          Gestión de monedas permitidas de operación.
        </div>
      </div>
      <v-spacer />
      <v-btn
        v-if="isSuperAdmin"
        color="primary"
        prepend-icon="mdi-plus"
        @click="createModalOpen = true"
      >
        Nueva Divisa
      </v-btn>
    </div>

    <!-- Toolbar -->
    <div class="d-flex align-center pa-4 gap-4 bg-grey-lighten-5 border-b">
      <v-text-field
        v-model="search"
        bg-color="white"
        density="compact"
        hide-details
        placeholder="Buscar divisa..."
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
      :items="divisas"
      :items-length="totalItems"
      :items-per-page="limit"
      :loading="isLoading"
    >
      <template #item.codigo_iso="{ item }">
        <v-chip class="font-weight-bold" color="primary" size="small" variant="outlined">
          {{ item.codigo_iso }}
        </v-chip>
      </template>

      <template #item.simbolo="{ item }">
        <div class="font-weight-bold text-h6">{{ item.simbolo }}</div>
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
    <CreateDivisaModal
      v-model="createModalOpen"
      @success="refetch"
    />

    <UpdateDivisaModal
      v-model="updateModalOpen"
      :divisa="selectedItem"
      @success="refetch"
    />

    <DeleteDivisaModal
      v-model="deleteModalOpen"
      :divisa="selectedItem"
      @success="refetch"
    />
  </div>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
.gap-1 { gap: 4px; }
</style>
