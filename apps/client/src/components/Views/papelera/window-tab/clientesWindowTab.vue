<script setup>
import { ref, computed } from 'vue';
import { useQuery, useMutation } from '@tanstack/vue-query';
import { getTrashedClientes, restoreCliente, destroyCliente } from '@/services/clientes.service';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/plugins/sweetalert2';
import AsyncAvatar from '@/components/common/AsyncAvatar.vue';

const page = ref(1);
const limit = ref(10);
const search = ref('');

const queryParams = computed(() => ({
    page: page.value,
    limit: limit.value,
    search: search.value
}));

const { data, isLoading, refetch } = useQuery({
    queryKey: ['trashedClientes', queryParams],
    queryFn: () => getTrashedClientes(queryParams.value),
    keepPreviousData: true
});

const headers = [
    { title: 'Cliente', align: 'start', key: 'nombre_cliente' },
    { title: 'DUI', align: 'start', key: 'dui_cliente' },
    { title: 'Teléfono', align: 'start', key: 'telefono_cliente' },
    { title: 'Correo', align: 'start', key: 'correo_cliente' },
    { title: 'Eliminado', align: 'start', key: 'deleted_at' },
    { title: 'Acciones', align: 'end', key: 'actions', sortable: false }
];

const items = computed(() => data.value?.data || []);
const totalItems = computed(() => data.value?.count || 0);

// Restore Mutation
const { mutate: restoreMutate, isPending: isRestoring } = useMutation({
    mutationFn: restoreCliente,
    onSuccess: () => {
        showSuccessToast('Cliente restaurado exitosamente');
        refetch();
    },
    onError: (error) => {
        showErrorToast(error.message || 'Error al restaurar cliente');
    }
});

// Force Delete Mutation
const { mutate: deleteMutate, isPending: isDeleting } = useMutation({
    mutationFn: destroyCliente,
    onSuccess: () => {
        showSuccessToast('Cliente eliminado definitivamente');
        refetch();
    },
    onError: (error) => {
        showErrorToast(error.message || 'Error al eliminar cliente');
    }
});

const handleRestore = async (item) => {
    const confirmed = await showConfirmDialog(
        '¿Restaurar cliente?',
        `El cliente "${item.nombre_cliente} ${item.apellido_cliente}" volverá a estar activo.`
    );
    if (confirmed) {
        restoreMutate(item.id);
    }
};

const handleForceDelete = async (item) => {
    const confirmed = await showConfirmDialog(
        '¿Eliminar definitivamente?',
        `Esta acción no se puede deshacer. El cliente "${item.nombre_cliente} ${item.apellido_cliente}" se borrará permanentemente.`,
        'warning'
    );
    if (confirmed) {
        deleteMutate(item.id);
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
</script>

<template>
    <div class="h-100 d-flex flex-column">
        <!-- Toolbar -->
        <div class="d-flex align-center pa-4 gap-4 border-b bg-white">
            <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                placeholder="Buscar cliente eliminado..."
                density="compact"
                variant="outlined"
                hide-details
                style="max-width: 300px"
                bg-color="grey-lighten-5"
            ></v-text-field>
            <v-spacer></v-spacer>
            <v-btn icon variant="text" @click="refetch" :loading="isLoading">
                <v-icon>mdi-refresh</v-icon>
            </v-btn>
        </div>

        <!-- Table -->
        <v-data-table-server
            v-model:page="page"
            :items-per-page="limit"
            :headers="headers"
            :items="items"
            :items-length="totalItems"
            :loading="isLoading"
            class="flex-grow-1"
            density="comfortable"
            hover
        >
            <template v-slot:item.nombre_cliente="{ item }">
                <div class="d-flex align-center py-2">
                    <AsyncAvatar 
                        :name="`${item.nombre_cliente} ${item.apellido_cliente}`" 
                        size="32" 
                        class="mr-3" 
                        rounded="0"
                    />
                    <div>
                        <div class="font-weight-medium text-body-2">
                            {{ item.nombre_cliente }} {{ item.apellido_cliente }}
                        </div>
                        <div class="text-caption text-medium-emphasis" v-if="item.empresa">
                            {{ item.empresa.nombre_empresa }}
                        </div>
                    </div>
                </div>
            </template>

            <template v-slot:item.deleted_at="{ item }">
                <span class="text-caption text-medium-emphasis">
                    {{ formatDate(item.deleted_at) }}
                </span>
            </template>

            <template v-slot:item.actions="{ item }">
                <div class="d-flex justify-end gap-2">
                    <v-tooltip text="Restaurar" location="top">
                        <template v-slot:activator="{ props }">
                            <v-btn
                                v-bind="props"
                                icon
                                density="comfortable"
                                variant="tonal"
                                color="success"
                                size="small"
                                @click="handleRestore(item)"
                                :loading="isRestoring"
                            >
                                <v-icon size="18">mdi-restore</v-icon>
                            </v-btn>
                        </template>
                    </v-tooltip>

                    <v-tooltip text="Eliminar definitivamente" location="top">
                        <template v-slot:activator="{ props }">
                            <v-btn
                                v-bind="props"
                                icon
                                density="comfortable"
                                variant="tonal"
                                color="error"
                                size="small"
                                @click="handleForceDelete(item)"
                                :loading="isDeleting"
                            >
                                <v-icon size="18">mdi-delete-forever</v-icon>
                            </v-btn>
                        </template>
                    </v-tooltip>
                </div>
            </template>

            <template v-slot:no-data>
                <div class="d-flex flex-column align-center justify-center py-8 text-medium-emphasis">
                    <v-icon size="48" icon="mdi-delete-empty" class="mb-2 opacity-50"></v-icon>
                    <span>No hay clientes en la papelera</span>
                </div>
            </template>
        </v-data-table-server>
    </div>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
