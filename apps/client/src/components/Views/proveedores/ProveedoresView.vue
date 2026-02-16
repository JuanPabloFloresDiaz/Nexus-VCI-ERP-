<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import AsyncAvatar from '@/components/common/AsyncAvatar.vue';
  import BulkCreateProveedorModal from '@/components/modals/proveedores/BulkCreateProveedorModal.vue';
  // Modals
  import CreateProveedorModal from '@/components/modals/proveedores/CreateProveedorModal.vue';

  import DeleteProveedorModal from '@/components/modals/proveedores/DeleteProveedorModal.vue';
  import UpdateProveedorModal from '@/components/modals/proveedores/UpdateProveedorModal.vue';
  import { useAuth } from '@/hooks/useAuth';
  import { getProveedores } from '@/services/proveedores.service';

  const { isSuperAdmin } = useAuth();
  const search = ref('');
  const page = ref(1);
  const itemsPerPage = ref(10);
  const sortBy = ref([]);

  // Modals State
  const showCreateModal = ref(false);
  const showUpdateModal = ref(false);
  const showDeleteModal = ref(false);
  const showBulkModal = ref(false);
  const selectedItem = ref(null);

  // Headers
  const headers = computed(() => {
    const baseHeaders = [
      { title: 'Proveedor', key: 'nombre_proveedor', align: 'start' },
      { title: 'Contacto', key: 'contacto_nombre', align: 'start' },
      { title: 'Correo', key: 'correo_proveedor', align: 'start' },
      { title: 'Teléfono', key: 'telefono_proveedor', align: 'start' },
    ];

    if (isSuperAdmin.value) {
      baseHeaders.splice(1, 0, { title: 'Empresa', key: 'empresa.nombre_empresa', align: 'start' });
    }

    baseHeaders.push({ title: 'Acciones', key: 'actions', align: 'end', sortable: false });
    return baseHeaders;
  });

  // Query Params
  const queryParams = computed(() => {
    const offset = (page.value - 1) * itemsPerPage.value;
    let order = '';
    if (sortBy.value.length > 0) {
      order = `${sortBy.value[0].key},${sortBy.value[0].order.toUpperCase()}`;
    }
    
    return new URLSearchParams({
      limit: itemsPerPage.value,
      offset,
      search: search.value,
      order
    }).toString();
  });

  // Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['proveedores', queryParams],
    queryFn: () => getProveedores(queryParams.value),
    keepPreviousData: true
  });

  const items = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  // Methods
  function handleOptionsUpdate (options) {
    page.value = options.page;
    itemsPerPage.value = options.itemsPerPage;
    sortBy.value = options.sortBy;
  }

  function openUpdateModal (item) {
    selectedItem.value = { ...item };
    showUpdateModal.value = true;
  }

  function openDeleteModal (item) {
    selectedItem.value = item;
    showDeleteModal.value = true;
  }

  function handleSuccess () {
    refetch();
    selectedItem.value = null;
    showCreateModal.value = false;
    showUpdateModal.value = false;
    showDeleteModal.value = false;
    showBulkModal.value = false;
  }
</script>

<template>
  <v-container class="pa-6" fluid>
    <div class="mb-6 d-flex flex-wrap align-center justify-space-between gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold text-primary">Proveedores</h1>
        <p class="text-body-1 text-medium-emphasis">Gestión de proveedores y contactos</p>
      </div>
      <div class="d-flex gap-2">
        <v-btn 
          color="secondary" 
          elevation="0"
          prepend-icon="mdi-microsoft-excel" 
          variant="tonal" 
          @click="showBulkModal = true"
        >
          Carga Masiva
        </v-btn>
        <v-btn 
          color="primary" 
          elevation="0" 
          prepend-icon="mdi-plus" 
          @click="showCreateModal = true"
        >
          Nuevo Proveedor
        </v-btn>
      </div>
    </div>

    <v-card class="border rounded-lg" elevation="0">
      <!-- Toolbar -->
      <v-toolbar class="px-4 border-b" color="transparent" density="comfortable">
        <v-text-field
          v-model="search"
          class="mr-2"
          density="compact"
          hide-details
          placeholder="Buscar proveedor, contacto o correo..."
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
        v-model:page="page"
        class="elevation-0"
        :headers="headers"
        :items="items"
        :items-length="totalItems"
        :loading="isLoading"
        @update:options="handleOptionsUpdate"
      >
        <template #item.nombre_proveedor="{ item }">
          <div class="d-flex align-center">
            <AsyncAvatar 
              class="mr-3" 
              :name="item.nombre_proveedor" 
              size="32"
            />
            <span class="font-weight-medium">{{ item.nombre_proveedor }}</span>
          </div>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-tooltip location="top" text="Editar">
              <template #activator="{ props }">
                <v-btn
                  color="primary"
                  icon
                  size="small"
                  variant="text"
                  v-bind="props"
                  @click="openUpdateModal(item)"
                >
                  <v-icon>mdi-pencil-outline</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
            <v-tooltip location="top" text="Eliminar">
              <template #activator="{ props }">
                <v-btn
                  color="error"
                  icon
                  size="small"
                  variant="text"
                  v-bind="props"
                  @click="openDeleteModal(item)"
                >
                  <v-icon>mdi-delete-outline</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </div>
        </template>

        <template #no-data>
          <div class="pa-8 text-center text-medium-emphasis">
            <v-icon class="mb-2 opacity-50" icon="mdi-truck-off" size="large" />
            <div>No se encontraron proveedores</div>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Modals -->
    <CreateProveedorModal v-model="showCreateModal" @success="handleSuccess" />
    <UpdateProveedorModal v-if="selectedItem" v-model="showUpdateModal" :proveedor="selectedItem" @success="handleSuccess" />
    <DeleteProveedorModal v-if="selectedItem" v-model="showDeleteModal" :proveedor="selectedItem" @success="handleSuccess" />
    <BulkCreateProveedorModal v-model="showBulkModal" @success="handleSuccess" />
  </v-container>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
