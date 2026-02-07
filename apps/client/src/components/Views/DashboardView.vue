<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold text-primary">Dashboard</h1>
      <p class="text-body-1 text-medium-emphasis">Resumen general de la empresa</p>
    </div>

    <!-- Key Metrics Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card elevation="0" class="border rounded-lg h-100">
          <v-skeleton-loader v-if="isLoadingMetrics" type="list-item-two-line" class="bg-transparent"></v-skeleton-loader>
          <v-card-text v-else>
            <div class="d-flex align-start justify-space-between mb-4">
              <div>
                <div class="text-overline font-weight-bold text-medium-emphasis mb-1">Ventas Totales</div>
                <div class="text-h4 font-weight-bold text-primary">
                  {{ formatCurrency(metrics.total_ventas) }}
                </div>
              </div>
              <v-avatar color="primary" variant="tonal" rounded="lg" size="48">
                <v-icon icon="mdi-cash-multiple" size="24"></v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card elevation="0" class="border rounded-lg h-100">
          <v-skeleton-loader v-if="isLoadingMetrics" type="list-item-two-line" class="bg-transparent"></v-skeleton-loader>
          <v-card-text v-else>
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <div class="text-overline font-weight-bold text-medium-emphasis mb-1">Total Productos</div>
                <div class="text-h4 font-weight-bold text-primary">
                  {{ metrics.total_productos }}
                </div>
              </div>
              <v-avatar color="info" variant="tonal" rounded="lg" size="48">
                <v-icon icon="mdi-package-variant-closed" size="24"></v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Top Lists -->
    <v-row>
      <!-- Top Products -->
      <v-col cols="12" md="6">
        <v-card elevation="0" class="border rounded-lg h-100">
            <v-card-title class="d-flex align-center py-4 px-4 border-b">
                <span class="text-h6 font-weight-bold">Top Productos</span>
                <v-spacer></v-spacer>
                <v-icon icon="mdi-trophy-outline" color="amber" size="small"></v-icon>
            </v-card-title>
          <v-list lines="two" class="pa-0">
             <template v-if="isLoadingProducts">
                <v-skeleton-loader v-for="n in 5" :key="n" type="list-item-avatar-two-line" class="border-b"></v-skeleton-loader>
             </template>
             <template v-else-if="topProducts.length">
                <v-list-item
                v-for="(item, i) in topProducts"
                :key="item.id_producto"
                :prepend-avatar="item.producto?.imagen_url || undefined"
                class="py-3 border-b"
                >
                <template v-if="!item.producto?.imagen_url" v-slot:prepend>
                    <v-avatar color="surface-variant" variant="flat">
                        <v-icon icon="mdi-image-off-outline"></v-icon>
                    </v-avatar>
                </template>
                
                <v-list-item-title class="font-weight-bold text-body-2">
                    {{ item.producto?.nombre_producto || 'Producto Desconocido' }}
                </v-list-item-title>
                
                <v-list-item-subtitle class="mt-1">
                    <v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold">
                    {{ item.total_vendido }} unid.
                    </v-chip>
                    <span class="ms-2 text-caption text-medium-emphasis">
                        {{ formatCurrency(item.producto?.precio_unitario) }} / ud.
                    </span>
                </v-list-item-subtitle>

                <template v-slot:append>
                    <div class="text-h6 font-weight-bold text-medium-emphasis opacity-50">
                        #{{ i + 1 }}
                    </div>
                </template>
                </v-list-item>
             </template>
             <div v-else class="pa-8 text-center text-medium-emphasis">
                <v-icon icon="mdi-package-variant" size="large" class="mb-2 opacity-50"></v-icon>
                <div>No hay datos de productos vendidos aún</div>
             </div>
          </v-list>
        </v-card>
      </v-col>

      <!-- Top Clients -->
      <v-col cols="12" md="6">
        <v-card elevation="0" class="border rounded-lg h-100">
             <v-card-title class="d-flex align-center py-4 px-4 border-b">
                <span class="text-h6 font-weight-bold">Mejores Clientes</span>
                <v-spacer></v-spacer>
                <v-icon icon="mdi-account-star-outline" color="info" size="small"></v-icon>
            </v-card-title>
          <v-list lines="two" class="pa-0">
            <template v-if="isLoadingClients">
                <v-skeleton-loader v-for="n in 5" :key="n" type="list-item-avatar-two-line" class="border-b"></v-skeleton-loader>
            </template>
            <template v-else-if="topClients.length">
                <v-list-item
                v-for="(client, i) in topClients"
                :key="client.id_cliente"
                class="py-3 border-b"
                >
                <template v-slot:prepend>
                    <v-avatar color="primary" variant="tonal">
                        <span class="text-h6 font-weight-bold">{{ getInitials(client.cliente) }}</span>
                    </v-avatar>
                </template>

                <v-list-item-title class="font-weight-bold text-body-2">
                    {{ getClientName(client.cliente) }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption mt-1">
                     {{ client.total_pedidos }} Pedidos
                </v-list-item-subtitle>

                <template v-slot:append>
                    <div class="text-end">
                        <div class="text-subtitle-2 font-weight-bold text-success">
                            {{ formatCurrency(client.total_gastado) }}
                        </div>
                        <div class="text-caption text-medium-emphasis">Total Comprado</div>
                    </div>
                </template>
                </v-list-item>
            </template>
            <div v-else class="pa-8 text-center text-medium-emphasis">
                <v-icon icon="mdi-account-off-outline" size="large" class="mb-2 opacity-50"></v-icon>
                <div>No hay datos de clientes aún</div>
             </div>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { getGeneralMetrics, getTopProducts, getTopClients } from '@/services/dashboard.service';

// --- Queries ---

// 1. General Metrics
const { data: metricsData, isPending: isLoadingMetrics } = useQuery({
  queryKey: ['dashboard', 'metrics'],
  queryFn: getGeneralMetrics,
  staleTime: 1000 * 60 * 5, // 5 minutes
});

const metrics = computed(() => {
  if (metricsData.value?.success) return metricsData.value.data;
  return { total_ventas: 0, total_productos: 0 };
});

// 2. Top Products
const { data: productsData, isPending: isLoadingProducts } = useQuery({
  queryKey: ['dashboard', 'top-products'],
  queryFn: getTopProducts,
  staleTime: 1000 * 60 * 5,
});

const topProducts = computed(() => {
  return productsData.value?.success ? productsData.value.data : [];
});

// 3. Top Clients
const { data: clientsData, isPending: isLoadingClients } = useQuery({
  queryKey: ['dashboard', 'top-clients'],
  queryFn: getTopClients,
  staleTime: 1000 * 60 * 5,
});

const topClients = computed(() => {
  return clientsData.value?.success ? clientsData.value.data : [];
});

// --- Formatting Helpers ---

const formatCurrency = (amount) => {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val);
};

const getClientName = (cliente) => {
    if (!cliente) return 'Cliente Desconocido';
    return `${cliente.nombre_cliente} ${cliente.apellido_cliente}`;
};

const getInitials = (cliente) => {
    if (!cliente) return '??';
    const name = cliente.nombre_cliente?.charAt(0) || '';
    const last = cliente.apellido_cliente?.charAt(0) || '';
    return (name + last).toUpperCase();
};
</script>

<style scoped>
.v-card {
    transition: transform 0.2s;
}
</style>