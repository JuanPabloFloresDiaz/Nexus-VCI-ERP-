<script setup>
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { getCategorias } from '@/services/categorizacion.service';
import AsyncAvatar from '@/components/common/AsyncAvatar.vue';

const search = ref('');
const page = ref(1);
const limit = ref(10);
const expanded = ref([]);

const queryParams = computed(() => ({
    page: page.value,
    limit: limit.value,
    search: search.value
}));

const { data, isLoading, refetch } = useQuery({
    queryKey: ['categorias', queryParams],
    queryFn: () => getCategorias(queryParams.value),
    keepPreviousData: true
});

const categorias = computed(() => data.value?.data || []);
const totalItems = computed(() => data.value?.count || 0);

const headers = [
    { title: '', key: 'data-table-expand' },
    { title: 'Categoría', key: 'nombre_categoria', align: 'start' },
    { title: 'Subcategorías', key: 'subcategorias_count', align: 'center' },
    { title: 'Descripción', key: 'descripcion_categoria', align: 'start' },
];
</script>

<template>
    <div class="h-100 d-flex flex-column">
        <!-- Header -->
        <div class="d-flex align-center pa-4 gap-4 bg-white border-b">
            <div>
                <h1 class="text-h5 font-weight-bold">Directorio de Categorías</h1>
                <div class="text-subtitle-2 text-medium-emphasis">
                    Explora las categorías y filtros disponibles
                </div>
            </div>
        </div>

        <!-- Toolbar -->
        <div class="d-flex align-center pa-4 gap-4 bg-grey-lighten-5 border-b">
            <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                placeholder="Buscar categoría..."
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
            v-model:expanded="expanded"
            v-model:page="page"
            :items-per-page="limit"
            :headers="headers"
            :items="categorias"
            :items-length="totalItems"
            :loading="isLoading"
            class="flex-grow-1"
            density="comfortable"
            hover
            show-expand
            item-value="id"
        >
            <template v-slot:item.nombre_categoria="{ item }">
                <div class="font-weight-medium">{{ item.nombre_categoria }}</div>
            </template>

            <template v-slot:item.subcategorias_count="{ item }">
                <v-chip size="small" variant="tonal" color="primary">
                    {{ item.subcategorias?.length || 0 }}
                </v-chip>
            </template>

            <!-- Expanded Row for Subcategories -->
            <template v-slot:expanded-row="{ columns, item }">
                <tr>
                    <td :colspan="columns.length" class="pa-4 bg-grey-lighten-5">
                        <div class="text-subtitle-2 mb-2 text-medium-emphasis">
                            Subcategorías y Filtros
                        </div>
                        <v-card variant="outlined" class="bg-white">
                            <v-list density="compact">
                                <template v-if="item.subcategorias && item.subcategorias.length > 0">
                                    <v-list-group 
                                        v-for="sub in item.subcategorias" 
                                        :key="sub.id"
                                        :value="sub.id"
                                    >
                                        <template v-slot:activator="{ props }">
                                            <v-list-item
                                                v-bind="props"
                                                :title="sub.nombre_subcategoria"
                                                prepend-icon="mdi-subdirectory-arrow-right"
                                            >
                                                 <template v-slot:append>
                                                    <v-chip size="x-small" variant="text" color="medium-emphasis">
                                                        {{ sub.filtros?.length || 0 }} Filtros
                                                    </v-chip>
                                                </template>
                                            </v-list-item>
                                        </template>

                                        <v-list-item v-if="sub.filtros && sub.filtros.length > 0">
                                            <div class="px-4 py-2">
                                                <v-row dense>
                                                    <v-col v-for="filtro in sub.filtros" :key="filtro.id" cols="12" md="6">
                                                        <v-card variant="flat" class="bg-grey-lighten-4 mb-2">
                                                            <v-card-text class="py-2">
                                                                <div class="d-flex align-center justify-space-between mb-1">
                                                                    <div class="font-weight-medium text-body-2">{{ filtro.nombre_filtro }}</div>
                                                                    <v-chip size="x-small" label class="text-caption">{{ filtro.tipo_dato }}</v-chip>
                                                                </div>
                                                                
                                                                <!-- Options if Lista -->
                                                                <div v-if="filtro.tipo_dato === 'Lista' && filtro.opciones?.length > 0" class="d-flex flex-wrap gap-1 mt-2">
                                                                    <v-chip 
                                                                        v-for="opcion in filtro.opciones" 
                                                                        :key="opcion.id"
                                                                        size="x-small"
                                                                        variant="outlined"
                                                                    >
                                                                        {{ opcion.valor_opcion }}
                                                                    </v-chip>
                                                                </div>
                                                                <div v-else-if="filtro.tipo_dato === 'Lista'" class="text-caption text-disabled font-italic">
                                                                    Sin opciones definidas
                                                                </div>
                                                            </v-card-text>
                                                        </v-card>
                                                    </v-col>
                                                </v-row>
                                            </div>
                                        </v-list-item>
                                        <v-list-item v-else>
                                            <div class="px-6 py-2 text-caption text-medium-emphasis font-italic">
                                                No hay filtros configurados para esta subcategoría.
                                            </div>
                                        </v-list-item>
                                    </v-list-group>
                                </template>
                                <v-list-item v-else>
                                    <div class="text-center text-caption py-2 text-medium-emphasis">
                                        Sin subcategorías registradas
                                    </div>
                                </v-list-item>
                            </v-list>
                        </v-card>
                    </td>
                </tr>
            </template>

            <template v-slot:no-data>
                <div class="d-flex flex-column align-center justify-center py-8 text-medium-emphasis">
                    <v-icon size="48" icon="mdi-shape-outline" class="mb-2 opacity-50"></v-icon>
                    <span>No se encontraron categorías</span>
                </div>
            </template>
        </v-data-table-server>
    </div>
</template>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
