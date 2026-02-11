<script setup>
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { getPedidos } from '@/services/pedidos.service';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'vue-router';

// Modals
import DetallePedidosModal from '@/components/modals/pedidos/DetallePedidosModal.vue';
import DeletePedidoModal from '@/components/modals/pedidos/DeletePedidoModal.vue';
// import UpdatePedidoModal from ... (Maybe later for quick status update)

const router = useRouter();
const { isVendor } = useAuth();

const search = ref('');
const page = ref(1);
const itemsPerPage = ref(10);
const selectedStatus = ref(null);

// Modals State
const showDetailModal = ref(false);
const showDeleteModal = ref(false);
const selectedItem = ref(null);

const headers = computed(() => [
    { title: 'ID', key: 'id', align: 'start' },
    { title: 'Cliente', key: 'cliente.nombre_cliente', align: 'start' },
    { title: 'Fecha', key: 'created_at', align: 'start' },
    { title: 'Total', key: 'total_pedido', align: 'end' },
    { title: 'Estado', key: 'estado_pedido', align: 'center' },
    { title: 'Vendedor', key: 'usuario_creador.nombre_usuario', align: 'start' },
    { title: 'Acciones', key: 'actions', align: 'end', sortable: false },
]);

const { data, isLoading, refetch } = useQuery({
    queryKey: ['pedidos', page, itemsPerPage, search, selectedStatus],
    queryFn: () => getPedidos({
        page: page.value,
        limit: itemsPerPage.value,
        search: search.value,
        estado_pedido: selectedStatus.value
    }),
    placeholderData: (previousData) => previousData,
});

const pedidos = computed(() => data.value?.data || []);
const totalItems = computed(() => data.value?.count || 0);

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getStatusColor = (status) => {
    switch (status) {
        case 'Completado': return 'success';
        case 'Pendiente': return 'warning';
        case 'Cancelado': return 'error';
        default: return 'grey';
    }
};

const handleSuccess = () => {
    refetch();
    showDeleteModal.value = false;
    selectedItem.value = null;
};

const openDetailModal = (item) => {
    selectedItem.value = item;
    showDetailModal.value = true;
};

const openDeleteModal = (item) => {
    selectedItem.value = item;
    showDeleteModal.value = true;
};

const create = () => {
    router.push('/main/pedidos/crear');
};

const createBulk = () => {
    router.push('/main/pedidos/crear_masivo'); // Assuming route exists
};
</script>

<template>
    <v-container fluid class="pa-6">
        <div class="mb-6 d-flex flex-wrap align-center justify-space-between gap-4">
            <div>
                <h1 class="text-h4 font-weight-bold text-primary">Pedidos</h1>
                <p class="text-body-1 text-medium-emphasis">Gestión de ventas y despachos</p>
            </div>
            <div>
                 <v-btn
                    color="success"
                    prepend-icon="mdi-file-excel"
                    elevation="0"
                    class="mr-2"
                    @click="createBulk"
                    v-if="!isVendor" 
                 >
                    Carga Masiva
                 </v-btn>
                 <v-btn 
                    color="primary" 
                    prepend-icon="mdi-cart-plus" 
                    elevation="0" 
                    @click="create"
                 >
                    Nuevo Pedido
                 </v-btn>
            </div>
        </div>

        <v-card elevation="0" class="border rounded-lg">
             <!-- Toolbar / Filters -->
            <v-toolbar color="transparent" density="comfortable" class="px-4 border-b">
                <v-text-field
                    v-model="search"
                    prepend-inner-icon="mdi-magnify"
                    placeholder="Buscar pedido (ID, Total)..."
                    density="compact"
                    variant="outlined"
                    hide-details
                    single-line
                    style="max-width: 300px;"
                    class="mr-2"
                ></v-text-field>
                
                <v-select
                    v-model="selectedStatus"
                    :items="['Pendiente', 'Completado', 'Cancelado']"
                    label="Estado"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    style="max-width: 200px;"
                    class="mr-2"
                ></v-select>

                <v-spacer></v-spacer>
                 <v-btn icon variant="text" @click="refetch">
                    <v-icon>mdi-refresh</v-icon>
                </v-btn>
            </v-toolbar>

            <!-- Table -->
            <v-data-table-server
                v-model:items-per-page="itemsPerPage"
                :headers="headers"
                :items="pedidos"
                :items-length="totalItems"
                :loading="isLoading"
                :page="page"
                @update:page="page = $event"
                class="elevation-0"
                hover
            >
                    <template v-slot:loading>
                        <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
                    </template>

                    <!-- ID Column -->
                    <template v-slot:item.id="{ item }">
                        <span class="text-caption font-weight-bold text-medium-emphasis">#{{ item.id.substring(0, 8) }}</span>
                    </template>

                    <!-- Date Column -->
                     <template v-slot:item.created_at="{ item }">
                        {{ formatDate(item.created_at) }}
                    </template>

                    <!-- Total Column -->
                     <template v-slot:item.total_pedido="{ item }">
                        <span class="font-weight-bold">{{ formatCurrency(item.total_pedido) }}</span>
                    </template>

                    <!-- Status Column -->
                     <template v-slot:item.estado_pedido="{ item }">
                        <v-chip size="small" :color="getStatusColor(item.estado_pedido)" variant="flat">
                            {{ item.estado_pedido }}
                        </v-chip>
                    </template>

                    <!-- Actions Column -->
                    <template v-slot:item.actions="{ item }">
                        <div class="d-flex justify-end gap-2">
                            <v-btn
                                icon
                                size="small"
                                variant="text"
                                color="info"
                                @click="openDetailModal(item)"
                                v-tooltip="'Ver Detalles'"
                            >
                                <v-icon>mdi-eye</v-icon>
                            </v-btn>
                            
                            <!-- Edit Status Button (Maybe via router or modal) -->
                            <!-- <v-btn ... @click="..."><v-icon>mdi-pencil</v-icon></v-btn> -->

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
                            <v-icon size="48" color="medium-emphasis" class="mb-4">mdi-cart-off</v-icon>
                            <h3 class="text-h6 text-medium-emphasis">No se encontraron pedidos</h3>
                             <p class="text-body-2 text-disabled">Registra una nueva venta</p>
                        </div>
                    </template>
            </v-data-table-server>
        </v-card>

        <!-- Modals -->
        <DetallePedidosModal
            v-if="selectedItem"
            v-model="showDetailModal"
            :pedido="selectedItem"
        />

        <DeletePedidoModal
            v-if="selectedItem"
            v-model="showDeleteModal"
            :pedido="selectedItem"
            @success="handleSuccess"
        />
    </v-container>
</template>
