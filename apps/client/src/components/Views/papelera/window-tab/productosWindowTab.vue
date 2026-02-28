<script setup>
  import { useMutation, useQuery } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import { showConfirmDialog, showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { destroyProducto, getTrashedProductos, restoreProducto } from '@/services/productos.service';

  const page = ref(1);
  const limit = ref(10);
  const search = ref('');

  const queryParams = computed(() => ({
    page: page.value,
    limit: limit.value,
    search: search.value
  }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trashedProductos', queryParams],
    queryFn: () => getTrashedProductos(queryParams.value),
    keepPreviousData: true
  });

  const headers = [
    { title: 'Producto', align: 'start', key: 'nombre_producto' },
    { title: 'Código/SKU', align: 'start', key: 'codigo_producto' },
    { title: 'Categoría', align: 'start', key: 'categoria' },
    { title: 'Precio', align: 'end', key: 'precio_base' },
    { title: 'Eliminado', align: 'start', key: 'deleted_at' },
    { title: 'Acciones', align: 'end', key: 'actions', sortable: false }
  ];

  const items = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  const { mutate: restoreMutate, isPending: isRestoring } = useMutation({
    mutationFn: restoreProducto,
    onSuccess: () => {
      showSuccessToast('Producto restaurado exitosamente');
      refetch();
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al restaurar producto');
    }
  });

  const { mutate: deleteMutate, isPending: isDeleting } = useMutation({
    mutationFn: destroyProducto,
    onSuccess: () => {
      showSuccessToast('Producto eliminado definitivamente');
      refetch();
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al eliminar producto');
    }
  });

  async function handleRestore (item) {
    const confirmed = await showConfirmDialog(
      '¿Restaurar producto?',
      `El producto "${item.nombre_producto}" volverá a estar activo.`
    );
    if (confirmed) {
      restoreMutate(item.id);
    }
  }

  async function handleForceDelete (item) {
    const confirmed = await showConfirmDialog(
      '¿Eliminar definitivamente?',
      `Esta acción no se puede deshacer. El producto "${item.nombre_producto}" y todas sus variantes se borrarán permanentemente.`,
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
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <div class="d-flex align-center pa-4 gap-4 border-b bg-surface">
      <v-text-field
        v-model="search"
        bg-color="grey-lighten-5"
        density="compact"
        hide-details
        placeholder="Buscar producto eliminado..."
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
      <template #item.nombre_producto="{ item }">
        <div class="d-flex align-center py-2">
          <v-avatar class="mr-3" color="grey-lighten-2" rounded size="40">
            <v-img v-if="item.imagen_url" :src="item.imagen_url" />
            <v-icon v-else color="grey-darken-1">mdi-package-variant-closed</v-icon>
          </v-avatar>
          <div class="d-flex flex-column">
            <span class="font-weight-medium text-body-2">{{ item.nombre_producto }}</span>
            <span class="text-caption text-medium-emphasis text-truncate" style="max-width: 200px;">
              {{ item.descripcion_producto || 'Sin descripción' }}
            </span>
          </div>
        </div>
      </template>

      <template #item.codigo_producto="{ item }">
        <v-chip class="font-weight-medium" size="small" variant="tonal">
          {{ item.codigo_producto || item.sku || 'N/A' }}
        </v-chip>
      </template>

      <template #item.categoria="{ item }">
        <div class="d-flex flex-column">
          <span class="text-body-2">{{ item.categoria?.nombre_categoria || 'N/A' }}</span>
          <span v-if="item.subcategoria" class="text-caption text-medium-emphasis">
            {{ item.subcategoria.nombre_subcategoria }}
          </span>
        </div>
      </template>

      <template #item.precio_base="{ item }">
        <span class="font-weight-bold">{{ formatCurrency(item.precio_base) }}</span>
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
          <span>No hay productos en la papelera</span>
        </div>
      </template>
    </v-data-table-server>
  </div>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
