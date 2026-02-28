<script setup>
  import { useMutation, useQuery } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import { showConfirmDialog, showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { forceDestroyMovimiento, getTrashedMovimientos, restoreMovimiento } from '@/services/movimientos.service';

  const page = ref(1);
  const limit = ref(10);
  const search = ref('');

  const queryParams = computed(() => ({
    page: page.value,
    limit: limit.value,
    search: search.value
  }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trashedMovimientos', queryParams],
    queryFn: () => getTrashedMovimientos(queryParams.value),
    keepPreviousData: true
  });

  const headers = [
    { title: 'Fecha', align: 'start', key: 'fecha_movimiento' },
    { title: 'Movimiento', align: 'start', key: 'tipo_movimiento' },
    { title: 'Almacén', align: 'start', key: 'almacen' },
    { title: 'Variante', align: 'start', key: 'variante' },
    { title: 'Cantidad', align: 'end', key: 'cantidad' },
    { title: 'Eliminado', align: 'start', key: 'deleted_at' },
    { title: 'Acciones', align: 'end', key: 'actions', sortable: false }
  ];

  const items = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  const { mutate: restoreMutate, isPending: isRestoring } = useMutation({
    mutationFn: restoreMovimiento,
    onSuccess: () => {
      showSuccessToast('Movimiento restaurado exitosamente');
      refetch();
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al restaurar movimiento');
    }
  });

  const { mutate: deleteMutate, isPending: isDeleting } = useMutation({
    mutationFn: forceDestroyMovimiento,
    onSuccess: () => {
      showSuccessToast('Movimiento eliminado definitivamente');
      refetch();
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al eliminar movimiento');
    }
  });

  async function handleRestore (item) {
    const confirmed = await showConfirmDialog(
      '¿Restaurar movimiento?',
      `El movimiento de ${item.tipo_movimiento} volverá a estar activo en el historial.`
    );
    if (confirmed) {
      restoreMutate(item.id);
    }
  }

  async function handleForceDelete (item) {
    const confirmed = await showConfirmDialog(
      '¿Eliminar definitivamente?',
      `Esta acción no se puede deshacer. El movimiento de inventario se borrará permanentemente.`,
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

  function getMovementColor(type) {
    switch(type) {
      case 'Entrada': return 'success';
      case 'Salida': return 'error';
      case 'Ajuste': return 'warning';
      case 'Transferencia': return 'info';
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
        placeholder="Buscar movimiento eliminado..."
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
      <template #item.fecha_movimiento="{ item }">
        <span class="text-body-2">{{ formatDate(item.fecha_movimiento) }}</span>
      </template>

      <template #item.tipo_movimiento="{ item }">
        <v-chip class="font-weight-medium" :color="getMovementColor(item.tipo_movimiento)" size="small" variant="flat">
          {{ item.tipo_movimiento }}
        </v-chip>
      </template>

      <template #item.almacen="{ item }">
        <div class="d-flex flex-column">
          <span class="font-weight-medium text-body-2">{{ item.almacen?.nombre_almacen || 'N/A' }}</span>
        </div>
      </template>

      <template #item.variante="{ item }">
        <div class="d-flex flex-column">
          <span class="font-weight-medium text-body-2">{{ item.variante?.producto?.nombre_producto || 'N/A' }}</span>
          <span class="text-caption text-medium-emphasis">SKU: {{ item.variante?.sku || 'N/A' }}</span>
        </div>
      </template>

      <template #item.cantidad="{ item }">
        <span class="font-weight-bold" :class="item.tipo_movimiento === 'Salida' ? 'text-error' : 'text-success'">
          {{ item.tipo_movimiento === 'Salida' ? '-' : '+' }}{{ item.cantidad }}
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
          <span>No hay movimientos en la papelera</span>
        </div>
      </template>
    </v-data-table-server>
  </div>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
