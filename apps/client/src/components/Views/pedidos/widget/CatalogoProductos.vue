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

  // Expanded Card State
  const expandedProductId = ref(null);

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

  // Computed list
  const productos = computed(() => {
    return productosData.value?.data || [];
  });

  function formatCurrency (amount) {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Helper to get Product Display Info
  function getProductDisplayInfo(producto) {
      const variants = producto.variantes || [];
      if (variants.length === 0) {
          return {
              priceDisplay: formatCurrency(producto.precio_unitario),
              stockTotal: producto.stock_actual || 0,
              hasStock: (producto.stock_actual || 0) > 0
          };
      }

      const totalStock = variants.reduce((acc, v) => acc + (v.stock_actual || 0), 0);
      const prices = variants.map(v => Number(v.precio_unitario));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      let priceDisplay = formatCurrency(minPrice);
      if (minPrice !== maxPrice) {
          priceDisplay = `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
      }

      return {
          priceDisplay,
          stockTotal: totalStock,
          hasStock: totalStock > 0
      };
  }

  function handleCardClick(producto) {
      // Toggle expansion if currently expanded
      if (expandedProductId.value === producto.id) {
          expandedProductId.value = null;
          return;
      }

      if (producto.variantes && producto.variantes.length > 1) {
          expandedProductId.value = producto.id;
      } else if (producto.variantes && producto.variantes.length === 1) {
          const variant = producto.variantes[0];
          if (variant.stock_actual > 0) {
               emit('add-to-cart', { producto, variant });
          }
      } else {
           // Fallback for no variants (shouldn't happen with strict data)
      }
  }

  function addVariantToCart(producto, variant) {
      if (variant.stock_actual > 0) {
          emit('add-to-cart', { producto, variant });
      }
  }

  function getVariantAttributes(variant) {
      if (!variant.detalles_filtros) return '';
      return variant.detalles_filtros
          .map(d => `${d.opcion_filtro?.filtro?.nombre_filtro}: ${d.opcion_filtro?.valor_opcion}`)
          .join(', ');
  }
</script>

<template>
  <div class="h-100 d-flex flex-column bg-white">
    <!-- Filters Header -->
    <div class="pa-3 border-b">
      <v-row dense>
        <v-col cols="12" md="4">
            <v-text-field v-model="search" bg-color="grey-lighten-5" clearable density="compact" hide-details label="Buscar producto..." prepend-inner-icon="mdi-magnify" variant="outlined" />
        </v-col>
        <v-col cols="12" md="4">
            <v-select v-model="selectedCategory" clearable density="compact" bg-color="grey-lighten-5" hide-details item-title="nombre_categoria" item-value="id" :items="categorias" label="Categoría" variant="outlined" />
        </v-col>
        <v-col class="d-flex align-center gap-2" cols="12" md="4">
            <v-text-field v-model.number="priceMin" class="mr-2" bg-color="grey-lighten-5" density="compact" hide-details label="Min" prefix="$" type="number" variant="outlined" />
            <v-text-field v-model.number="priceMax" bg-color="grey-lighten-5" density="compact" hide-details label="Max" prefix="$" type="number" variant="outlined" />
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
            class="h-100 d-flex flex-column product-card overflow-hidden"
            :disabled="!getProductDisplayInfo(producto).hasStock && expandedProductId !== producto.id"
            elevation="0"
            flat
          >
            <!-- EXPANDED VIEW (Variants List) -->
            <v-expand-transition>
                <div v-if="expandedProductId === producto.id" class="fill-height d-flex flex-column bg-white" style="position: absolute; z-index: 2; width: 100%; height: 100%;">
                    <div class="d-flex align-center justify-space-between pa-2 border-b bg-grey-lighten-4">
                        <div class="text-subtitle-2 font-weight-bold text-truncate">{{ producto.nombre_producto }}</div>
                        <v-btn icon="mdi-close" size="x-small" variant="text" @click.stop="expandedProductId = null" />
                    </div>
                    
                    <div class="flex-grow-1 overflow-y-auto pa-0">
                        <v-list density="compact" lines="two">
                            <v-list-item v-for="variant in producto.variantes" :key="variant.id" class="border-b">

                                
                                <v-list-item-title class="font-weight-bold text-caption">
                                    {{ variant.sku }}
                                </v-list-item-title>
                                <v-list-item-subtitle class="text-caption">
                                    {{ getVariantAttributes(variant) }}
                                </v-list-item-subtitle>
                                
                                <template #append>
                                    <div class="d-flex flex-column align-end">
                                        <div class="text-subtitle-2 font-weight-bold">{{ formatCurrency(variant.precio_unitario) }}</div>
                                        <div class="d-flex align-center gap-2">
                                            <span class="text-caption" :class="variant.stock_actual > 0 ? 'text-success' : 'text-error'">
                                                {{ variant.stock_actual }}
                                            </span>
                                            <v-btn 
                                                icon="mdi-plus" 
                                                size="x-small" 
                                                color="primary" 
                                                variant="tonal" 
                                                :disabled="variant.stock_actual <= 0"
                                                @click.stop="addVariantToCart(producto, variant)"
                                            />
                                        </div>
                                    </div>
                                </template>
                            </v-list-item>
                        </v-list>
                    </div>
                </div>
            </v-expand-transition>

            <!-- DEFAULT VIEW (Product Card) -->
            <div class="d-flex flex-column h-100" @click="handleCardClick(producto)">
                <div class="position-relative">
                    <div class="bg-grey-lighten-4" style="height: 140px;">
                        <AsyncImage
                            :alt="producto.nombre_producto"
                            cover
                            height="140"
                            :src="producto.imagen_url"
                        />
                    </div>
                    <!-- Badges -->
                    <v-chip v-if="getProductDisplayInfo(producto).stockTotal <= 5 && getProductDisplayInfo(producto).hasStock" class="position-absolute top-0 right-0 ma-2" color="warning" size="x-small" variant="flat">
                        Bajo Stock
                    </v-chip>
                    <div v-if="!getProductDisplayInfo(producto).hasStock" class="position-absolute fill-height w-100 d-flex align-center justify-center bg-grey-darken-3 top-0" style="opacity: 0.7">
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
                    </div>
                                    
                    <div class="d-flex align-end justify-space-between mt-2 pt-2 border-t">
                        <div>
                            <div class="text-subtitle-1 font-weight-bold">{{ getProductDisplayInfo(producto).priceDisplay }}</div>
                            <div class="text-caption" :class="getProductDisplayInfo(producto).stockTotal > 10 ? 'text-success' : 'text-warning'">
                                Stock: {{ getProductDisplayInfo(producto).stockTotal }}
                            </div>
                        </div>
                        <v-btn
                            color="primary"
                            :disabled="!getProductDisplayInfo(producto).hasStock"
                            :icon="producto.variantes?.length > 1 ? 'mdi-dots-horizontal' : 'mdi-plus'"
                            size="small"
                            variant="tonal"
                        />
                    </div>
                </v-card-text>
            </div>
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
