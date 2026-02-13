<script setup>
  import { useMutation, useQuery } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import AsyncAvatar from '@/components/common/AsyncAvatar.vue';
  import { showConfirmDialog, showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { destroyCliente, getTrashedClientes, restoreCliente } from '@/services/clientes.service';

  const page = ref(1);
  const limit = ref(10);
  const search = ref('');

  const queryParams = computed(() => ({
    page: page.value,
    limit: limit.value,
    search: search.value
  }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trashedClientes', queryParams],
    queryFn: () => getTrashedClientes(queryParams.value),
    keepPreviousData: true
  });

  const headers = [
    { title: 'Cliente', align: 'start', key: 'nombre_cliente' },
    { title: 'DUI', align: 'start', key: 'dui_cliente' },
    { title: 'Teléfono', align: 'start', key: 'telefono_cliente' },
    { title: 'Correo', align: 'start', key: 'correo_cliente' },
    { title: 'Eliminado', align: 'start', key: 'deleted_at' },
    { title: 'Acciones', align: 'end', key: 'actions', sortable: false }
  ];

  const items = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  // Restore Mutation
  const { mutate: restoreMutate, isPending: isRestoring } = useMutation({
    mutationFn: restoreCliente,
    onSuccess: () => {
      showSuccessToast('Cliente restaurado exitosamente');
      refetch();
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al restaurar cliente');
    }
  });

  // Force Delete Mutation
  const { mutate: deleteMutate, isPending: isDeleting } = useMutation({
    mutationFn: destroyCliente,
    onSuccess: () => {
      showSuccessToast('Cliente eliminado definitivamente');
      refetch();
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al eliminar cliente');
    }
  });

  async function handleRestore (item) {
    const confirmed = await showConfirmDialog(
      '¿Restaurar cliente?',
      `El cliente "${item.nombre_cliente} ${item.apellido_cliente}" volverá a estar activo.`
    );
    if (confirmed) {
      restoreMutate(item.id);
    }
  }

  async function handleForceDelete (item) {
    const confirmed = await showConfirmDialog(
      '¿Eliminar definitivamente?',
      `Esta acción no se puede deshacer. El cliente "${item.nombre_cliente} ${item.apellido_cliente}" se borrará permanentemente.`,
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
        placeholder="Buscar cliente eliminado..."
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
      <template #item.nombre_cliente="{ item }">
        <div class="d-flex align-center py-2">
          <AsyncAvatar 
            class="mr-3" 
            :name="`${item.nombre_cliente} ${item.apellido_cliente}`" 
            rounded="0" 
            size="32"
          />
          <div>
            <div class="font-weight-medium text-body-2">
              {{ item.nombre_cliente }} {{ item.apellido_cliente }}
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
          <span>No hay clientes en la papelera</span>
        </div>
      </template>
    </v-data-table-server>
  </div>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
