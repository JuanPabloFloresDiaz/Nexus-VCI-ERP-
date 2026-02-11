<script setup>
import { ref, watch, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { getProductos } from '@/services/productos.service';
import { getCategorias } from '@/services/categorizacion.service';
import _ from 'lodash';

import AsyncImage from '@/components/common/AsyncImage.vue';

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

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

const addToCart = (producto) => {
    if (producto.stock_actual <= 0) return;
    emit('add-to-cart', producto);
};
</script>

<template>
    <div class="h-100 d-flex flex-column bg-white">
        <!-- Filters Header -->
        <div class="pa-3 border-b">
            <v-row dense>
                <v-col cols="12" md="4">
                    <v-text-field
                        v-model="search"
                        prepend-inner-icon="mdi-magnify"
                        label="Buscar producto..."
                        variant="outlined"
                        density="compact"
                        hide-details
                        clearable
                        bg-color="grey-lighten-5"
                    ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                    <v-select
                        v-model="selectedCategory"
                        :items="categorias"
                        item-title="nombre_categoria"
                        item-value="id"
                        label="Categoría"
                        variant="outlined"
                        density="compact"
                        hide-details
                        clearable
                        bg-color="grey-lighten-5"
                    ></v-select>
                </v-col>
                <v-col cols="12" md="4" class="d-flex align-center gap-2">
                     <v-text-field
                        v-model.number="priceMin"
                        label="Min"
                        type="number"
                        prefix="$"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="mr-2"
                        bg-color="grey-lighten-5"
                    ></v-text-field>
                    <v-text-field
                        v-model.number="priceMax"
                        label="Max"
                        type="number"
                        prefix="$"
                        variant="outlined"
                        density="compact"
                        hide-details
                        bg-color="grey-lighten-5"
                    ></v-text-field>
                </v-col>
            </v-row>
        </div>

        <!-- Product Grid -->
        <div class="flex-grow-1 overflow-y-auto pa-3 bg-grey-lighten-5">
             <div v-if="isLoading" class="d-flex justify-center align-center h-100">
                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            </div>
            
            <div v-else-if="productos.length === 0" class="d-flex flex-column align-center justify-center h-100 text-medium-emphasis">
                <v-icon size="64" class="mb-2">mdi-package-variant-closed</v-icon>
                <div class="text-h6">No hay productos</div>
                <div class="text-caption">Intenta ajustar los filtros</div>
            </div>

            <v-row v-else dense>
                <v-col
                    v-for="producto in productos"
                    :key="producto.id"
                    cols="12"
                    sm="6"
                    md="4"
                    lg="3"
                    xl="2"
                >
                    <v-card 
                        class="h-100 d-flex flex-column product-card" 
                        elevation="0"
                        border
                        @click="addToCart(producto)"
                        :ripple="producto.stock_actual > 0"
                        :disabled="producto.stock_actual <= 0"
                    >
                        <div class="position-relative">
                            <div class="h-100 bg-grey-lighten-4" style="height: 140px;">
                                <AsyncImage
                                    :src="producto.imagen_url"
                                    :alt="producto.nombre_producto"
                                    height="140"
                                    cover
                                />
                            </div>
                             <v-chip
                                v-if="producto.stock_actual <= 5 && producto.stock_actual > 0"
                                color="warning"
                                size="x-small"
                                class="position-absolute top-0 right-0 ma-2"
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
                                        size="x-small"
                                        variant="outlined"
                                        class="mr-1 mb-1"
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
                                    icon="mdi-plus"
                                    color="primary"
                                    size="small"
                                    variant="tonal"
                                    :disabled="producto.stock_actual <= 0"
                                    @click.stop="addToCart(producto)"
                                ></v-btn>
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
