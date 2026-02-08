<script setup>
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { getProveedores } from '@/services/proveedores.service';
import { useAuth } from '@/hooks/useAuth';
import AsyncAvatar from '@/components/common/AsyncAvatar.vue';

// Modals
import CreateProveedorModal from '@/components/modals/proveedores/CreateProveedorModal.vue';
import UpdateProveedorModal from '@/components/modals/proveedores/UpdateProveedorModal.vue';
import DeleteProveedorModal from '@/components/modals/proveedores/DeleteProveedorModal.vue';
import BulkCreateProveedorModal from '@/components/modals/proveedores/BulkCreateProveedorModal.vue';

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

// Query
const { data, isLoading, refetch } = useQuery({
    queryKey: ['proveedores', queryParams],
    queryFn: () => getProveedores(queryParams.value),
    keepPreviousData: true
});

const items = computed(() => data.value?.data || []);
const totalItems = computed(() => data.value?.count || 0);

// Methods
const handleOptionsUpdate = (options) => {
    page.value = options.page;
    itemsPerPage.value = options.itemsPerPage;
    sortBy.value = options.sortBy;
};

const openUpdateModal = (item) => {
    selectedItem.value = { ...item };
    showUpdateModal.value = true;
};

const openDeleteModal = (item) => {
    selectedItem.value = item;
    showDeleteModal.value = true;
};

const handleSuccess = () => {
    refetch();
    selectedItem.value = null;
    showCreateModal.value = false;
    showUpdateModal.value = false;
    showDeleteModal.value = false;
    showBulkModal.value = false;
};
</script>

<template>
    <v-container fluid class="pa-6">
        <div class="mb-6 d-flex flex-wrap align-center justify-space-between gap-4">
            <div>
                <h1 class="text-h4 font-weight-bold text-primary">Proveedores</h1>
                <p class="text-body-1 text-medium-emphasis">Gestión de proveedores y contactos</p>
            </div>
            <div class="d-flex gap-2">
                 <v-btn 
                    color="secondary" 
                    variant="tonal"
                    prepend-icon="mdi-microsoft-excel" 
                    elevation="0" 
                    @click="showBulkModal = true"
                 >
                    Carga Masiva
                 </v-btn>
                 <v-btn 
                    color="primary" 
                    prepend-icon="mdi-plus" 
                    elevation="0" 
                    @click="showCreateModal = true"
                 >
                    Nuevo Proveedor
                 </v-btn>
            </div>
        </div>

        <v-card elevation="0" class="border rounded-lg">
            <!-- Toolbar -->
            <v-toolbar color="transparent" density="comfortable" class="px-4 border-b">
                <v-text-field
                    v-model="search"
                    prepend-inner-icon="mdi-magnify"
                    placeholder="Buscar proveedor, contacto o correo..."
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

            <!-- Table -->
            <v-data-table-server
                v-model:items-per-page="itemsPerPage"
                v-model:page="page"
                :headers="headers"
                :items="items"
                :items-length="totalItems"
                :loading="isLoading"
                class="elevation-0"
                @update:options="handleOptionsUpdate"
            >
                <template v-slot:item.nombre_proveedor="{ item }">
                    <div class="d-flex align-center">
                        <AsyncAvatar 
                            :name="item.nombre_proveedor" 
                            size="32" 
                            class="mr-3"
                        />
                        <span class="font-weight-medium">{{ item.nombre_proveedor }}</span>
                    </div>
                </template>

                <template v-slot:item.actions="{ item }">
                    <div class="d-flex justify-end">
                        <v-tooltip text="Editar" location="top">
                            <template v-slot:activator="{ props }">
                                <v-btn icon variant="text" color="primary" size="small" v-bind="props" @click="openUpdateModal(item)">
                                    <v-icon>mdi-pencil-outline</v-icon>
                                </v-btn>
                            </template>
                        </v-tooltip>
                        <v-tooltip text="Eliminar" location="top">
                            <template v-slot:activator="{ props }">
                                <v-btn icon variant="text" color="error" size="small" v-bind="props" @click="openDeleteModal(item)">
                                    <v-icon>mdi-delete-outline</v-icon>
                                </v-btn>
                            </template>
                        </v-tooltip>
                    </div>
                </template>

                <template v-slot:no-data>
                    <div class="pa-8 text-center text-medium-emphasis">
                        <v-icon icon="mdi-truck-off" size="large" class="mb-2 opacity-50"></v-icon>
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
