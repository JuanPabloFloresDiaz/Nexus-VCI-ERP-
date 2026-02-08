<script setup>
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { getUsuarios } from '@/services/usuarios.service';
import { useAuth } from '@/hooks/useAuth';

// Modals
import CreateUsuarioModal from '@/components/modals/usuarios/CreateUsuarioModal.vue';
import UpdateUsuarioModal from '@/components/modals/usuarios/UpdateUsuarioModal.vue';
import DeleteUsuarioModal from '@/components/modals/usuarios/DeleteUsuarioModal.vue';

const { isSuperAdmin, user } = useAuth();
const search = ref('');
const page = ref(1);
const itemsPerPage = ref(10);

// Headers
const headers = computed(() => {
    const baseHeaders = [
        { title: 'Nombre', key: 'nombre_usuario', align: 'start' },
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

const openCreateModal = () => {
    showCreateModal.value = true;
};

const openUpdateModal = (item) => {
    selectedItem.value = item;
    showUpdateModal.value = true;
};

const openDeleteModal = (item) => {
    selectedItem.value = item;
    showDeleteModal.value = true;
};

const handleSuccess = () => {
    refetch();
    showCreateModal.value = false;
    showUpdateModal.value = false;
    showDeleteModal.value = false;
    selectedItem.value = null;
};

const canDelete = (item) => {
    // Prevent self-deletion
    return item.id !== user.value.id;
};
</script>

<template>
    <v-container fluid class="pa-6">
        <div class="mb-6 d-flex flex-wrap align-center justify-space-between gap-4">
            <div>
                <h1 class="text-h4 font-weight-bold text-primary">Usuarios</h1>
                <p class="text-body-1 text-medium-emphasis">Gestión de acceso y roles</p>
            </div>
            <div>
                 <v-btn 
                    color="primary" 
                    prepend-icon="mdi-account-plus" 
                    elevation="0" 
                    @click="openCreateModal"
                 >
                    Nuevo Usuario
                 </v-btn>
            </div>
        </div>

        <v-card elevation="0" class="border rounded-lg">
             <!-- Toolbar / Filters -->
            <v-toolbar color="transparent" density="comfortable" class="px-4 border-b">
                <v-text-field
                    v-model="search"
                    prepend-inner-icon="mdi-magnify"
                    placeholder="Buscar usuario..."
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
                :items="usuarios"
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

                    <!-- Role Column -->
                    <template v-slot:item.rol_usuario="{ item }">
                        <v-chip
                            size="small"
                            :color="item.rol_usuario === 'Administrador' || item.rol_usuario === 'SuperAdministrador' ? 'primary' : 'secondary'"
                            variant="flat"
                            class="font-weight-medium"
                        >
                            {{ item.rol_usuario }}
                        </v-chip>
                    </template>

                     <!-- Estado Column -->
                    <template v-slot:item.estado_usuario="{ item }">
                        <v-chip
                            size="small"
                            :color="item.estado_usuario ? 'success' : 'error'"
                            variant="tonal"
                            class="font-weight-medium"
                        >
                            <v-icon start size="small">
                                {{ item.estado_usuario ? 'mdi-check-circle' : 'mdi-close-circle' }}
                            </v-icon>
                            {{ item.estado_usuario ? 'Activo' : 'Inactivo' }}
                        </v-chip>
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
                                icon
                                size="small"
                                variant="text"
                                color="error"
                                :disabled="!canDelete(item)"
                                @click="openDeleteModal(item)"
                                v-tooltip="!canDelete(item) ? 'No puedes eliminarte a ti mismo' : 'Eliminar'"
                            >
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                        </div>
                    </template>

                    <template v-slot:no-data>
                        <div class="pa-8 text-center">
                            <v-icon size="48" color="medium-emphasis" class="mb-4">mdi-account-off-outline</v-icon>
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
            @update:modelValue="showCreateModal = $event"
        />
        
        <UpdateUsuarioModal
            v-if="selectedItem"
            v-model="showUpdateModal"
            :usuario="selectedItem"
            @success="handleSuccess"
            @update:modelValue="showUpdateModal = $event"
        />
        
        <DeleteUsuarioModal
            v-if="selectedItem"
            v-model="showDeleteModal"
            :usuario="selectedItem"
            @success="handleSuccess"
            @update:modelValue="showDeleteModal = $event"
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
