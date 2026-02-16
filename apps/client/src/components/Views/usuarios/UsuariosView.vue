<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { useHead } from '@unhead/vue';
  import { computed, ref } from 'vue';
  
  // Components
  import AsyncAvatar from '@/components/common/AsyncAvatar.vue';

  // Modals
  import CreateUsuarioModal from '@/components/modals/usuarios/CreateUsuarioModal.vue';
  import DeleteUsuarioModal from '@/components/modals/usuarios/DeleteUsuarioModal.vue';
  import UpdateUsuarioModal from '@/components/modals/usuarios/UpdateUsuarioModal.vue';

  import { useAuth } from '@/hooks/useAuth';
  import { getUsuarios } from '@/services/usuarios.service';

  const { isSuperAdmin, user } = useAuth();
  
  // --- SEO ---
  useHead({
    title: 'Gestión de Usuarios',
    meta: [
      { name: 'description', content: 'Administración de usuarios, roles y permisos del sistema.' }
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });

  const search = ref('');
  const page = ref(1);
  const itemsPerPage = ref(10);

  // Headers
  const headers = computed(() => {
    const baseHeaders = [
      { title: 'Nombre', key: 'nombre_usuario', align: 'start' }, // Will contain Avatar
      { title: 'Correo', key: 'correo_electronico', align: 'start' },
      { title: 'Rol', key: 'rol_usuario', align: 'center' },
      { title: 'Estado', key: 'estado_usuario', align: 'center' },
    ];

    if (isSuperAdmin.value) {
      baseHeaders.splice(3, 0, { title: 'Empresa', key: 'empresa.nombre_empresa', align: 'start' });
    }

    baseHeaders.push({ title: 'Acciones', key: 'actions', align: 'end', sortable: false });
    return baseHeaders;
  });

  // Query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['usuarios', page, itemsPerPage, search],
    queryFn: () => getUsuarios({
      page: page.value,
      limit: itemsPerPage.value,
      search: search.value
    }),
    keepPreviousData: true,
    staleTime: 5000 
  });

  const usuarios = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  // Modals State
  const showCreateModal = ref(false);
  const showUpdateModal = ref(false);
  const showDeleteModal = ref(false);
  const selectedItem = ref(null);

  function openCreateModal () {
    showCreateModal.value = true;
  }

  function openUpdateModal (item) {
    selectedItem.value = item;
    showUpdateModal.value = true;
  }

  function openDeleteModal (item) {
    selectedItem.value = item;
    showDeleteModal.value = true;
  }

  function handleSuccess () {
    refetch();
    showCreateModal.value = false;
    showUpdateModal.value = false;
    showDeleteModal.value = false;
    selectedItem.value = null;
  }

  function canDelete (item) {
    // Prevent self-deletion
    return item.id !== user.value.id;
  }
</script>

<template>
  <v-container class="pa-6" fluid>
    <div class="mb-6 d-flex flex-wrap align-center justify-space-between gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold text-secondary">Usuarios</h1>
        <p class="text-body-1 text-medium-emphasis">Gestión de acceso y roles</p>
      </div>
      <div>
        <v-btn 
          color="primary" 
          elevation="0" 
          prepend-icon="mdi-account-plus" 
          @click="openCreateModal"
        >
          Nuevo Usuario
        </v-btn>
      </div>
    </div>

    <v-card class="border rounded-lg bg-surface" elevation="1">
      <!-- Toolbar / Filters -->
      <v-toolbar class="px-4 border-b" color="transparent" density="comfortable">
        <v-text-field
          v-model="search"
          class="mr-2"
          density="compact"
          hide-details
          placeholder="Buscar usuario..."
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
        class="elevation-0 bg-surface"
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

        <!-- Nombre Column (Avatar + Name) -->
        <template #item.nombre_usuario="{ item }">
          <div class="d-flex align-center py-2">
            <AsyncAvatar 
              :alt="item.nombre_usuario"
              class="mr-3"
              color="primary"
              :name="item.nombre_usuario"
              size="40"
              :src="item.foto_perfil_url"
              variant="tonal"
            />
            <div class="d-flex flex-column">
              <span class="font-weight-medium text-body-2">{{ item.nombre_usuario }}</span>
            </div>
          </div>
        </template>

        <!-- Rol Column -->
        <template #item.rol_usuario="{ item }">
          <v-chip
            class="font-weight-bold"
            :color="item.rol_usuario === 'Administrador' || item.rol_usuario === 'SuperAdministrador' ? 'primary' : 'secondary'"
            size="small"
            variant="flat"
          >
            {{ item.rol_usuario }}
          </v-chip>
        </template>

        <!-- Estado Column -->
        <template #item.estado_usuario="{ item }">
          <v-chip
            class="font-weight-medium"
            :color="item.estado_usuario ? 'success' : 'error'"
            size="small"
            variant="tonal"
          >
            <v-icon size="small" start>
              {{ item.estado_usuario ? 'mdi-check-circle' : 'mdi-close-circle' }}
            </v-icon>
            {{ item.estado_usuario ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <div class="d-flex justify-end gap-2">
            <v-btn
              v-tooltip="'Editar'"
              color="secondary"
              icon
              size="small"
              variant="text"
              @click="openUpdateModal(item)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
                            
            <v-btn
              v-tooltip="!canDelete(item) ? 'No puedes eliminarte a ti mismo' : 'Eliminar'"
              color="error"
              :disabled="!canDelete(item)"
              icon
              size="small"
              variant="text"
              @click="openDeleteModal(item)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
        </template>

        <template #no-data>
          <div class="pa-8 text-center">
            <v-icon class="mb-4" color="medium-emphasis" size="48">mdi-account-off-outline</v-icon>
            <h3 class="text-h6 text-medium-emphasis">No se encontraron usuarios</h3>
            <p class="text-body-2 text-disabled">Intenta ajustar los filtros de búsqueda</p>
          </div>
        </template>
      </v-data-table-server>

    </v-card>

    <!-- Modals -->
    <CreateUsuarioModal
      v-model="showCreateModal"
      @success="handleSuccess"
      @update:model-value="showCreateModal = $event"
    />
        
    <UpdateUsuarioModal
      v-if="selectedItem"
      v-model="showUpdateModal"
      :usuario="selectedItem"
      @success="handleSuccess"
      @update:model-value="showUpdateModal = $event"
    />
        
    <DeleteUsuarioModal
      v-if="selectedItem"
      v-model="showDeleteModal"
      :usuario="selectedItem"
      @success="handleSuccess"
      @update:model-value="showDeleteModal = $event"
    />
  </v-container>
</template>

<style scoped>
.gap-2 {
    gap: 8px;
}
.header-bold :deep(th) {
    font-weight: 700 !important;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
