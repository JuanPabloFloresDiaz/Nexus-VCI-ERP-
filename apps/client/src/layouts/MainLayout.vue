<template>
  <v-app>
    <!-- Navigation Drawer (Sidebar) -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      color="primary"
      class="border-none"
      width="280"
      @click="rail = false"
    >
      <v-list class="pa-4">
        <v-list-item
          prepend-icon="mdi-cube-outline"
          title="Nexus VCI"
          subtitle="Enterprise Resource Planning"
          class="text-white"
        >
          <template v-slot:append>
            <v-btn
              variant="text"
              icon="mdi-chevron-left"
              size="small"
              @click.stop="rail = !rail"
            ></v-btn>
          </template>
        </v-list-item>
      </v-list>

      <v-divider class="mb-2 border-opacity-25"></v-divider>

      <!-- Global Search Trigger (Visible in Sidebar if expanded) -->
      <div v-if="!rail" class="px-3 mb-4">
        <v-btn
          block
          variant="tonal"
          color="white"
          class="text-none justify-start text-caption"
          prepend-icon="mdi-magnify"
          @click="showSearch = true"
        >
          Buscar (Ctrl + K)
        </v-btn>
      </div>

      <v-list density="compact" nav class="pa-2">
        <template v-for="(item, i) in filteredMenu" :key="i">
          <v-list-subheader 
            v-if="item.header && !rail" 
            class="text-uppercase text-caption font-weight-bold opacity-70 mt-4 mb-2 ml-2 text-white"
          >
            {{ item.header }}
          </v-list-subheader>
          
          <v-list-item
            v-else-if="!item.header"
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            :value="item.value"
            active-class="bg-secondary text-white rounded-lg elevation-2"
            class="mb-1 rounded-lg text-white opacity-90 hover:opacity-100"
            link
          ></v-list-item>
        </template>
      </v-list>
      
      <template v-slot:append>
        <div class="pa-4" v-if="!rail">
          <v-card color="secondary" class="rounded-lg pa-4" elevation="0">
             <div class="d-flex align-center">
                <v-avatar color="white" size="32" class="text-primary font-weight-bold mr-3">
                   {{ userAvatarInitials }}
                </v-avatar>
                <div class="text-truncate">
                   <div class="text-subtitle-2 font-weight-bold">{{ userName }}</div>
                   <div class="text-caption opacity-80 text-truncate">{{ userRole }}</div>
                </div>
                <v-spacer></v-spacer>
                <v-btn icon="mdi-logout" variant="text" density="compact" @click="handleLogout"></v-btn>
             </div>
          </v-card>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App Bar (Header) - Optional mostly for mobile triggers or extra actions, keeping minimal as per request -->
    <v-app-bar flat class="border-b" color="background">
       <v-app-bar-nav-icon color="grey-darken-1" @click="rail = !rail" v-if="mobile"></v-app-bar-nav-icon>
       <h1 class="text-h6 font-weight-bold text-primary ml-4">{{ currentPageTitle }}</h1>
       <v-spacer></v-spacer>
       <!-- Right side info / notifications if needed -->
    </v-app-bar>

    <!-- Main Content Area -->
    <v-main class="bg-background">
      <v-container fluid class="pa-6 fill-height align-start">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
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
            placeholder="Buscar módulo, acción o reporte..."
            prepend-inner-icon="mdi-magnify"
            variant="solo"
            hide-details
            single-line
            autofocus
            class="text-h6"
          ></v-text-field>
        </v-card-title>
        <v-card-text class="pa-0" v-if="searchQuery">
          <v-list lines="two">
             <v-list-item
                v-for="(result, i) in searchResults"
                :key="i"
                :to="result.to"
                :title="result.title"
                :subtitle="result.description"
                :prepend-icon="result.icon"
                @click="showSearch = false"
             >
                <template v-slot:append>
                   <v-chip size="x-small" label class="text-uppercase">{{ result.category }}</v-chip>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
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
const userAvatarInitials = computed(() => (userName.value || 'U').substring(0, 2).toUpperCase());

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

const handleKeyboardShortcut = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    showSearch.value = !showSearch.value;
  }
};

const handleLogout = () => {
    logout();
    location.reload(); // Hard reload to clear all states properly
};

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
