<script setup>
  import { useMutation, useQuery } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import { showConfirmDialog, showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { 
    destroyCategoria, destroySubcategoria, 
    getTrashedCategorias, getTrashedSubcategorias, 
    restoreCategoria, restoreSubcategoria 
  } from '@/services/categorizacion.service';

  const tab = ref('categorias');

  // Categorías State
  const pageCat = ref(1);
  const limitCat = ref(10);
  const searchCat = ref('');
  const queryParamsCat = computed(() => ({ page: pageCat.value, limit: limitCat.value, search: searchCat.value }));

  // Subcategorías State
  const pageSub = ref(1);
  const limitSub = ref(10);
  const searchSub = ref('');
  const queryParamsSub = computed(() => ({ page: pageSub.value, limit: limitSub.value, search: searchSub.value }));

  // Queries
  const { data: dataCat, isLoading: isLoadingCat, refetch: refetchCat } = useQuery({
    queryKey: ['trashedCategorias', queryParamsCat],
    queryFn: () => getTrashedCategorias(queryParamsCat.value),
    keepPreviousData: true,
    enabled: computed(() => tab.value === 'categorias')
  });

  const { data: dataSub, isLoading: isLoadingSub, refetch: refetchSub } = useQuery({
    queryKey: ['trashedSubcategorias', queryParamsSub],
    queryFn: () => getTrashedSubcategorias(queryParamsSub.value),
    keepPreviousData: true,
    enabled: computed(() => tab.value === 'subcategorias')
  });

  const headersCat = [
    { title: 'Categoría', align: 'start', key: 'nombre_categoria' },
    { title: 'Descripción', align: 'start', key: 'descripcion_categoria' },
    { title: 'Eliminado', align: 'start', key: 'deleted_at' },
    { title: 'Acciones', align: 'end', key: 'actions', sortable: false }
  ];

  const headersSub = [
    { title: 'Subcategoría', align: 'start', key: 'nombre_subcategoria' },
    { title: 'Categoría Padre', align: 'start', key: 'categoria' },
    { title: 'Descripción', align: 'start', key: 'descripcion_subcategoria' },
    { title: 'Eliminado', align: 'start', key: 'deleted_at' },
    { title: 'Acciones', align: 'end', key: 'actions', sortable: false }
  ];

  const itemsCat = computed(() => dataCat.value?.data || []);
  const totalCat = computed(() => dataCat.value?.count || 0);

  const itemsSub = computed(() => dataSub.value?.data || []);
  const totalSub = computed(() => dataSub.value?.count || 0);

  // Mutations for Categorias
  const { mutate: restoreMutateCat, isPending: isRestoringCat } = useMutation({
    mutationFn: restoreCategoria,
    onSuccess: () => { showSuccessToast('Categoría restaurada'); refetchCat(); },
    onError: (error) => showErrorToast(error.message || 'Error al restaurar')
  });

  const { mutate: deleteMutateCat, isPending: isDeletingCat } = useMutation({
    mutationFn: destroyCategoria,
    onSuccess: () => { showSuccessToast('Categoría eliminada definitivamente'); refetchCat(); },
    onError: (error) => showErrorToast(error.message || 'Error al eliminar')
  });

  // Mutations for Subcategorias
  const { mutate: restoreMutateSub, isPending: isRestoringSub } = useMutation({
    mutationFn: restoreSubcategoria,
    onSuccess: () => { showSuccessToast('Subcategoría restaurada'); refetchSub(); },
    onError: (error) => showErrorToast(error.message || 'Error al restaurar')
  });

  const { mutate: deleteMutateSub, isPending: isDeletingSub } = useMutation({
    mutationFn: destroySubcategoria,
    onSuccess: () => { showSuccessToast('Subcategoría eliminada definitivamente'); refetchSub(); },
    onError: (error) => showErrorToast(error.message || 'Error al eliminar')
  });

  // Handlers
  async function handleRestoreCat (item) {
    if (await showConfirmDialog('¿Restaurar categoría?', `La categoría "${item.nombre_categoria}" volverá a estar activa.`)) {
      restoreMutateCat(item.id);
    }
  }

  async function handleForceDeleteCat (item) {
    if (await showConfirmDialog('¿Eliminar definitivamente?', `La categoría "${item.nombre_categoria}" se borrará permanentemente.`, 'warning')) {
      deleteMutateCat(item.id);
    }
  }

  async function handleRestoreSub (item) {
    if (await showConfirmDialog('¿Restaurar subcategoría?', `La subcategoría "${item.nombre_subcategoria}" volverá a estar activa.`)) {
      restoreMutateSub(item.id);
    }
  }

  async function handleForceDeleteSub (item) {
    if (await showConfirmDialog('¿Eliminar definitivamente?', `La subcategoría "${item.nombre_subcategoria}" se borrará permanentemente.`, 'warning')) {
      deleteMutateSub(item.id);
    }
  }

  function formatDate (dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <v-tabs v-model="tab" bg-color="surface" color="primary">
      <v-tab value="categorias">Categorías</v-tab>
      <v-tab value="subcategorias">Subcategorías</v-tab>
    </v-tabs>

    <v-window v-model="tab" class="flex-grow-1">
      <!-- Categorias Tab -->
      <v-window-item class="h-100 d-flex flex-column" value="categorias">
        <div class="d-flex align-center pa-4 gap-4 border-b bg-surface">
          <v-text-field
            v-model="searchCat"
            bg-color="grey-lighten-5"
            density="compact"
            hide-details
            placeholder="Buscar categoría..."
            prepend-inner-icon="mdi-magnify"
            style="max-width: 300px"
            variant="outlined"
          />
          <v-spacer />
          <v-btn icon :loading="isLoadingCat" variant="text" @click="refetchCat">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>

        <v-data-table-server
          v-model:page="pageCat"
          class="flex-grow-1"
          density="comfortable"
          :headers="headersCat"
          hover
          :items="itemsCat"
          :items-length="totalCat"
          :items-per-page="limitCat"
          :loading="isLoadingCat"
        >
          <template #item.nombre_categoria="{ item }">
            <span class="font-weight-medium">{{ item.nombre_categoria }}</span>
          </template>
          <template #item.deleted_at="{ item }">
            <span class="text-caption text-medium-emphasis">{{ formatDate(item.deleted_at) }}</span>
          </template>
          <template #item.actions="{ item }">
            <div class="d-flex justify-end gap-2">
              <v-btn color="success" density="comfortable" icon :loading="isRestoringCat" size="small" variant="tonal" @click="handleRestoreCat(item)">
                <v-icon size="18">mdi-restore</v-icon>
              </v-btn>
              <v-btn color="error" density="comfortable" icon :loading="isDeletingCat" size="small" variant="tonal" @click="handleForceDeleteCat(item)">
                <v-icon size="18">mdi-delete-forever</v-icon>
              </v-btn>
            </div>
          </template>
        </v-data-table-server>
      </v-window-item>

      <!-- Subcategorias Tab -->
      <v-window-item class="h-100 d-flex flex-column" value="subcategorias">
        <div class="d-flex align-center pa-4 gap-4 border-b bg-surface">
          <v-text-field
            v-model="searchSub"
            bg-color="grey-lighten-5"
            density="compact"
            hide-details
            placeholder="Buscar subcategoría..."
            prepend-inner-icon="mdi-magnify"
            style="max-width: 300px"
            variant="outlined"
          />
          <v-spacer />
          <v-btn icon :loading="isLoadingSub" variant="text" @click="refetchSub">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>

        <v-data-table-server
          v-model:page="pageSub"
          class="flex-grow-1"
          density="comfortable"
          :headers="headersSub"
          hover
          :items="itemsSub"
          :items-length="totalSub"
          :items-per-page="limitSub"
          :loading="isLoadingSub"
        >
          <template #item.nombre_subcategoria="{ item }">
            <span class="font-weight-medium">{{ item.nombre_subcategoria }}</span>
          </template>
          <template #item.categoria="{ item }">
            <v-chip size="small" variant="tonal">{{ item.categoria?.nombre_categoria || 'N/A' }}</v-chip>
          </template>
          <template #item.deleted_at="{ item }">
            <span class="text-caption text-medium-emphasis">{{ formatDate(item.deleted_at) }}</span>
          </template>
          <template #item.actions="{ item }">
            <div class="d-flex justify-end gap-2">
              <v-btn color="success" density="comfortable" icon :loading="isRestoringSub" size="small" variant="tonal" @click="handleRestoreSub(item)">
                <v-icon size="18">mdi-restore</v-icon>
              </v-btn>
              <v-btn color="error" density="comfortable" icon :loading="isDeletingSub" size="small" variant="tonal" @click="handleForceDeleteSub(item)">
                <v-icon size="18">mdi-delete-forever</v-icon>
              </v-btn>
            </div>
          </template>
        </v-data-table-server>
      </v-window-item>
    </v-window>
  </div>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
