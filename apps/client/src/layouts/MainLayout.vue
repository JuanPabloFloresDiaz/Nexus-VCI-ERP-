<template>
  <v-app>
    <!-- Navigation Drawer (Sidebar) -->
    <v-navigation-drawer
      v-model="drawer"
      class="border-none"
      color="primary"
      permanent
      :rail="rail"
      width="280"
      @click="rail = false"
    >
      <v-list class="pa-4">
        <v-list-item
          class="text-white"
          prepend-icon="mdi-cube-outline"
          subtitle="Enterprise Resource Planning"
          title="Nexus VCI"
        >
          <template #append>
            <v-btn
              icon="mdi-chevron-left"
              size="small"
              variant="text"
              @click.stop="rail = !rail"
            />
          </template>
        </v-list-item>
      </v-list>

      <v-divider class="mb-2 border-opacity-25" />

      <!-- Global Search Trigger (Visible in Sidebar if expanded) -->
      <div v-if="!rail" class="px-3 mb-4">
        <v-btn
          block
          class="text-none justify-start text-caption"
          color="white"
          prepend-icon="mdi-magnify"
          variant="tonal"
          @click="showSearch = true"
        >
          Buscar (Ctrl + K)
        </v-btn>
      </div>

      <v-list class="pa-2" density="compact" nav>
        <template v-for="(item, i) in filteredMenu" :key="i">
          <v-list-subheader 
            v-if="item.header && !rail" 
            class="text-uppercase text-caption font-weight-bold opacity-70 mt-4 mb-2 ml-2 text-white"
          >
            {{ item.header }}
          </v-list-subheader>
          
          <v-list-item
            v-else-if="!item.header"
            active-class="bg-secondary text-white rounded-lg elevation-2"
            class="mb-1 rounded-lg text-white opacity-90 hover:opacity-100"
            link
            :prepend-icon="item.icon"
            :title="item.title"
            :to="item.to"
            :value="item.value"
          />
        </template>
      </v-list>
      
      <template #append>
        <div v-if="!rail" class="pa-4">
          <v-card class="rounded-lg pa-4" color="secondary" elevation="0">
            <div class="d-flex align-center">
              <v-avatar class="text-primary font-weight-bold mr-3" color="white" size="32">
                {{ userAvatarInitials }}
              </v-avatar>
              <div class="text-truncate">
                <div class="text-subtitle-2 font-weight-bold">{{ userName }}</div>
                <div class="text-caption opacity-80 text-truncate">{{ userRole }}</div>
              </div>
              <v-spacer />
              <v-btn density="compact" icon="mdi-logout" variant="text" @click="handleLogout" />
            </div>
          </v-card>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App Bar (Header) - Optional mostly for mobile triggers or extra actions, keeping minimal as per request -->
    <v-app-bar class="border-b" color="background" flat>
      <v-app-bar-nav-icon v-if="mobile" color="grey-darken-1" @click="rail = !rail" />
      <div class="text-h6 font-weight-bold text-primary ml-4">{{ currentPageTitle }}</div>
      <v-spacer />
      <!-- Right side info / notifications if needed -->
    </v-app-bar>

    <!-- Main Content Area -->
    <v-main class="bg-background">
      <v-container class="pa-6 fill-height align-start" fluid>
        <router-view v-slot="{ Component }">
          <transition mode="out-in" name="fade">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- Global Search Modal -->
    <v-dialog v-model="showSearch" max-width="600">
      <v-card class="rounded-lg">
        <v-card-title class="pa-0">
          <v-text-field
            v-model="searchQuery"
            autofocus
            class="text-h6"
            hide-details
            placeholder="Buscar módulo, acción o reporte..."
            prepend-inner-icon="mdi-magnify"
            single-line
            variant="solo"
          />
        </v-card-title>
        <v-card-text v-if="searchQuery" class="pa-0">
          <v-list lines="two">
            <v-list-item
              v-for="(result, i) in searchResults"
              :key="i"
              :prepend-icon="result.icon"
              :subtitle="result.description"
              :title="result.title"
              :to="result.to"
              @click="showSearch = false"
            >
              <template #append>
                <v-chip class="text-uppercase" label size="x-small">{{ result.category }}</v-chip>
              </template>
            </v-list-item>
            <v-list-item v-if="searchResults.length === 0" class="text-center py-8 text-medium-emphasis">
              No se encontraron resultados para "{{ searchQuery }}"
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="bg-grey-lighten-4 py-2 px-4 text-caption text-medium-emphasis">
          <span class="mr-4"><kbd class="bg-white px-1 border rounded">Enter</kbd> seleccionar</span>
          <span><kbd class="bg-white px-1 border rounded">Esc</kbd> cerrar</span>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { useDisplay } from 'vuetify';
  import { useAuth } from '@/hooks/useAuth';

  const { mobile } = useDisplay();
  const route = useRoute();
  const { user, logout, isSuperAdmin } = useAuth(); // Using global auth state

  const drawer = ref(true);
  const rail = ref(false);
  const showSearch = ref(false);
  const searchQuery = ref('');

  // --- User Info Helpers ---
  const userName = computed(() => user.value?.nombre_usuario || 'Usuario');
  const userRole = computed(() => user.value?.rol_usuario || 'Vendedor'); // O User Type
  const userAvatarInitials = computed(() => (userName.value || 'U').slice(0, 2).toUpperCase());

  const currentPageTitle = computed(() => route.meta.title || route.name || 'Dashboard');

  // --- Navigation Data Structure ---
  // Defines all system modules with tags for the search engine
  const menuItems = [
    // Header: Principal
    { header: 'Principal' },
    {
      title: 'Dashboard',
      icon: 'mdi-view-dashboard-outline',
      to: '/main/dashboard',
      value: 'dashboard',
      tags: ['inicio', 'metricas', 'resumen', 'ventas', 'estadisticas'],
      description: 'Vista general del rendimiento',
      category: 'General'
    },
  
    // Header: Gestión
    { header: 'Gestión' },
    {
      title: 'Usuarios',
      icon: 'mdi-account-group-outline',
      to: '/main/usuarios',
      value: 'usuarios',
      tags: ['personal', 'vendedores', 'administradores', 'accesos', 'roles'],
      description: 'Administración de cuentas de usuario',
      category: 'Administración'
    },
    {
      title: 'Clientes',
      icon: 'mdi-account-tie-outline',
      to: '/main/clientes',
      value: 'clientes',
      tags: ['compradores', 'historial', 'crm', 'contactos'],
      description: 'Base de datos de clientes y su consumo',
      category: 'Ventas'
    },
    {
      title: 'Proveedores',
      icon: 'mdi-truck-delivery-outline',
      to: '/main/proveedores',
      value: 'proveedores',
      tags: ['abastecimiento', 'compras', 'distribuidores', 'suministros'],
      description: 'Gestión de proveedores y contactos',
      category: 'Compras'
    },
    {
      title: 'Empresas',
      icon: 'mdi-domain',
      to: '/main/empresas',
      value: 'empresas',
      tags: ['configuracion', 'perfil', 'logo', 'datos fiscales'],
      description: 'Gestión del perfil de empresa',
      category: 'Administración'
    },

    // Header: Inventario
    { header: 'Inventario' },
    {
      title: 'Almacenes',
      icon: 'mdi-warehouse',
      to: '/main/almacenes',
      value: 'almacenes',
      tags: ['bodegas', 'sucursales', 'stock', 'ubicaciones'],
      description: 'Gestión de almacenes y sucursales',
      category: 'Inventario'
    },
    {
      title: 'Movimientos',
      icon: 'mdi-transfer',
      to: '/main/movimientos',
      value: 'movimientos',
      tags: ['ajustes', 'transferencias', 'kardex', 'entradas', 'salidas'],
      description: 'Registro de movimientos de inventario',
      category: 'Inventario'
    },
    {
      title: 'Categorización',
      icon: 'mdi-shape-outline',
      to: '/main/categorizacion',
      value: 'categorizacion',
      tags: ['categorias', 'subcategorias', 'filtros', 'tallas', 'marcas', 'jerarquia'],
      description: 'Configuración de taxonomía de productos',
      category: 'Inventario'
    },
    {
      title: 'Productos',
      icon: 'mdi-package-variant-closed',
      to: '/main/productos',
      value: 'productos',
      tags: ['articulos', 'stock', 'precios', 'catalogo', 'inventario', 'items'],
      description: 'Gestión central del catálogo y existencias',
      category: 'Inventario'
    },

    // Header: Operaciones
    { header: 'Operaciones' },
    {
      title: 'Compras',
      icon: 'mdi-cart-arrow-down',
      to: '/main/compras',
      value: 'compras',
      tags: ['ingresos', 'ordenes', 'pedidos proveedor', 'abastecimiento', 'entradas'],
      description: 'Registro de ingresos de mercadería',
      category: 'Compras'
    },
    {
      title: 'Pedidos',
      icon: 'mdi-cart-outline',
      to: '/main/pedidos',
      value: 'pedidos',
      tags: ['ventas', 'ordenes', 'despachos', 'facturacion', 'salidas'],
      description: 'Gestión y seguimiento de ventas',
      category: 'Ventas'
    },
  
    // Header: Analítica
    { header: 'Analítica' },
    {
      title: 'Reportes',
      icon: 'mdi-file-document-multiple-outline',
      to: '/main/reportes',
      value: 'reportes',
      tags: ['pdf', 'excel', 'exportar', 'listados', 'imprimir'],
      description: 'Generación de documentos administrativos',
      category: 'Reportes'
    },
    {
      title: 'Gráficas',
      icon: 'mdi-chart-bar',
      to: '/main/graficas',
      value: 'graficas',
      tags: ['rendimiento', 'charts', 'visualizacion', 'top productos', 'tendencias'],
      description: 'Análisis visual de datos',
      category: 'Reportes'
    },

    // Header: Sistema
    { header: 'Sistema' },
    {
      title: 'Papelera',
      icon: 'mdi-delete-clock-outline',
      to: '/main/papelera',
      value: 'papelera',
      tags: ['borrados', 'restaurar', 'recuperar', 'eliminados', 'historial'],
      description: 'Recuperación y eliminación definitiva de registros',
      category: 'Sistema'
    },
  ];

  // --- Search Logic ---
  const filteredMenu = computed(() => {
    // Simple filtering if needed later, currently showing all by structure
    return menuItems;
  });

  const searchResults = computed(() => {
    if (!searchQuery.value) return [];
    const query = searchQuery.value.toLowerCase();
  
    // Filter items that satisfy search by title or tags
    return menuItems.filter(item => {
      if (item.header) return false;
      const matchesTitle = item.title.toLowerCase().includes(query);
      const matchesTags = item.tags.some(tag => tag.toLowerCase().includes(query));
      return matchesTitle || matchesTags;
    });
  });

  function handleKeyboardShortcut (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      showSearch.value = !showSearch.value;
    }
  }

  function handleLogout () {
    logout();
    // location.reload(); // Removed to allow router push in store to work
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyboardShortcut);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyboardShortcut);
  });
</script>

<style scoped>
.hover\:opacity-100:hover {
  opacity: 1;
}
</style>
