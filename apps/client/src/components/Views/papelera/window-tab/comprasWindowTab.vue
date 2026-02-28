<script setup>
  import { useMutation, useQuery } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import { showConfirmDialog, showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { forceDeleteCompra, getTrashedCompras, restoreCompra } from '@/services/compras.service';

  const page = ref(1);
  const limit = ref(10);
  const search = ref('');

  const queryParams = computed(() => ({
    page: page.value,
    limit: limit.value,
    search: search.value
  }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trashedCompras', queryParams],
    queryFn: () => getTrashedCompras(queryParams.value),
    keepPreviousData: true
  });

  const headers = [
    { title: 'Orden de Compra', align: 'start', key: 'id' },
    { title: 'Proveedor', align: 'start', key: 'proveedor' },
    { title: 'Fecha de Compra', align: 'start', key: 'fecha_compra' },
    { title: 'Total', align: 'end', key: 'total_compra' },
    { title: 'Estado', align: 'start', key: 'estado_compra' },
    { title: 'Eliminado', align: 'start', key: 'deleted_at' },
    { title: 'Acciones', align: 'end', key: 'actions', sortable: false }
  ];

  const items = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  const { mutate: restoreMutate, isPending: isRestoring } = useMutation({
    mutationFn: restoreCompra,
    onSuccess: () => {
      showSuccessToast('Compra restaurada exitosamente');
      refetch();
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al restaurar compra');
    }
  });

  const { mutate: deleteMutate, isPending: isDeleting } = useMutation({
    mutationFn: forceDeleteCompra,
    onSuccess: () => {
      showSuccessToast('Compra eliminada definitivamente');
      refetch();
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al eliminar compra');
    }
  });

  async function handleRestore (item) {
    const confirmed = await showConfirmDialog(
      '¿Restaurar orden de compra?',
      `La orden de compra OD-${item.id} volverá a estar activa.`
    );
    if (confirmed) {
      restoreMutate(item.id);
    }
  }

  async function handleForceDelete (item) {
    const confirmed = await showConfirmDialog(
      '¿Eliminar definitivamente?',
      `Esta acción no se puede deshacer. La orden de compra OD-${item.id} se borrará permanentemente.`,
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

  function formatCurrency(val) {
    return new Intl.NumberFormat('es-SV', {
      style: 'currency',
      currency: 'USD'
    }).format(val || 0);
  }

  function getStatusColor(status) {
    switch (status?.toLowerCase()) {
      case 'completada': return 'success';
      case 'nueva': return 'info';
      case 'cancelada': return 'error';
      case 'en proceso': return 'warning';
      default: return 'primary';
    }
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
        placeholder="Buscar orden eliminada..."
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
      <template #item.id="{ item }">
        <span class="font-weight-bold">OC-{{ String(item.id).padStart(5, '0') }}</span>
      </template>

      <template #item.proveedor="{ item }">
        <div class="d-flex flex-column">
          <span class="font-weight-medium text-body-2">{{ item.proveedor?.nombre_proveedor || 'N/A' }}</span>
        </div>
      </template>
      
      <template #item.fecha_compra="{ item }">
        <span class="text-body-2">{{ formatDate(item.fecha_compra) }}</span>
      </template>

      <template #item.total_compra="{ item }">
        <span class="font-weight-bold">{{ formatCurrency(item.total_compra) }}</span>
      </template>

      <template #item.estado_compra="{ item }">
        <v-chip class="font-weight-medium" :color="getStatusColor(item.estado_compra)" size="small" variant="flat">
          {{ item.estado_compra }}
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
          <span>No hay órdenes de compra en la papelera</span>
        </div>
      </template>
    </v-data-table-server>
  </div>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
