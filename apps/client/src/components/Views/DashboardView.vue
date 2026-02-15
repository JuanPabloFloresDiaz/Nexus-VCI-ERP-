<template>
  <v-container class="pa-6" fluid>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold text-primary">Dashboard</h1>
      <p class="text-body-1 text-medium-emphasis">Resumen general de la empresa</p>
    </div>

    <!-- Key Metrics Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card class="border rounded-lg h-100" elevation="0">
          <v-skeleton-loader v-if="isLoadingMetrics" class="bg-transparent" type="list-item-two-line" />
          <v-card-text v-else>
            <div class="d-flex align-start justify-space-between mb-4">
              <div>
                <div class="text-overline font-weight-bold text-medium-emphasis mb-1">Ventas Totales</div>
                <div class="text-h4 font-weight-bold text-primary">
                  {{ formatCurrency(metrics.total_ventas) }}
                </div>
              </div>
              <v-avatar color="primary" rounded="lg" size="48" variant="tonal">
                <v-icon icon="mdi-cash-multiple" size="24" />
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="border rounded-lg h-100" elevation="0">
          <v-skeleton-loader v-if="isLoadingMetrics" class="bg-transparent" type="list-item-two-line" />
          <v-card-text v-else>
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <div class="text-overline font-weight-bold text-medium-emphasis mb-1">Total Productos</div>
                <div class="text-h4 font-weight-bold text-primary">
                  {{ metrics.total_productos }}
                </div>
              </div>
              <v-avatar color="info" rounded="lg" size="48" variant="tonal">
                <v-icon icon="mdi-package-variant-closed" size="24" />
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
        <v-card class="border rounded-lg h-100" elevation="0">
          <v-card-title class="d-flex align-center py-4 px-4 border-b">
            <span class="text-h6 font-weight-bold">Top Productos</span>
            <v-spacer />
            <v-icon color="amber" icon="mdi-trophy-outline" size="small" />
          </v-card-title>
          <v-list class="pa-0" lines="two">
            <template v-if="isLoadingProducts">
              <v-skeleton-loader v-for="n in 5" :key="n" class="border-b" type="list-item-avatar-two-line" />
            </template>
            <template v-else-if="topProducts.length > 0">
              <v-list-item
                v-for="(item, i) in topProducts"
                :key="item.id_producto"
                class="py-3 border-b"
                :prepend-avatar="item.producto?.imagen_url || undefined"
              >
                <template v-if="!item.producto?.imagen_url" #prepend>
                  <v-avatar color="surface-variant" variant="flat">
                    <v-icon icon="mdi-image-off-outline" />
                  </v-avatar>
                </template>
                
                <v-list-item-title class="font-weight-bold text-body-2">
                  {{ item.producto?.nombre_producto || 'Producto Desconocido' }}
                </v-list-item-title>
                
                <v-list-item-subtitle class="mt-1">
                  <v-chip class="font-weight-bold" color="primary" size="x-small" variant="flat">
                    {{ item.total_vendido }} unid.
                  </v-chip>
                  <span class="ms-2 text-caption text-medium-emphasis">
                    {{ getFormattedPrice(item.producto) }} / ud.
                  </span>
                </v-list-item-subtitle>

                <template #append>
                  <div class="text-h6 font-weight-bold text-medium-emphasis opacity-50">
                    #{{ i + 1 }}
                  </div>
                </template>
              </v-list-item>
            </template>
            <div v-else class="pa-8 text-center text-medium-emphasis">
              <v-icon class="mb-2 opacity-50" icon="mdi-package-variant" size="large" />
              <div>No hay datos de productos vendidos aún</div>
            </div>
          </v-list>
        </v-card>
      </v-col>

      <!-- Top Clients -->
      <v-col cols="12" md="6">
        <v-card class="border rounded-lg h-100" elevation="0">
          <v-card-title class="d-flex align-center py-4 px-4 border-b">
            <span class="text-h6 font-weight-bold">Mejores Clientes</span>
            <v-spacer />
            <v-icon color="info" icon="mdi-account-star-outline" size="small" />
          </v-card-title>
          <v-list class="pa-0" lines="two">
            <template v-if="isLoadingClients">
              <v-skeleton-loader v-for="n in 5" :key="n" class="border-b" type="list-item-avatar-two-line" />
            </template>
            <template v-else-if="topClients.length > 0">
              <v-list-item
                v-for="(client, i) in topClients"
                :key="client.id_cliente"
                class="py-3 border-b"
              >
                <template #prepend>
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

                <template #append>
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
              <v-icon class="mb-2 opacity-50" icon="mdi-account-off-outline" size="large" />
              <div>No hay datos de clientes aún</div>
            </div>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { computed } from 'vue';
  import { getGeneralMetrics, getTopClients, getTopProducts } from '@/services/dashboard.service';

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

  function formatCurrency (amount) {
    const val = Number(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  }

  function getFormattedPrice(producto) {
    if (!producto) return formatCurrency(0);
    // If variants exist, calculate range
    if (producto.variantes && producto.variantes.length > 0) {
        const prices = producto.variantes.map(v => Number(v.precio_unitario));
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min === max) return formatCurrency(min);
        return `${formatCurrency(min)} - ${formatCurrency(max)}`;
    }
    // Fallback if no variants but somehow price exists (legacy)
    return formatCurrency(producto.precio_unitario || 0);
  }

  function getClientName (cliente) {
    if (!cliente) return 'Cliente Desconocido';
    return `${cliente.nombre_cliente} ${cliente.apellido_cliente}`;
  }

  function getInitials (cliente) {
    if (!cliente) return '??';
    const name = cliente.nombre_cliente?.charAt(0) || '';
    const last = cliente.apellido_cliente?.charAt(0) || '';
    return (name + last).toUpperCase();
  }
</script>

<style scoped>
.v-card {
    transition: transform 0.2s;
}
</style>