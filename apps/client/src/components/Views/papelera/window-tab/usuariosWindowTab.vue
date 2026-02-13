<script setup>
  import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
  import Swal from 'sweetalert2';
  import { computed, ref } from 'vue';
  import { useAuth } from '@/hooks/useAuth';
  import { fireToast, showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { destroyUsuario, getTrashedUsuarios, restoreUsuario } from '@/services/usuarios.service';

  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAuth();
  const search = ref('');
  const page = ref(1);
  const itemsPerPage = ref(10);

  // Headers
  const headers = computed(() => {
    const baseHeaders = [
      { title: 'Nombre', key: 'nombre_usuario', align: 'start' },
      { title: 'Correo', key: 'correo_electronico', align: 'start' },
      { title: 'Rol', key: 'rol_usuario', align: 'center' },
      { title: 'Eliminado', key: 'deleted_at', align: 'start' },
    ];

    if (isSuperAdmin.value) {
      baseHeaders.splice(3, 0, { title: 'Empresa', key: 'empresa.nombre_empresa', align: 'start' });
    }

    baseHeaders.push({ title: 'Acciones', key: 'actions', align: 'end', sortable: false });
    return baseHeaders;
  });

  // Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['usuarios', 'trashed', page, itemsPerPage, search],
    queryFn: () => getTrashedUsuarios({
      page: page.value,
      limit: itemsPerPage.value,
      search: search.value
    }),
    keepPreviousData: true
  });

  const usuarios = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  // Mutations
  const { mutate: restore, isPending: isRestoring } = useMutation({
    mutationFn: restoreUsuario,
    onSuccess: () => {
      showSuccessToast('Usuario restaurado correctamente');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.message || 'Error al restaurar usuario');
    }
  });

  const { mutate: destroy, isPending: isDestroying } = useMutation({
    mutationFn: destroyUsuario,
    onSuccess: () => {
      showSuccessToast('Usuario eliminado definitivamente');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.message || 'Error al eliminar usuario');
    }
  });

  // Actions
  function handleRestore (item) {
    Swal.fire({
      title: '¿Restaurar usuario?',
      text: `El usuario "${item.nombre_usuario}" volverá a estar activo.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        restore(item.id);
      }
    });
  }

  function handleDestroy (item) {
    Swal.fire({
      title: '¿Eliminar definitivamente?',
      text: "Esta acción no se puede deshacer. El usuario se perderá para siempre.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        destroy(item.id);
      }
    });
  }

  function formatDate (dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }
</script>

<template>
  <v-card class="bg-transparent" flat>
    <!-- Toolbar -->
    <v-toolbar class="px-0 mb-4" color="transparent" density="comfortable">
      <v-text-field
        v-model="search"
        density="compact"
        class="mr-2"
        hide-details
        placeholder="Buscar usuario eliminado..."
        prepend-inner-icon="mdi-magnify"
        single-line
        style="max-width: 400px;"
        variant="outlined"
      />
      <v-spacer />
      <v-btn icon variant="text" @click="refetch">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-toolbar>

    <!-- Table -->
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      class="elevation-0 border rounded-lg"
      :headers="headers"
      hover
      :items="usuarios"
      :items-length="totalItems"
      :loading="isLoading"
      :page="page"
      @update:page="page = $event"
    >
      <!-- Loading state -->
      <template #loading>
        <v-skeleton-loader type="table-row@5" />
      </template>

      <!-- Role Column -->
      <template #item.rol_usuario="{ item }">
        <v-chip
          class="font-weight-medium"
          :color="item.rol_usuario === 'Administrador' || item.rol_usuario === 'SuperAdministrador' ? 'primary' : 'secondary'"
          size="small"
          variant="flat"
        >
          {{ item.rol_usuario }}
        </v-chip>
      </template>

      <!-- Deleted At Column -->
      <template #item.deleted_at="{ item }">
        <span class="text-caption text-medium-emphasis">
          {{ formatDate(item.deleted_at) }}
        </span>
      </template>

      <!-- Actions Column -->
      <template #item.actions="{ item }">
        <div class="d-flex justify-end gap-2">
          <v-tooltip location="top" text="Restaurar">
            <template #activator="{ props }">
              <v-btn
                color="success"
                icon
                v-bind="props"
                :loading="isRestoring"
                size="small"
                variant="text"
                @click="handleRestore(item)"
              >
                <v-icon>mdi-restore</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
                    
          <v-tooltip location="top" text="Eliminar definitivamente">
            <template #activator="{ props }">
              <v-btn
                color="error"
                icon
                v-bind="props"
                :loading="isDestroying"
                size="small"
                variant="text"
                @click="handleDestroy(item)"
              >
                <v-icon>mdi-delete-forever</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </template>

      <template #no-data>
        <div class="pa-8 text-center">
          <v-icon class="mb-4" color="medium-emphasis" size="48">mdi-delete-empty</v-icon>
          <h3 class="text-h6 text-medium-emphasis">Papelera vacía</h3>
          <p class="text-body-2 text-disabled">No hay usuarios eliminados</p>
        </div>
      </template>
    </v-data-table-server>
  </v-card>
</template>

<style scoped>
.gap-2 {
    gap: 8px;
}
:deep(.v-data-table-footer) {
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
