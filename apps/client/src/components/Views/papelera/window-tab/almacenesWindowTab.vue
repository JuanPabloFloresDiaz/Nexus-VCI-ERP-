<script setup>
  import { useMutation, useQuery } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import { showConfirmDialog, showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { forceDestroyAlmacen, getTrashedAlmacenes, restoreAlmacen } from '@/services/almacenes.service';

  const page = ref(1);
  const limit = ref(10);
  const search = ref('');

  const queryParams = computed(() => ({
    page: page.value,
    limit: limit.value,
    search: search.value
  }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trashedAlmacenes', queryParams],
    queryFn: () => getTrashedAlmacenes(queryParams.value),
    keepPreviousData: true
  });

  const headers = [
    { title: 'Almacén', align: 'start', key: 'nombre_almacen' },
    { title: 'Ubicación', align: 'start', key: 'ubicacion' },
    { title: 'Eliminado', align: 'start', key: 'deleted_at' },
    { title: 'Acciones', align: 'end', key: 'actions', sortable: false }
  ];

  const items = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  const { mutate: restoreMutate, isPending: isRestoring } = useMutation({
    mutationFn: restoreAlmacen,
    onSuccess: () => {
      showSuccessToast('Almacén restaurado exitosamente');
      refetch();
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al restaurar almacén');
    }
  });

  const { mutate: deleteMutate, isPending: isDeleting } = useMutation({
    mutationFn: forceDestroyAlmacen,
    onSuccess: () => {
      showSuccessToast('Almacén eliminado definitivamente');
      refetch();
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al eliminar almacén');
    }
  });

  async function handleRestore (item) {
    const confirmed = await showConfirmDialog(
      '¿Restaurar almacén?',
      `El almacén "${item.nombre_almacen}" volverá a estar activo.`
    );
    if (confirmed) {
      restoreMutate(item.id);
    }
  }

  async function handleForceDelete (item) {
    const confirmed = await showConfirmDialog(
      '¿Eliminar definitivamente?',
      `Esta acción no se puede deshacer. El almacén "${item.nombre_almacen}" se borrará permanentemente.`,
      'warning'
    );
    if (confirmed) {
      deleteMutate(item.id);
    }
  }

  function formatDate (dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <div class="d-flex align-center pa-4 gap-4 border-b bg-surface">
      <v-text-field
        v-model="search"
        bg-color="grey-lighten-5"
        density="compact"
        hide-details
        placeholder="Buscar almacén eliminado..."
        prepend-inner-icon="mdi-magnify"
        style="max-width: 300px"
        variant="outlined"
      />
      <v-spacer />
      <v-btn icon :loading="isLoading" variant="text" @click="refetch">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </div>

    <v-data-table-server
      v-model:page="page"
      class="flex-grow-1"
      density="comfortable"
      :headers="headers"
      hover
      :items="items"
      :items-length="totalItems"
      :items-per-page="limit"
      :loading="isLoading"
    >
      <template #item.nombre_almacen="{ item }">
        <div class="font-weight-medium text-body-2">
          {{ item.nombre_almacen }}
        </div>
        <v-chip v-if="item.es_principal" class="mt-1" color="primary" size="x-small" variant="flat">
          Principal
        </v-chip>
      </template>

      <template #item.deleted_at="{ item }">
        <span class="text-caption text-medium-emphasis">
          {{ formatDate(item.deleted_at) }}
        </span>
      </template>

      <template #item.actions="{ item }">
        <div class="d-flex justify-end gap-2">
          <v-tooltip location="top" text="Restaurar">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                color="success"
                density="comfortable"
                icon
                :loading="isRestoring"
                size="small"
                variant="tonal"
                @click="handleRestore(item)"
              >
                <v-icon size="18">mdi-restore</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-tooltip location="top" text="Eliminar definitivamente">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                color="error"
                density="comfortable"
                icon
                :loading="isDeleting"
                size="small"
                variant="tonal"
                @click="handleForceDelete(item)"
              >
                <v-icon size="18">mdi-delete-forever</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </template>

      <template #no-data>
        <div class="d-flex flex-column align-center justify-center py-8 text-medium-emphasis">
          <v-icon class="mb-2 opacity-50" icon="mdi-delete-empty" size="48" />
          <span>No hay almacenes en la papelera</span>
        </div>
      </template>
    </v-data-table-server>
  </div>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
