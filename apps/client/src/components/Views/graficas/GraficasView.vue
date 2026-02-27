<template>
  <v-container class="pa-6" fluid>
    <!-- Header & Date Filter -->
    <div class="d-flex flex-wrap align-center justify-space-between mb-6 gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold text-secondary">Panel de Control</h1>
        <p class="text-body-2 text-medium-emphasis">Visualización de métricas clave</p>
      </div>
      
      <div class="d-flex align-center gap-2">
        <v-select
          v-model="selectedRange"
          
          density="compact"
          hide-details
          item-title="title"
          item-value="value"
          :items="rangeOptions"
          prepend-inner-icon="mdi-calendar"
          variant="outlined"
          width="200"
        />
        <v-btn color="primary" icon="mdi-refresh" variant="text" @click="refetchAll" />
      </div>
    </div>

    <!-- Stats Cards -->
    <v-row>
      <v-col cols="12" md="4" sm="6">
        <v-card class="border rounded-lg bg-surface" elevation="0">
          <v-card-text class="d-flex align-center">
            <v-avatar class="mr-4 bg-surface-variant" size="48">
              <v-icon color="info" size="24">mdi-currency-usd</v-icon>
            </v-avatar>
            <div>
              <div class="text-overline text-medium-emphasis mb-0">Ventas Totales</div>
              <div v-if="statsLoading" class="text-h5 font-weight-bold text-disabled">Cargando...</div>
              <div v-else class="text-h5 font-weight-bold text-primary">
                {{ formatCurrency(stats?.data?.total_sales || 0) }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4" sm="6">
        <v-card class="border rounded-lg bg-surface" elevation="0">
          <v-card-text class="d-flex align-center">
            <v-avatar class="mr-4 bg-surface-variant" size="48">
              <v-icon color="success" size="24">mdi-cart-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-overline text-medium-emphasis mb-0">Pedidos Totales</div>
              <div v-if="statsLoading" class="text-h5 font-weight-bold text-disabled">Cargando...</div>
              <div v-else class="text-h5 font-weight-bold text-primary">
                {{ stats?.data?.total_orders || 0 }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4" sm="6">
        <v-card class="border rounded-lg bg-surface" elevation="0">
          <v-card-text class="d-flex align-center">
            <v-avatar class="mr-4 bg-surface-variant" size="48">
              <v-icon color="warning" size="24">mdi-account-group</v-icon>
            </v-avatar>
            <div>
              <div class="text-overline text-medium-emphasis mb-0">Clientes Activos</div>
              <div v-if="statsLoading" class="text-h5 font-weight-bold text-disabled">Cargando...</div>
              <div v-else class="text-h5 font-weight-bold text-primary">
                {{ stats?.data?.total_customers || 0 }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Charts -->
    <v-row class="mt-4">
      <!-- Sales History (Line) -->
      <v-col cols="12" md="8">
        <v-card class="border rounded-lg h-100 bg-surface" elevation="0">
          <v-card-title class="text-subtitle-1 font-weight-bold text-primary px-4 pt-4">
            Historial de Ventas
          </v-card-title>
          <v-card-text style="height: 350px; position: relative;">
            <div v-if="salesLoading" class="d-flex align-center justify-center h-100 text-disabled">
              Cargando datos...
            </div>
            <Line v-else-if="salesData.labels.length > 0" :data="salesData" :options="lineOptions" />
            <div v-else class="d-flex align-center justify-center h-100 text-disabled">
              No hay datos disponibles en este rango
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Order Status (Doughnut) -->
      <v-col cols="12" md="4">
        <v-card class="border rounded-lg h-100 bg-surface" elevation="0">
          <v-card-title class="text-subtitle-1 font-weight-bold text-primary px-4 pt-4">
            Estado de Pedidos
          </v-card-title>
          <v-card-text class="d-flex justify-center align-center" style="height: 350px; position: relative;">
            <div v-if="statusLoading" class="text-disabled">Cargando...</div>
            <Doughnut v-else-if="statusData.labels.length > 0" :data="statusData" :options="doughnutOptions" />
            <div v-else class="text-disabled">
              Sin pedidos
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Top Products (Bar) -->
    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-card class="border rounded-lg bg-surface" elevation="0">
          <v-card-title class="text-subtitle-1 font-weight-bold text-primary px-4 pt-4">
            Productos Más Vendidos
          </v-card-title>
          <v-card-text style="height: 300px; position: relative;">
            <div v-if="topProductsLoading" class="d-flex align-center justify-center h-100 text-disabled">
              Cargando...
            </div>
            <Bar v-else-if="topProductsData.labels.length > 0" :data="topProductsData" :options="barOptions" />
            <div v-else class="d-flex align-center justify-center h-100 text-disabled">
              No hay datos de productos
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Top Categories (Bar) -->
      <v-col cols="12" md="6">
        <v-card class="border rounded-lg bg-surface" elevation="0">
          <v-card-title class="text-subtitle-1 font-weight-bold text-primary px-4 pt-4">
            Categorías Más Vendidas
          </v-card-title>
          <v-card-text style="height: 300px; position: relative;">
            <div v-if="topCategoriesLoading" class="d-flex align-center justify-center h-100 text-disabled">
              Cargando...
            </div>
            <Bar v-else-if="topCategoriesData.labels.length > 0" :data="topCategoriesData" :options="barOptions" />
            <div v-else class="d-flex align-center justify-center h-100 text-disabled">
              No hay datos de categorías
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { useHead } from '@unhead/vue';
  import dayjs from 'dayjs';
  import { computed, ref, watch } from 'vue';
  import { Bar, Doughnut, Line } from 'vue-chartjs';
  import { useTheme } from 'vuetify';
  import { 
    getDashboardStats, 
    getOrderStatus, 
    getSalesHistory, 
    getTopCategories,
    getTopProducts 
  } from '@/services/charts.service';
  import { baseOptions, colors } from '@/utils/chart';

  // --- SEO ---
  useHead({
    title: 'Panel de Control',
    meta: [
      { name: 'description', content: 'Visualización de métricas clave y rendimiento del negocio.' }
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });

  // --- State ---
  const rangeOptions = [
    { title: 'Últimos 7 días', value: 7 },
    { title: 'Últimos 30 días', value: 30 },
    { title: 'Últimos 90 días', value: 90 },
    { title: 'Este año', value: 365 }
  ];
  const selectedRange = ref(30);

  // --- Reactivity for Queries ---
  const queryParams = computed(() => {
    const endDate = dayjs().format('YYYY-MM-DD');
    const startDate = dayjs().subtract(selectedRange.value, 'day').format('YYYY-MM-DD');
    return { startDate, endDate };
  });

  // --- Queries ---
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats', queryParams],
    queryFn: () => getDashboardStats(queryParams.value)
  });

  const { data: sales, isLoading: salesLoading, refetch: refetchSales } = useQuery({
    queryKey: ['sales-history', queryParams],
    queryFn: () => getSalesHistory(queryParams.value)
  });

  const { data: topProducts, isLoading: topProductsLoading, refetch: refetchTopProducts } = useQuery({
    queryKey: ['top-products', queryParams],
    queryFn: () => getTopProducts(queryParams.value)
  });

  const { data: orderStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['order-status', queryParams],
    queryFn: () => getOrderStatus(queryParams.value)
  });

  const { data: topCategories, isLoading: topCategoriesLoading, refetch: refetchTopCategories } = useQuery({
    queryKey: ['top-categories', queryParams],
    queryFn: () => getTopCategories(queryParams.value)
  });

  function refetchAll () {
    refetchStats();
    refetchSales();
    refetchTopProducts();
    refetchStatus();
    refetchTopCategories();
  }

  // --- Chart Data Computeds ---
  const salesData = computed(() => {
    const rawData = sales.value?.data || [];
    return {
      labels: rawData.map(d => dayjs(d.date).format('DD MMM')),
      datasets: [{
        label: 'Ventas ($)',
        data: rawData.map(d => d.total),
        borderColor: colors.secondary,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)'); // Blue 500
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4, 
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    };
  });

  const topProductsData = computed(() => {
    const rawData = topProducts.value?.data || [];
    return {
      labels: rawData.map(p => p.product_name),
      datasets: [{
        label: 'Unidades Vendidas',
        data: rawData.map(p => p.total_quantity),
        backgroundColor: [
          '#6366F1', '#3B82F6', '#0EA5E9', '#10B981', '#F59E0B'
        ],
        borderRadius: 4
      }]
    };
  });

  const topCategoriesData = computed(() => {
    const rawData = topCategories.value?.data || [];
    return {
      labels: rawData.map(p => p.category_name),
      datasets: [{
        label: 'Unidades Vendidas',
        data: rawData.map(p => p.total_quantity),
        backgroundColor: [
          '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#14B8A6'
        ],
        borderRadius: 4
      }]
    };
  });

  const statusData = computed(() => {
    const rawData = orderStatus.value?.data || [];
    return {
      labels: rawData.map(s => s.estado_pedido),
      datasets: [{
        data: rawData.map(s => s.count),
        backgroundColor: rawData.map(s => {
          if (s.estado_pedido === 'Completado') return colors.success;
          if (s.estado_pedido === 'Pendiente') return colors.accent;
          if (s.estado_pedido === 'Cancelado') return colors.error;
          return colors.info;
        }),
        borderWidth: 0,
        hoverOffset: 4
      }]
    };
  });

  // --- Theme Dynamic Options ---
  const theme = useTheme();
  
  const dynamicOptions = computed(() => {
    const isDark = theme.global.current.value.dark;
    const textColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const tooltipBg = isDark ? '#1E293B' : '#FFFFFF';
    const tooltipText = isDark ? '#FFFFFF' : '#1E293B';

    return {
      ...baseOptions,
      color: textColor,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor }
        },
        y: {
          grid: { color: gridColor, borderDash: [4, 4] },
          ticks: { color: textColor },
          beginAtZero: true
        }
      },
      plugins: {
        ...baseOptions.plugins,
        legend: {
          ...baseOptions.plugins?.legend,
          labels: {
            ...baseOptions.plugins?.legend?.labels,
            color: textColor
          }
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipText,
          padding: 10,
          cornerRadius: 8
        }
      }
    };
  });

  // --- Options ---
  const lineOptions = computed(() => ({ ...dynamicOptions.value }));
  const barOptions = computed(() => ({ 
    ...dynamicOptions.value,
    indexAxis: 'y', // Horizontal Bar
  }));
  const doughnutOptions = computed(() => ({
    ...dynamicOptions.value,
    scales: { x: { display: false }, y: { display: false } },
    cutout: '70%'
  }));

  function formatCurrency (value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

</script>

<style scoped>
/* Removed hardcoded light-mode slate colors */
</style>
