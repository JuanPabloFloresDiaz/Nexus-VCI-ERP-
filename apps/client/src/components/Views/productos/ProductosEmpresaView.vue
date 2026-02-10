<script setup>
import { ref, computed, watch } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { getProductos } from '@/services/productos.service';
import AsyncAvatar from '@/components/common/AsyncAvatar.vue';
import FichaProductoModal from '@/components/modals/productos/FichaProductoModal.vue';
import { useDebounce } from '@vueuse/core';

// State
const search = ref('');
const debouncedSearch = useDebounce(search, 300);
const page = ref(1);
const limit = ref(10);

// Query
const queryParams = computed(() => ({
    page: page.value,
    limit: limit.value,
    search: debouncedSearch.value
}));

const { data, isLoading, refetch } = useQuery({
    queryKey: ['productos', queryParams],
    queryFn: () => getProductos(queryParams.value),
    keepPreviousData: true
});

const productos = computed(() => data.value?.data || []);
const totalItems = computed(() => data.value?.count || 0);

// Headers
const headers = [
    { title: 'Producto', key: 'nombre_producto', align: 'start' },
    { title: 'Subcategoría', key: 'subcategoria.nombre_subcategoria', align: 'start' },
    { title: 'Precio', key: 'precio_unitario', align: 'end' },
    { title: 'Stock', key: 'stock_actual', align: 'center' },
    { title: 'Acciones', key: 'actions', align: 'end', sortable: false }
];

const selectedItem = ref(null);
const showFichaModal = ref(false);

const handleView = (item) => {
    selectedItem.value = item;
    showFichaModal.value = true;
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

// Reset page on search
watch(debouncedSearch, () => {
    page.value = 1;
});
</script>

<template>
    <div class="h-100 d-flex flex-column">
        <!-- Header -->
        <div class="d-flex align-center pa-4 gap-4 bg-white border-b">
            <div>
                <h1 class="text-h5 font-weight-bold">Catálogo de Productos</h1>
                <div class="text-subtitle-2 text-medium-emphasis">
                    Visualiza los productos disponibles en tu empresa
                </div>
            </div>
        </div>

        <!-- Toolbar -->
        <div class="d-flex align-center pa-4 gap-4 bg-grey-lighten-5 border-b">
            <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                placeholder="Buscar producto..."
                density="compact"
                variant="outlined"
                hide-details
                style="max-width: 300px"
                bg-color="white"
            ></v-text-field>
            <v-spacer></v-spacer>
            <v-btn icon variant="text" @click="refetch" :loading="isLoading">
                <v-icon>mdi-refresh</v-icon>
            </v-btn>
        </div>

        <!-- Table -->
        <v-data-table-server
            v-model:page="page"
            :items-per-page="limit"
            :headers="headers"
            :items="productos"
            :items-length="totalItems"
            :loading="isLoading"
            class="flex-grow-1"
            density="comfortable"
            hover
        >
            <template v-slot:item.nombre_producto="{ item }">
                <div class="d-flex align-center gap-2">
                    <AsyncAvatar
                        :name="item.nombre_producto"
                        :src="item.imagen_url"
                        size="40"
                        rounded="lg"
                    />
                    <div>
                        <div class="font-weight-medium">{{ item.nombre_producto }}</div>
                        <div class="text-caption text-medium-emphasis text-truncate" style="max-width: 200px;">
                            {{ item.descripcion_producto }}
                        </div>
                    </div>
                </div>
            </template>

            <template v-slot:item.precio_unitario="{ item }">
                <div class="font-weight-medium">{{ formatCurrency(item.precio_unitario) }}</div>
            </template>

            <template v-slot:item.stock_actual="{ item }">
                <v-chip
                    :color="item.stock_actual <= item.stock_minimo ? 'error' : 'success'"
                    size="small"
                    variant="tonal"
                >
                    {{ item.stock_actual }}
                </v-chip>
            </template>

            <template v-slot:item.actions="{ item }">
                <v-btn
                    icon
                    size="small"
                    variant="text"
                    color="primary"
                    @click="handleView(item)"
                >
                    <v-icon>mdi-eye</v-icon>
                    <v-tooltip activator="parent" location="top">Ver Ficha</v-tooltip>
                </v-btn>
            </template>

            <template v-slot:no-data>
                <div class="d-flex flex-column align-center justify-center py-8 text-medium-emphasis">
                    <v-icon size="48" icon="mdi-package-variant-closed" class="mb-2 opacity-50"></v-icon>
                    <span>No se encontraron productos</span>
                </div>
            </template>
        </v-data-table-server>
        
        <FichaProductoModal
            v-model="showFichaModal"
            :producto="selectedItem"
        />
    </div>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
