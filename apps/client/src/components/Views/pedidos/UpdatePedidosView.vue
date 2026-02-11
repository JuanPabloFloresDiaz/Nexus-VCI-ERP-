<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuery, useMutation } from '@tanstack/vue-query';
import { getPedidoById, updateEstadoPedido } from '@/services/pedidos.service';
import { showSuccessToast, showErrorToast } from '@/plugins/sweetalert2';

const route = useRoute();
const router = useRouter();

const pedidoId = route.params.id;
const validStatuses = ['Pendiente', 'Completado', 'Cancelado'];
const selectedStatus = ref(null);

const { data: pedido, isLoading, refetch } = useQuery({
    queryKey: ['pedido', pedidoId],
    queryFn: () => getPedidoById(pedidoId),
    enabled: !!pedidoId
});

const { mutate, isPending } = useMutation({
    mutationFn: (newStatus) => updateEstadoPedido(pedidoId, { estado_pedido: newStatus }),
    onSuccess: () => {
        showSuccessToast('Estado del pedido actualizado');
        refetch();
    },
    onError: (error) => {
        showErrorToast(error.response?.data?.message || 'Error al actualizar estado');
    }
});

const save = () => {
    if (selectedStatus.value) {
        mutate(selectedStatus.value);
    }
};

onMounted(() => {
    if (pedido.value) {
        selectedStatus.value = pedido.value.estado_pedido;
    }
});

// Watch for data load to set initial status
watch(() => pedido.value, (newVal) => {
    if (newVal) {
        selectedStatus.value = newVal.estado_pedido;
    }
});
</script>

<template>
    <v-container fluid class="pa-6">
        <div class="mb-6 d-flex align-center">
            <v-btn icon="mdi-arrow-left" variant="text" @click="router.back()" class="mr-4"></v-btn>
            <div>
                <h1 class="text-h4 font-weight-bold text-primary">Editar Pedido</h1>
                <p class="text-body-1 text-medium-emphasis">Actualizar estado del pedido #{{ pedidoId?.substring(0,8) }}</p>
            </div>
        </div>

        <v-card v-if="isLoading" class="pa-6">
            <v-skeleton-loader type="article"></v-skeleton-loader>
        </v-card>

        <v-card v-else-if="pedido" class="pa-6 border rounded-lg" max-width="800">
            <v-row>
                <v-col cols="12" md="6">
                    <div class="text-subtitle-1 font-weight-bold mb-2">Información</div>
                    <div class="mb-1"><strong>Cliente:</strong> {{ pedido.cliente?.nombre_cliente }} {{ pedido.cliente?.apellido_cliente }}</div>
                    <div class="mb-1"><strong>Fecha:</strong> {{ new Date(pedido.created_at).toLocaleString() }}</div>
                    <div class="mb-1"><strong>Total:</strong> Q{{ pedido.total_pedido }}</div>
                </v-col>
                <v-col cols="12" md="6">
                    <v-select
                        v-model="selectedStatus"
                        :items="validStatuses"
                        label="Estado del Pedido"
                        variant="outlined"
                        :color="selectedStatus === 'Completado' ? 'success' : selectedStatus === 'Cancelado' ? 'error' : 'warning'"
                    ></v-select>
                    
                    <v-alert v-if="selectedStatus === 'Cancelado'" type="warning" variant="tonal" class="mt-2" density="compact">
                        Cancelar un pedido <strong>NO</strong> restaura el stock automáticamente (dependiendo de la lógica del backend).
                    </v-alert>
                </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>

            <h3 class="text-h6 mb-2">Detalles</h3>
            <v-table density="compact" class="border rounded">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in pedido.detalles" :key="item.id">
                        <td>{{ item.producto?.nombre_producto }}</td>
                        <td>{{ item.cantidad }}</td>
                        <td>Q{{ item.subtotal }}</td>
                    </tr>
                </tbody>
            </v-table>

            <div class="d-flex justify-end mt-6 gap-2">
                <v-btn variant="text" @click="router.back()">Cancelar</v-btn>
                <v-btn
                    color="primary"
                    @click="save"
                    :loading="isPending"
                    :disabled="selectedStatus === pedido.estado_pedido"
                >
                    Guardar Cambios
                </v-btn>
            </div>
        </v-card>
    </v-container>
</template>
