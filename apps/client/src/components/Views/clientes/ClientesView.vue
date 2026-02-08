<script setup>
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { getClientes } from '@/services/clientes.service';
import { useAuth } from '@/hooks/useAuth';

// Modals
import CreateClienteModal from '@/components/modals/clientes/CreateClienteModal.vue';
import UpdateClienteModal from '@/components/modals/clientes/UpdateClienteModal.vue';
import DeleteClienteModal from '@/components/modals/clientes/DeleteClienteModal.vue';
import BulkCreateClienteModal from '@/components/modals/clientes/BulkCreateClienteModal.vue';

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

const openCreateModal = () => {
    showCreateModal.value = true;
};
const openBulkModal = () => {
    showBulkModal.value = true;
};

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

const handleSuccess = () => {
    refetch();
    showCreateModal.value = false;
    showUpdateModal.value = false;
    showDeleteModal.value = false;
    showBulkModal.value = false;
    selectedItem.value = null;
};

const openUpdateModal = (item) => {
    selectedItem.value = item;
    showUpdateModal.value = true;
};

const openDeleteModal = (item) => {
    selectedItem.value = item;
    showDeleteModal.value = true;
};
</script>

<template>
    <v-container fluid class="pa-6">
        <div class="mb-6 d-flex flex-wrap align-center justify-space-between gap-4">
            <div>
                <h1 class="text-h4 font-weight-bold text-primary">Clientes</h1>
                <p class="text-body-1 text-medium-emphasis">Gestión de cartera de clientes</p>
            </div>
            <div>
                 <v-btn
                    color="success"
                    prepend-icon="mdi-file-excel"
                    elevation="0"
                    class="mr-2"
                    @click="openBulkModal"
                 >
                    Carga Masiva
                 </v-btn>
                 <v-btn 
                    color="primary" 
                    prepend-icon="mdi-account-plus" 
                    elevation="0" 
                    @click="openCreateModal"
                 >
                    Nuevo Cliente
                 </v-btn>
            </div>
        </div>

        <v-card elevation="0" class="border rounded-lg">
             <!-- Toolbar / Filters -->
            <v-toolbar color="transparent" density="comfortable" class="px-4 border-b">
                <v-text-field
                    v-model="search"
                    prepend-inner-icon="mdi-magnify"
                    placeholder="Buscar cliente (Nombre, Correo, DUI...)"
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
                :headers="headers"
                :items="clientes"
                :items-length="totalItems"
                :loading="isLoading"
                :page="page"
                @update:page="page = $event"
                class="elevation-0"
                hover
            >
                    <!-- Loading state -->
                    <template v-slot:loading>
                        <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
                    </template>

                    <!-- Phone Column -->
                     <template v-slot:item.telefono_cliente="{ item }">
                        {{ item.telefono_cliente || 'N/A' }}
                    </template>

                    <!-- DUI Column -->
                     <template v-slot:item.dui_cliente="{ item }">
                        {{ item.dui_cliente || 'N/A' }}
                    </template>

                    <!-- Actions Column -->
                    <template v-slot:item.actions="{ item }">
                        <div class="d-flex justify-end gap-2">
                            <v-btn
                                icon
                                size="small"
                                variant="text"
                                color="primary"
                                @click="openUpdateModal(item)"
                                v-tooltip="'Editar'"
                            >
                                <v-icon>mdi-pencil</v-icon>
                            </v-btn>
                            
                            <v-btn
                                v-if="!isVendor"
                                icon
                                size="small"
                                variant="text"
                                color="error"
                                @click="openDeleteModal(item)"
                                v-tooltip="'Eliminar'"
                            >
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                        </div>
                    </template>

                    <template v-slot:no-data>
                        <div class="pa-8 text-center">
                            <v-icon size="48" color="medium-emphasis" class="mb-4">mdi-account-off-outline</v-icon>
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
            @update:modelValue="showCreateModal = $event"
        />
        
        <UpdateClienteModal
            v-if="selectedItem"
            v-model="showUpdateModal"
            :cliente="selectedItem"
            @success="handleSuccess"
            @update:modelValue="showUpdateModal = $event"
        />
        
        <DeleteClienteModal
            v-if="selectedItem"
            v-model="showDeleteModal"
            :cliente="selectedItem"
            @success="handleSuccess"
            @update:modelValue="showDeleteModal = $event"
        />
        
        <BulkCreateClienteModal
            v-model="showBulkModal"
            @success="handleSuccess"
            @update:modelValue="showBulkModal = $event"
        />
    </v-container>
</template>

<style scoped>
.gap-2 {
    gap: 8px;
}
</style>
