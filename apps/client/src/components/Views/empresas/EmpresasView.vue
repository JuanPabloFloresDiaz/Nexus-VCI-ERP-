<template>
  <v-container class="pa-6" fluid>
    <div class="mb-6 d-flex flex-wrap align-center justify-space-between gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold text-primary">Gestión de Empresas</h1>
        <p class="text-body-1 text-medium-emphasis">Administración total de empresas (SuperAdmin)</p>
      </div>
      <div>
        <v-btn 
          color="primary" 
          elevation="0" 
          prepend-icon="mdi-plus" 
          @click="openCreateModal"
        >
          Nueva Empresa
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
          placeholder="Buscar por nombre, NIT o correo..."
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

      <!-- Data Table -->
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        class="elevation-0"
        :headers="headers"
        item-value="id"
        :items="items"
        :items-length="totalItems"
        :loading="isLoading"
        :search="search"
        @update:options="handleOptionsUpdate"
      >
        <!-- Logo Column -->
        <template #item.logo_url="{ item }">
          <AsyncAvatar 
            class="elevation-1 border" 
            :name="item.nombre_empresa" 
            size="32" 
            :src="item.logo_url"
          />
        </template>

        <!-- Info Column -->
        <template #item.nombre_empresa="{ item }">
          <div>
            <div class="font-weight-bold">{{ item.nombre_empresa }}</div>
            <div class="text-caption text-medium-emphasis">NIT: {{ item.nit_empresa || 'N/A' }}</div>
          </div>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-tooltip location="top" text="Ver detalles">
              <template #activator="{ props }">
                <v-btn
                  color="info"
                  icon
                  size="small"
                  variant="text"
                  v-bind="props"
                  @click="openDetailModal(item)"
                >
                  <v-icon>mdi-eye-outline</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
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
            <v-tooltip location="top" text="Mover a papelera">
              <template #activator="{ props }">
                <v-btn 
                  color="error" 
                  v-bind="props" 
                  :disabled="isOwnCompany(item.id)" 
                  icon 
                  size="small" 
                  variant="text"
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
            <v-icon class="mb-2 opacity-50" icon="mdi-domain-off" size="large" />
            <div>No se encontraron registros</div>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Modals -->
    <CreateEmpresaModal v-model="showCreateModal" />
    <UpdateEmpresaModal v-model="showUpdateModal" :empresa="selectedItem" />
    <DeleteEmpresaModal v-model="showDeleteModal" :empresa="selectedItem" />
    <DetailEmpresaModal v-model="showDetailModal" :empresa="selectedItem" />
  </v-container>
</template>

<script setup>
  import { keepPreviousData, useQuery } from '@tanstack/vue-query';
  import { computed, ref, watch } from 'vue';
  import AsyncAvatar from '@/components/common/AsyncAvatar.vue';
  // Modals
  import CreateEmpresaModal from '@/components/modals/empresas/CreateEmpresaModal.vue';
  import DeleteEmpresaModal from '@/components/modals/empresas/DeleteEmpresaModal.vue';

  import DetailEmpresaModal from '@/components/modals/empresas/DetailEmpresaModal.vue';
  import UpdateEmpresaModal from '@/components/modals/empresas/UpdateEmpresaModal.vue';
  import { useAuth } from '@/hooks/useAuth';
  import { getEmpresas } from '@/services/empresas.service';

  // Auth State
  const { user } = useAuth();

  // Table State
  const page = ref(1);
  const itemsPerPage = ref(10);
  const search = ref('');
  const sortBy = ref([]);

  // Modal State
  const showCreateModal = ref(false);
  const showUpdateModal = ref(false);
  const showDeleteModal = ref(false);
  const showDetailModal = ref(false);
  const selectedItem = ref(null);

  // Table Headers
  const headers = [
    { title: 'Logo', key: 'logo_url', sortable: false, width: '60px' },
    { title: 'Empresa', key: 'nombre_empresa', align: 'start' },
    { title: 'Correo', key: 'correo_empresa', align: 'start' },
    { title: 'Teléfono', key: 'telefono_empresa', align: 'start' },
    { title: 'Dirección', key: 'direccion_empresa', align: 'start' },
    { title: 'Acciones', key: 'actions', sortable: false, align: 'end', width: '150px' },
  ];

  // Query Parameters Construction
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

  // Data Fetching
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['empresas', queryParams],
    queryFn: () => getEmpresas(queryParams.value),
    placeholderData: keepPreviousData,
    select: (response) => response // Access the full response
  });

  const items = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  // Handlers
  function handleOptionsUpdate (options) {
    page.value = options.page;
    itemsPerPage.value = options.itemsPerPage;
    sortBy.value = options.sortBy;
  }

  // Check if the company is the user's own company
  function isOwnCompany (companyId) {
    return user.value?.id_empresa === companyId;
  }

  // Modal Openers
  function openCreateModal () {
    showCreateModal.value = true;
  }

  function openUpdateModal (item) {
    selectedItem.value = { ...item }; // Copy to avoid direct mutation
    showUpdateModal.value = true;
  }

  function openDeleteModal (item) {
    selectedItem.value = item;
    showDeleteModal.value = true;
  }

  function openDetailModal (item) {
    selectedItem.value = item;
    showDetailModal.value = true;
  }
</script>
