<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import _ from 'lodash';
  import { computed, ref, watch } from 'vue';
  import AsyncImage from '@/components/common/AsyncImage.vue';
  import { getCategorias } from '@/services/categorizacion.service';

  import { getProductos } from '@/services/productos.service';

  const props = defineProps({
    modelValue: {
      type: Array, // Items in cart
      default: () => []
    }
  });

  const emit = defineEmits(['add-to-cart']);

  // Filters
  const search = ref('');
  const selectedCategory = ref(null);
  const priceMin = ref(null);
  const priceMax = ref(null);

  // Modal state
  const showVariantSelector = ref(false);
  const selectedProductForVariant = ref(null);

  // Debounced Search using Lodash
  const debouncedSearch = ref('');
  const updateSearch = _.debounce((val) => {
    debouncedSearch.value = val;
  }, 300);

  watch(search, (val) => updateSearch(val));

  // Fetch Categories
  const { data: categoriasData } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => getCategorias({ limit: 100 })
  });

  const categorias = computed(() => categoriasData.value?.data || []);

  // Fetch Products
  const { data: productosData, isLoading } = useQuery({
    queryKey: ['productos', debouncedSearch, selectedCategory, priceMin, priceMax], 
    queryFn: () => getProductos({
      search: debouncedSearch.value,
      id_categoria: selectedCategory.value,
      min_price: priceMin.value,
      max_price: priceMax.value,
      limit: 100
    })
  });

  // Computed list (Now direct from backend)
  const productos = computed(() => {
    return productosData.value?.data || [];
  });

  function formatCurrency (amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function addToCart (producto) {
    if (producto.stock_actual <= 0) return;
    emit('add-to-cart', producto);
  }
</script>

<template>
  <div class="h-100 d-flex flex-column bg-white">
    <!-- Filters Header -->
    <div class="pa-3 border-b">
      <v-row dense>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="search"
            bg-color="grey-lighten-5"
            clearable
            density="compact"
            hide-details
            label="Buscar producto..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="selectedCategory"
            clearable
            density="compact"
            bg-color="grey-lighten-5"
            hide-details
            item-title="nombre_categoria"
            item-value="id"
            :items="categorias"
            label="Categoría"
            variant="outlined"
          />
        </v-col>
        <v-col class="d-flex align-center gap-2" cols="12" md="4">
          <v-text-field
            v-model.number="priceMin"
            class="mr-2"
            bg-color="grey-lighten-5"
            density="compact"
            hide-details
            label="Min"
            prefix="$"
            type="number"
            variant="outlined"
          />
          <v-text-field
            v-model.number="priceMax"
            bg-color="grey-lighten-5"
            density="compact"
            hide-details
            label="Max"
            prefix="$"
            type="number"
            variant="outlined"
          />
        </v-col>
      </v-row>
    </div>

    <!-- Product Grid -->
    <div class="flex-grow-1 overflow-y-auto pa-3 bg-grey-lighten-5">
      <div v-if="isLoading" class="d-flex justify-center align-center h-100">
        <v-progress-circular color="primary" indeterminate size="64" />
      </div>
            
      <div v-else-if="productos.length === 0" class="d-flex flex-column align-center justify-center h-100 text-medium-emphasis">
        <v-icon class="mb-2" size="64">mdi-package-variant-closed</v-icon>
        <div class="text-h6">No hay productos</div>
        <div class="text-caption">Intenta ajustar los filtros</div>
      </div>

      <v-row v-else dense>
        <v-col
          v-for="producto in productos"
          :key="producto.id"
          cols="12"
          lg="3"
          md="4"
          sm="6"
          xl="2"
        >
          <v-card 
            border 
            class="h-100 d-flex flex-column product-card"
            :disabled="producto.stock_actual <= 0"
            elevation="0"
            :ripple="producto.stock_actual > 0"
            @click="addToCart(producto)"
          >
            <div class="position-relative">
              <div class="h-100 bg-grey-lighten-4" style="height: 140px;">
                <AsyncImage
                  :alt="producto.nombre_producto"
                  cover
                  height="140"
                  :src="producto.imagen_url"
                />
              </div>
              <v-chip
                v-if="producto.stock_actual <= 5 && producto.stock_actual > 0"
                class="position-absolute top-0 right-0 ma-2"
                color="warning"
                size="x-small"
                variant="flat"
              >
                Bajo Stock
              </v-chip>
              <div 
                v-if="producto.stock_actual <= 0" 
                class="position-absolute fill-height w-100 d-flex align-center justify-center bg-grey-darken-3 top-0"
                style="opacity: 0.7"
              >
                <strong class="text-white text-uppercase">Agotado</strong>
              </div>
            </div>

            <v-card-text class="pa-3 flex-grow-1 d-flex flex-column justify-space-between">
              <div>
                <div class="text-subtitle-2 font-weight-bold text-truncate mb-1" :title="producto.nombre_producto">
                  {{ producto.nombre_producto }}
                </div>
                <div class="text-caption text-medium-emphasis text-truncate mb-2">
                  {{ producto.subcategoria?.nombre_subcategoria || 'General' }}
                </div>
                <div v-if="producto.detalles_filtros && producto.detalles_filtros.length > 0" class="mb-2">
                  <v-chip
                    v-for="df in producto.detalles_filtros"
                    :key="df.id"
                    class="mr-1 mb-1"
                    size="x-small"
                    variant="outlined"
                  >
                    {{ df.opcion_filtro?.filtro?.nombre_filtro }}: {{ df.opcion_filtro?.nombre_opcion }}
                  </v-chip>
                </div>
              </div>
                            
              <div class="d-flex align-end justify-space-between mt-2 pt-2 border-t">
                <div>
                  <div class="text-h6 font-weight-bold">{{ formatCurrency(producto.precio_unitario) }}</div>
                  <div class="text-caption" :class="producto.stock_actual > 10 ? 'text-success' : 'text-warning'">
                    Stock: {{ producto.stock_actual }}
                  </div>
                </div>
                <v-btn
                  color="primary"
                  :disabled="producto.stock_actual <= 0"
                  icon="mdi-plus"
                  size="small"
                  variant="tonal"
                  @click.stop="addToCart(producto)"
                />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<style scoped>
.product-card {
    transition: all 0.2s ease;
    cursor: pointer;
}
.product-card:hover:not(.v-card--disabled) {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
    border-color: rgb(var(--v-theme-primary)) !important;
}
</style>
