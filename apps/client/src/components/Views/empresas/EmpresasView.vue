<template>
  <v-container fluid class="pa-6">
    <div class="mb-6 d-flex flex-wrap align-center justify-space-between gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold text-primary">Gestión de Empresas</h1>
        <p class="text-body-1 text-medium-emphasis">Administración total de empresas (SuperAdmin)</p>
      </div>
      <div>
         <v-btn 
            color="primary" 
            prepend-icon="mdi-plus" 
            elevation="0" 
            @click="openCreateModal"
         >
            Nueva Empresa
         </v-btn>
      </div>
    </div>

    <v-card elevation="0" class="border rounded-lg">
      <!-- Toolbar -->
      <v-toolbar color="transparent" density="comfortable" class="px-4 border-b">
        <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Buscar por nombre, NIT o correo..."
            density="compact"
            variant="outlined"
            hide-details
            single-line
            style="max-width: 400px;"
            class="mr-2"
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-btn icon variant="text" @click="refetch">
            <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-toolbar>

      <!-- Data Table -->
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :headers="headers"
        :items="items"
        :items-length="totalItems"
        :loading="isLoading"
        :search="search"
        item-value="id"
        class="elevation-0"
        @update:options="handleOptionsUpdate"
      >
        <!-- Logo Column -->
        <template v-slot:item.logo_url="{ item }">
            <AsyncAvatar 
                :src="item.logo_url" 
                :name="item.nombre_empresa" 
                size="32" 
                class="elevation-1 border"
            />
        </template>

         <!-- Info Column -->
         <template v-slot:item.nombre_empresa="{ item }">
            <div>
                <div class="font-weight-bold">{{ item.nombre_empresa }}</div>
                <div class="text-caption text-medium-emphasis">NIT: {{ item.nit_empresa || 'N/A' }}</div>
            </div>
        </template>

        <!-- Actions Column -->
        <template v-slot:item.actions="{ item }">
            <div class="d-flex justify-end">
                <v-tooltip text="Ver detalles" location="top">
                    <template v-slot:activator="{ props }">
                        <v-btn icon variant="text" color="info" size="small" v-bind="props" @click="openDetailModal(item)">
                            <v-icon>mdi-eye-outline</v-icon>
                        </v-btn>
                    </template>
                </v-tooltip>
                <v-tooltip text="Editar" location="top">
                    <template v-slot:activator="{ props }">
                        <v-btn icon variant="text" color="primary" size="small" v-bind="props" @click="openUpdateModal(item)">
                            <v-icon>mdi-pencil-outline</v-icon>
                        </v-btn>
                    </template>
                </v-tooltip>
                <v-tooltip text="Mover a papelera" location="top">
                    <template v-slot:activator="{ props }">
                        <v-btn 
                            icon 
                            variant="text" 
                            color="error" 
                            size="small" 
                            v-bind="props" 
                            @click="openDeleteModal(item)"
                            :disabled="isOwnCompany(item.id)"
                        >
                            <v-icon>mdi-delete-outline</v-icon>
                        </v-btn>
                    </template>
                </v-tooltip>
            </div>
        </template>

        <template v-slot:no-data>
             <div class="pa-8 text-center text-medium-emphasis">
                <v-icon icon="mdi-domain-off" size="large" class="mb-2 opacity-50"></v-icon>
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
import { ref, computed, watch } from 'vue';
import { useQuery, keepPreviousData } from '@tanstack/vue-query';
import { getEmpresas } from '@/services/empresas.service';
import { useAuth } from '@/hooks/useAuth';
import AsyncAvatar from '@/components/common/AsyncAvatar.vue';

// Modals
import CreateEmpresaModal from '@/components/modals/empresas/CreateEmpresaModal.vue';
import UpdateEmpresaModal from '@/components/modals/empresas/UpdateEmpresaModal.vue';
import DeleteEmpresaModal from '@/components/modals/empresas/DeleteEmpresaModal.vue';
import DetailEmpresaModal from '@/components/modals/empresas/DetailEmpresaModal.vue';

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
    if (sortBy.value.length) {
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
const handleOptionsUpdate = (options) => {
    page.value = options.page;
    itemsPerPage.value = options.itemsPerPage;
    sortBy.value = options.sortBy;
};

// Check if the company is the user's own company
const isOwnCompany = (companyId) => {
    return user.value?.id_empresa === companyId;
};

// Modal Openers
const openCreateModal = () => {
    showCreateModal.value = true;
};

const openUpdateModal = (item) => {
    selectedItem.value = { ...item }; // Copy to avoid direct mutation
    showUpdateModal.value = true;
};

const openDeleteModal = (item) => {
    selectedItem.value = item;
    showDeleteModal.value = true;
};

const openDetailModal = (item) => {
    selectedItem.value = item;
    showDetailModal.value = true;
};
</script>
