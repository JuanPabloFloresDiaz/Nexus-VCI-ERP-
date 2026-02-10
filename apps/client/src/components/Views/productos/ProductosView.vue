<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import { getProductos } from '@/services/productos.service'; // Need to implement this service
import AsyncAvatar from '@/components/common/AsyncAvatar.vue';
import DeleteProductoModal from '@/components/modals/productos/DeleteProductoModal.vue';
import FichaProductoModal from '@/components/modals/productos/FichaProductoModal.vue';
import { useDebounce } from '@vueuse/core';

const router = useRouter();

// State
const search = ref('');
const debouncedSearch = useDebounce(search, 300);
const page = ref(1);
const limit = ref(10);
const deleteModalOpen = ref(false);
const selectedItem = ref(null);

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

// Actions
const handleCreate = () => {
    router.push('/main/productos/crear');
};

const handleEdit = (item) => {
    router.push(`/main/productos/editar/${item.id}`);
};

const fichaModalOpen = ref(false);

const handleView = (item) => {
    selectedItem.value = item;
    fichaModalOpen.value = true;
};

const handleDelete = (item) => {
    selectedItem.value = item;
    deleteModalOpen.value = true;
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
                <h1 class="text-h5 font-weight-bold">Gestión de Productos</h1>
                <div class="text-subtitle-2 text-medium-emphasis">
                    Administra el catálogo de productos de tu empresa
                </div>
            </div>
            <v-spacer></v-spacer>
            <v-btn
                prepend-icon="mdi-file-excel"
                variant="outlined"
                color="success"
                class="mr-2"
                to="/main/productos/crear_masivo"
            >
                Carga Masiva
            </v-btn>
            <v-btn
                prepend-icon="mdi-plus"
                color="primary"
                @click="handleCreate"
            >
                Nuevo Producto
            </v-btn>
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
                <div class="d-flex justify-end gap-1">
                    <v-btn icon size="small" variant="text" color="info" @click="handleView(item)">
                        <v-icon>mdi-eye</v-icon>
                        <v-tooltip activator="parent" location="top">Ver Detalles</v-tooltip>
                    </v-btn>
                    <v-btn icon size="small" variant="text" color="primary" @click="handleEdit(item)">
                        <v-icon>mdi-pencil</v-icon>
                        <v-tooltip activator="parent" location="top">Editar</v-tooltip>
                    </v-btn>
                    <v-btn icon size="small" variant="text" color="error" @click="handleDelete(item)">
                        <v-icon>mdi-delete</v-icon>
                        <v-tooltip activator="parent" location="top">Eliminar</v-tooltip>
                    </v-btn>
                </div>
            </template>

            <template v-slot:no-data>
                <div class="d-flex flex-column align-center justify-center py-8 text-medium-emphasis">
                    <v-icon size="48" icon="mdi-package-variant-closed" class="mb-2 opacity-50"></v-icon>
                    <span>No se encontraron productos</span>
                </div>
            </template>
        </v-data-table-server>

        <!-- Delete Modal -->
        <DeleteProductoModal
            v-model="deleteModalOpen"
            :producto="selectedItem"
            @success="refetch"
        />

        <FichaProductoModal
            v-model="fichaModalOpen"
            :producto="selectedItem"
        />
    </div>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
.gap-1 { gap: 4px; }
</style>
