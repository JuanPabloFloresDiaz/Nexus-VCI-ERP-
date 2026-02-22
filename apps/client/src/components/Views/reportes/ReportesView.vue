<script setup>
  import { useQuery } from '@tanstack/vue-query';
  // --- SEO ---
  import { useHead } from '@unhead/vue';
  import Swal from 'sweetalert2';
  import { computed, ref } from 'vue';
  import ReportCard from '@/components/cards/ReportCard.vue';
  import { getAllCategorias } from '@/services/categorizacion.service';

  import { 
    getCategorizacionReport, 
    getClientesReport, 
    getPedidosExcelReport, 
    getPedidosLogReport, 
    getProductosReport 
  } from '@/services/reportes.service';
  useHead({
    title: 'Reportes',
    meta: [
      { name: 'description', content: 'Generación de reportes y exportables del sistema.' }
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });

  // --- Data Fetching for Parameters ---
  const { data: categoriasData } = useQuery({
    queryKey: ['categorias-report-filter'],
    queryFn: () => getAllCategorias({ limit: 100 })
  });

  const categoriasOptions = computed(() => {
    return categoriasData.value?.data?.map(c => ({
      title: c.nombre_categoria,
      value: c.id
    })) || [];
  });

  // --- Report Configurations ---
  const loadingStates = ref({
    categorizacion: false,
    productos: false,
    clientes: false,
    pedidosLog: false,
    pedidosExcel: false
  });

  async function handleGenerate(key, action, params = null) {
    loadingStates.value[key] = true;
    try {
      if (key === 'pedidosLog' || key === 'pedidosExcel') {
        // Validate dates if needed, though service handles optional
        await action(params?.startDate, params?.endDate);
      } else if (key === 'productos') {
        await action({ id_categoria: params?.id_categoria });
      } else {
        await action();
      }
        
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo generar el reporte. Intente nuevamente.', 'error');
    } finally {
      loadingStates.value[key] = false;
    }
  }

  const reports = computed(() => [
    {
      key: 'categorizacion',
      title: 'Reporte de Categorización',
      description: 'Estructura completa de categorías, subcategorías y filtros.',
      action: getCategorizacionReport,
      params: []
    },
    {
      key: 'productos',
      title: 'Reporte de Productos',
      description: 'Listado de productos con precios y stock. Opcional: filtrar por categoría.',
      action: getProductosReport,
      params: [
        { name: 'id_categoria', label: 'Filtrar por Categoría (Opcional)', type: 'select', items: categoriasOptions.value }
      ]
    },
    {
      key: 'clientes',
      title: 'Reporte de Clientes',
      description: 'Listado maestro de clientes registrados y resumen de pedidos.',
      action: getClientesReport,
      params: []
    },
    {
      key: 'pedidosLog',
      title: 'Bitácora de Pedidos (PDF)',
      description: 'Historial detallado de pedidos en formato PDF.',
      action: getPedidosLogReport,
      params: [
        { name: 'startDate', label: 'Fecha Inicio', type: 'date' },
        { name: 'endDate', label: 'Fecha Fin', type: 'date' }
      ]
    },
    {
      key: 'pedidosExcel',
      title: 'Exportar Pedidos (Excel)',
      description: 'Descargar datos de pedidos para análisis en Excel.',
      action: getPedidosExcelReport,
      params: [
        { name: 'startDate', label: 'Fecha Inicio', type: 'date' },
        { name: 'endDate', label: 'Fecha Fin', type: 'date' }
      ],
      iconType: 'excel'
    }
  ]);

</script>

<template>
  <v-container class="pa-6" fluid>
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold text-secondary">Reportes</h1>
      <p class="text-body-1 text-medium-emphasis">Generación de documentación y exportables</p>
    </div>

    <v-row>
      <v-col 
        v-for="report in reports" 
        :key="report.key"
        cols="12" 
        lg="3" 
        md="4" 
        sm="6"
      >
        <ReportCard
          :description="report.description"
          :icon-type="report.iconType || 'pdf'"
          :loading="loadingStates[report.key]"
          :params="report.params"
          :title="report.title"
          @generate="(params) => handleGenerate(report.key, report.action, params)"
        />
      </v-col>
    </v-row>
  </v-container>
</template>
