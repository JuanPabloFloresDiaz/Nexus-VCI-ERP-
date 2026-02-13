<script setup>
  import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import AsyncAvatar from '@/components/common/AsyncAvatar.vue';
  import { showConfirmDialog, showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { forceDeleteProveedor, getTrashedProveedores, restoreProveedor } from '@/services/proveedores.service';

  const queryClient = useQueryClient();
  const page = ref(1);
  const limit = ref(10);
  const search = ref('');

  const queryParams = computed(() => {
    return new URLSearchParams({
      page: page.value,
      limit: limit.value,
      search: search.value
    }).toString();
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trashedProveedores', queryParams],
    queryFn: () => getTrashedProveedores(queryParams.value),
    keepPreviousData: true
  });

  const headers = [
    { title: 'Proveedor', align: 'start', key: 'nombre_proveedor' },
    { title: 'Contacto', align: 'start', key: 'contacto_nombre' },
    { title: 'Teléfono', align: 'start', key: 'telefono_proveedor' },
    { title: 'Correo', align: 'start', key: 'correo_proveedor' },
    { title: 'Eliminado', align: 'start', key: 'deleted_at' },
    { title: 'Acciones', align: 'end', key: 'actions', sortable: false }
  ];

  const items = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  // Restore Mutation
  const { mutate: restoreMutate, isPending: isRestoring } = useMutation({
    mutationFn: restoreProveedor,
    onSuccess: () => {
      showSuccessToast('Proveedor restaurado exitosamente');
      refetch();
      // Invalidate main prov query if needed
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al restaurar proveedor');
    }
  });

  // Force Delete Mutation
  const { mutate: deleteMutate, isPending: isDeleting } = useMutation({
    mutationFn: forceDeleteProveedor,
    onSuccess: () => {
      showSuccessToast('Proveedor eliminado definitivamente');
      refetch();
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al eliminar proveedor');
    }
  });

  async function handleRestore (item) {
    const confirmed = await showConfirmDialog(
      '¿Restaurar proveedor?',
      `El proveedor "${item.nombre_proveedor}" volverá a estar activo.`
    );
    if (confirmed) {
      restoreMutate(item.id);
    }
  }

  async function handleForceDelete (item) {
    const confirmed = await showConfirmDialog(
      '¿Eliminar definitivamente?',
      `Esta acción no se puede deshacer. El proveedor "${item.nombre_proveedor}" se borrará permanentemente.`,
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
    <!-- Toolbar -->
    <div class="d-flex align-center pa-4 gap-4 border-b bg-white">
      <v-text-field
        v-model="search"
        bg-color="grey-lighten-5"
        density="compact"
        hide-details
        placeholder="Buscar proveedor eliminado..."
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
      :items="items"
      :items-length="totalItems"
      :items-per-page="limit"
      :loading="isLoading"
    >
      <template #item.nombre_proveedor="{ item }">
        <div class="d-flex align-center py-2">
          <AsyncAvatar 
            class="mr-3" 
            :name="item.nombre_proveedor" 
            rounded="0" 
            size="32"
          />
          <div>
            <div class="font-weight-medium text-body-2">
              {{ item.nombre_proveedor }}
            </div>
            <div v-if="item.empresa" class="text-caption text-medium-emphasis">
              {{ item.empresa.nombre_empresa }}
            </div>
          </div>
        </div>
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
          <span>No hay proveedores en la papelera</span>
        </div>
      </template>
    </v-data-table-server>
  </div>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
