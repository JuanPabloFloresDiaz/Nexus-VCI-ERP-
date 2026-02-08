<script setup>
import { ref, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { getTrashedUsuarios, restoreUsuario, destroyUsuario } from '@/services/usuarios.service';
import { useAuth } from '@/hooks/useAuth';
import { showSuccessToast, showErrorToast, fireToast } from '@/plugins/sweetalert2';
import Swal from 'sweetalert2';

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
const handleRestore = (item) => {
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
};

const handleDestroy = (item) => {
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
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
};
</script>

<template>
    <v-card flat class="bg-transparent">
        <!-- Toolbar -->
        <v-toolbar color="transparent" density="comfortable" class="px-0 mb-4">
             <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                placeholder="Buscar usuario eliminado..."
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
            class="elevation-0 border rounded-lg"
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

            <!-- Deleted At Column -->
             <template v-slot:item.deleted_at="{ item }">
                <span class="text-caption text-medium-emphasis">
                    {{ formatDate(item.deleted_at) }}
                </span>
            </template>

            <!-- Actions Column -->
            <template v-slot:item.actions="{ item }">
                <div class="d-flex justify-end gap-2">
                    <v-tooltip text="Restaurar" location="top">
                        <template v-slot:activator="{ props }">
                            <v-btn
                                icon
                                size="small"
                                variant="text"
                                color="success"
                                v-bind="props"
                                @click="handleRestore(item)"
                                :loading="isRestoring"
                            >
                                <v-icon>mdi-restore</v-icon>
                            </v-btn>
                        </template>
                    </v-tooltip>
                    
                    <v-tooltip text="Eliminar definitivamente" location="top">
                        <template v-slot:activator="{ props }">
                            <v-btn
                                icon
                                size="small"
                                variant="text"
                                color="error"
                                v-bind="props"
                                @click="handleDestroy(item)"
                                :loading="isDestroying"
                            >
                                <v-icon>mdi-delete-forever</v-icon>
                            </v-btn>
                        </template>
                    </v-tooltip>
                </div>
            </template>

            <template v-slot:no-data>
                <div class="pa-8 text-center">
                    <v-icon size="48" color="medium-emphasis" class="mb-4">mdi-delete-empty</v-icon>
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
