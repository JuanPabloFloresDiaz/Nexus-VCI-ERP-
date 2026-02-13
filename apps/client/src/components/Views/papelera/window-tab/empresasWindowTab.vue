<template>
  <div>
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      class="elevation-0 bg-transparent"
      :headers="headers"
      :items="items"
      :items-length="totalItems"
      :loading="isFetching"
      :search="search"
      @update:options="loadItems"
    >
      <template #top>
        <v-toolbar class="mb-4" color="transparent" density="compact" flat>
          <v-text-field
            v-model="search"
            class="mr-4 bg-white"
            density="compact"
            hide-details
            label="Buscar empresas eliminadas..."
            prepend-inner-icon="mdi-magnify"
            single-line
            style="max-width: 400px"
            variant="outlined"
          />
          <v-spacer />
          <v-btn icon variant="text" @click="refresh">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-toolbar>
      </template>

      <!-- Logo Column -->
      <template #item.logo_url="{ item }">
        <AsyncAvatar 
          class="elevation-1" 
          :name="item.nombre_empresa" 
          size="32" 
          :src="item.logo_url"
        />
      </template>

      <!-- Actions Column -->
      <template #item.actions="{ item }">
        <div class="d-flex justify-end gap-2">
          <v-tooltip location="top" text="Restaurar">
            <template #activator="{ props }">
              <v-btn 
                color="success" 
                icon 
                size="small" 
                variant="soft" 
                v-bind="props" 
                @click="openRestoreModal(item)"
              >
                <v-icon>mdi-restore</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip location="top" text="Eliminar permanentemente">
            <template #activator="{ props }">
              <v-btn 
                color="error" 
                icon 
                size="small" 
                variant="soft" 
                v-bind="props" 
                @click="openDeleteModal(item)"
              >
                <v-icon>mdi-delete-forever</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </template>

      <template #no-data>
        <div class="pa-8 text-center text-medium-emphasis">
          <v-icon class="mb-2 opacity-50" icon="mdi-delete-empty" size="48" />
          <div>Papelera vacía</div>
        </div>
      </template>
    </v-data-table-server>

    <!-- Modals -->
    <RestoreModal
      v-model="showRestore"
      :item-name="selectedItem?.nombre_empresa"
      :loading="restoreMutation.isPending.value"
      @confirm="handleRestore"
    />

    <DeleteModal
      v-model="showDelete"
      :item-name="selectedItem?.nombre_empresa"
      :loading="deleteMutation.isPending.value"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup>
  import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import AsyncAvatar from '@/components/common/AsyncAvatar.vue';
  import DeleteModal from '@/components/modals/papelera/DeleteModal.vue';
  import RestoreModal from '@/components/modals/papelera/RestoreModal.vue';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { forceDeleteEmpresa, getTrashedEmpresas, restoreEmpresa } from '@/services/empresas.service';

  const queryClient = useQueryClient();

  // Table State
  const itemsPerPage = ref(10);
  const page = ref(1);
  const search = ref('');
  const sortBy = ref([]);

  const headers = [
    { title: 'Logo', key: 'logo_url', sortable: false, width: '60px' },
    { title: 'Empresa', key: 'nombre_empresa', align: 'start' },
    { title: 'NIT', key: 'nit_empresa', align: 'start' },
    { title: 'Eliminado el', key: 'deleted_at', align: 'start', value: item => new Date(item.deleted_at).toLocaleDateString() },
    { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
  ];

  // Query Parameters
  const queryParams = computed(() => {
    const offset = (page.value - 1) * itemsPerPage.value;
    let order = '';
    if (sortBy.value.length > 0) {
      order = `${sortBy.value[0].key},${sortBy.value[0].order.toUpperCase()}`;
    }
    
    return new URLSearchParams({
      limit: itemsPerPage.value,
      offset,
      search: search.value,
      order
    }).toString();
  });

  // Fetch Data with useQuery
  const { data: trashedData, isLoading, isFetching } = useQuery({
    queryKey: ['empresas', 'trashed', queryParams],
    queryFn: () => getTrashedEmpresas(queryParams.value),
    keepPreviousData: true
  });

  const items = computed(() => trashedData.value?.data || []);
  const totalItems = computed(() => trashedData.value?.count || 0);

  // Modal State
  const showRestore = ref(false);
  const showDelete = ref(false);
  const selectedItem = ref(null);

  // Mutations
  const restoreMutation = useMutation({
    mutationFn: (id) => restoreEmpresa(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas', 'trashed'] });
      // Also invalidate active companies list if needed
      queryClient.invalidateQueries({ queryKey: ['empresas', 'active'] }); 
        
      showRestore.value = false;
      showSuccessToast('La empresa ha sido restaurada exitosamente');
    },
    onError: (error) => {
      console.error(error);
      showErrorToast('No se pudo restaurar la empresa');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => forceDeleteEmpresa(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas', 'trashed'] });
        
      showDelete.value = false;
      showSuccessToast('La empresa ha sido eliminada permanentemente');
    },
    onError: (error) => {
      console.error(error);
      showErrorToast('No se pudo eliminar la empresa');
    }
  });

  // Methods
  function loadItems ({ page: newPage, itemsPerPage: newLimit, sortBy: newSortBy }) {
    page.value = newPage;
    itemsPerPage.value = newLimit;
    sortBy.value = newSortBy;
  }

  function refresh () {
    queryClient.invalidateQueries({ queryKey: ['empresas', 'trashed'] });
  }

  // Modal Wrappers
  function openRestoreModal (item) {
    selectedItem.value = item;
    showRestore.value = true;
  }

  function openDeleteModal (item) {
    selectedItem.value = item;
    showDelete.value = true;
  }

  // Actions
  function handleRestore () {
    if (!selectedItem.value) return;
    restoreMutation.mutate(selectedItem.value.id);
  }

  function handleDelete () {
    if (!selectedItem.value) return;
    deleteMutation.mutate(selectedItem.value.id);
  }
</script>
