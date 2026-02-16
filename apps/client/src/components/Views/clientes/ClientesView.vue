<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import BulkCreateClienteModal from '@/components/modals/clientes/BulkCreateClienteModal.vue';
  // Modals
  import CreateClienteModal from '@/components/modals/clientes/CreateClienteModal.vue';

  import DeleteClienteModal from '@/components/modals/clientes/DeleteClienteModal.vue';
  import UpdateClienteModal from '@/components/modals/clientes/UpdateClienteModal.vue';
  import { useAuth } from '@/hooks/useAuth';
  import { getClientes } from '@/services/clientes.service';

  const { isSuperAdmin, isVendor } = useAuth();
  const search = ref('');
  const page = ref(1);
  const itemsPerPage = ref(10);

  // Modals State
  const showCreateModal = ref(false);
  const showUpdateModal = ref(false);
  const showDeleteModal = ref(false);
  const showBulkModal = ref(false);
  const selectedItem = ref(null);

  function openCreateModal () {
    showCreateModal.value = true;
  }
  function openBulkModal () {
    showBulkModal.value = true;
  }

  // Headers
  const headers = computed(() => {
    const baseHeaders = [
      { title: 'Nombre', key: 'nombre_cliente', align: 'start' },
      { title: 'Apellido', key: 'apellido_cliente', align: 'start' },
      { title: 'Correo', key: 'correo_cliente', align: 'start' },
      { title: 'Teléfono', key: 'telefono_cliente', align: 'start' },
      { title: 'DUI', key: 'dui_cliente', align: 'start' },
    ];

    if (isSuperAdmin.value) {
      baseHeaders.splice(5, 0, { title: 'Empresa', key: 'empresa.nombre_empresa', align: 'start' });
    }

    baseHeaders.push({ title: 'Acciones', key: 'actions', align: 'end', sortable: false });
    return baseHeaders;
  });

  // Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['clientes', page, itemsPerPage, search],
    queryFn: () => getClientes({
      page: page.value,
      limit: itemsPerPage.value,
      search: search.value
    }),
    placeholderData: (previousData) => previousData,
  });

  const clientes = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  function handleSuccess () {
    refetch();
    showCreateModal.value = false;
    showUpdateModal.value = false;
    showDeleteModal.value = false;
    showBulkModal.value = false;
    selectedItem.value = null;
  }

  function openUpdateModal (item) {
    selectedItem.value = item;
    showUpdateModal.value = true;
  }

  function openDeleteModal (item) {
    selectedItem.value = item;
    showDeleteModal.value = true;
  }
</script>

<template>
  <v-container class="pa-6" fluid>
    <div class="mb-6 d-flex flex-wrap align-center justify-space-between gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold text-primary">Clientes</h1>
        <p class="text-body-1 text-medium-emphasis">Gestión de cartera de clientes</p>
      </div>
      <div>
        <v-btn
          class="mr-2"
          color="success"
          elevation="0"
          prepend-icon="mdi-file-excel"
          @click="openBulkModal"
        >
          Carga Masiva
        </v-btn>
        <v-btn 
          color="primary" 
          elevation="0" 
          prepend-icon="mdi-account-plus" 
          @click="openCreateModal"
        >
          Nuevo Cliente
        </v-btn>
      </div>
    </div>

    <v-card class="border rounded-lg" elevation="0">
      <!-- Toolbar / Filters -->
      <v-toolbar class="px-4 border-b" color="transparent" density="comfortable">
        <v-text-field
          v-model="search"
          class="mr-2"
          density="compact"
          hide-details
          placeholder="Buscar cliente (Nombre, Correo, DUI...)"
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
        class="elevation-0"
        :headers="headers"
        hover
        :items="clientes"
        :items-length="totalItems"
        :loading="isLoading"
        :page="page"
        @update:page="page = $event"
      >
        <!-- Loading state -->
        <template #loading>
          <v-skeleton-loader type="table-row@5" />
        </template>

        <!-- Phone Column -->
        <template #item.telefono_cliente="{ item }">
          {{ item.telefono_cliente || 'N/A' }}
        </template>

        <!-- DUI Column -->
        <template #item.dui_cliente="{ item }">
          {{ item.dui_cliente || 'N/A' }}
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <div class="d-flex justify-end gap-2">
            <v-btn
              v-tooltip="'Editar'"
              color="primary"
              icon
              size="small"
              variant="text"
              @click="openUpdateModal(item)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
                            
            <v-btn
              v-if="!isVendor"
              v-tooltip="'Eliminar'"
              color="error"
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
            <h3 class="text-h6 text-medium-emphasis">No se encontraron clientes</h3>
            <p class="text-body-2 text-disabled">Intenta agregar uno nuevo</p>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Modals -->
    <CreateClienteModal
      v-model="showCreateModal"
      @success="handleSuccess"
      @update:model-value="showCreateModal = $event"
    />
        
    <UpdateClienteModal
      v-if="selectedItem"
      v-model="showUpdateModal"
      :cliente="selectedItem"
      @success="handleSuccess"
      @update:model-value="showUpdateModal = $event"
    />
        
    <DeleteClienteModal
      v-if="selectedItem"
      v-model="showDeleteModal"
      :cliente="selectedItem"
      @success="handleSuccess"
      @update:model-value="showDeleteModal = $event"
    />
        
    <BulkCreateClienteModal
      v-model="showBulkModal"
      @success="handleSuccess"
      @update:model-value="showBulkModal = $event"
    />
  </v-container>
</template>

<style scoped>
.gap-2 {
    gap: 8px;
}
</style>
