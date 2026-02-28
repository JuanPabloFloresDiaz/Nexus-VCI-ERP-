<script setup>
  import { useMutation, useQuery } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import { showConfirmDialog, showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { forceDestroyTasaCambio, getTrashedTasasCambio, restoreTasaCambio } from '@/services/tasasCambio.service';

  const page = ref(1);
  const limit = ref(10);
  const search = ref('');

  const queryParams = computed(() => ({
    page: page.value,
    limit: limit.value,
    search: search.value
  }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trashedTasasCambio', queryParams],
    queryFn: () => getTrashedTasasCambio(queryParams.value),
    keepPreviousData: true
  });

  const headers = [
    { title: 'Divisa Origen', align: 'start', key: 'divisa_origen' },
    { title: 'Divisa Destino', align: 'start', key: 'divisa_destino' },
    { title: 'Tasa de Cambio', align: 'end', key: 'tasa_cambio' },
    { title: 'Eliminado', align: 'start', key: 'deleted_at' },
    { title: 'Acciones', align: 'end', key: 'actions', sortable: false }
  ];

  const items = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  const { mutate: restoreMutate, isPending: isRestoring } = useMutation({
    mutationFn: restoreTasaCambio,
    onSuccess: () => {
      showSuccessToast('Tasa de cambio restaurada exitosamente');
      refetch();
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al restaurar tasa de cambio');
    }
  });

  const { mutate: deleteMutate, isPending: isDeleting } = useMutation({
    mutationFn: forceDestroyTasaCambio,
    onSuccess: () => {
      showSuccessToast('Tasa de cambio eliminada definitivamente');
      refetch();
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al eliminar tasa de cambio');
    }
  });

  async function handleRestore (item) {
    const confirmed = await showConfirmDialog(
      '¿Restaurar tasa de cambio?',
      `La tasa de cambio de ${item.codigo_iso_origen} a ${item.codigo_iso_destino} volverá a estar activa.`
    );
    if (confirmed) {
      restoreMutate(item.id);
    }
  }

  async function handleForceDelete (item) {
    const confirmed = await showConfirmDialog(
      '¿Eliminar definitivamente?',
      `Esta acción no se puede deshacer. La tasa de cambio dejará de existir.`,
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
        placeholder="Buscar tasa eliminada..."
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
      <template #item.divisa_origen="{ item }">
        <div class="d-flex flex-column">
          <span class="font-weight-medium text-body-2">
            {{ item.divisa_origen?.nombre_divisa || item.codigo_iso_origen }}
          </span>
          <span class="text-caption text-medium-emphasis">{{ item.codigo_iso_origen }}</span>
        </div>
      </template>

      <template #item.divisa_destino="{ item }">
        <div class="d-flex flex-column">
          <span class="font-weight-medium text-body-2">
            {{ item.divisa_destino?.nombre_divisa || item.codigo_iso_destino }}
          </span>
          <span class="text-caption text-medium-emphasis">{{ item.codigo_iso_destino }}</span>
        </div>
      </template>

      <template #item.tasa_cambio="{ item }">
        <span class="font-weight-bold text-primary">
          {{ item.tasa_cambio }}
        </span>
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
          <span>No hay tasas de cambio en la papelera</span>
        </div>
      </template>
    </v-data-table-server>
  </div>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
