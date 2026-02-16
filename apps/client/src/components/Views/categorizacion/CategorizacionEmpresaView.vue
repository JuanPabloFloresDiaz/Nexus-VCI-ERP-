<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import AsyncAvatar from '@/components/common/AsyncAvatar.vue';
  import { getCategorias } from '@/services/categorizacion.service';
  import { useHead } from '@unhead/vue';

  // --- SEO ---
  useHead({
    title: 'Directorio de Categorías',
    meta: [
      { name: 'description', content: 'Exploración de categorías y filtros disponibles.' }
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });

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
        <h1 class="text-h5 font-weight-bold text-secondary">Directorio de Categorías</h1>
        <div class="text-subtitle-2 text-medium-emphasis">
          Explora las categorías y filtros disponibles
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="d-flex align-center pa-4 gap-4 bg-grey-lighten-5 border-b">
      <v-text-field
        v-model="search"
        bg-color="white"
        density="compact"
        hide-details
        placeholder="Buscar categoría..."
        prepend-inner-icon="mdi-magnify"
        style="max-width: 300px"
        variant="outlined"
      />
      <v-spacer />
      <v-btn icon :loading="isLoading" variant="text" @click="refetch">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </div>

    <!-- Table -->
    <v-data-table-server
      v-model:expanded="expanded"
      v-model:page="page"
      class="flex-grow-1"
      density="comfortable"
      :headers="headers"
      hover
      item-value="id"
      :items="categorias"
      :items-length="totalItems"
      :items-per-page="limit"
      :loading="isLoading"
      show-expand
    >
      <template #item.nombre_categoria="{ item }">
        <div class="font-weight-medium">{{ item.nombre_categoria }}</div>
      </template>

      <template #item.subcategorias_count="{ item }">
        <v-chip color="primary" size="small" variant="tonal">
          {{ item.subcategorias?.length || 0 }}
        </v-chip>
      </template>

      <!-- Expanded Row for Subcategories -->
      <template #expanded-row="{ columns, item }">
        <tr>
          <td class="pa-4 bg-grey-lighten-5" :colspan="columns.length">
            <div class="text-subtitle-2 mb-2 text-medium-emphasis">
              Subcategorías y Filtros
            </div>
            <v-card class="bg-white" variant="outlined">
              <v-list density="compact">
                <template v-if="item.subcategorias && item.subcategorias.length > 0">
                  <v-list-group 
                    v-for="sub in item.subcategorias" 
                    :key="sub.id"
                    :value="sub.id"
                  >
                    <template #activator="{ props }">
                      <v-list-item
                        v-bind="props"
                        prepend-icon="mdi-subdirectory-arrow-right"
                        :title="sub.nombre_subcategoria"
                      >
                        <template #append>
                          <v-chip color="medium-emphasis" size="x-small" variant="text">
                            {{ sub.filtros?.length || 0 }} Filtros
                          </v-chip>
                        </template>
                      </v-list-item>
                    </template>

                    <v-list-item v-if="sub.filtros && sub.filtros.length > 0">
                      <div class="px-4 py-2">
                        <v-row dense>
                          <v-col v-for="filtro in sub.filtros" :key="filtro.id" cols="12" md="6">
                            <v-card class="bg-grey-lighten-4 mb-2" variant="flat">
                              <v-card-text class="py-2">
                                <div class="d-flex align-center justify-space-between mb-1">
                                  <div class="font-weight-medium text-body-2">{{ filtro.nombre_filtro }}</div>
                                  <v-chip class="text-caption" label size="x-small">{{ filtro.tipo_dato }}</v-chip>
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

      <template #no-data>
        <div class="d-flex flex-column align-center justify-center py-8 text-medium-emphasis">
          <v-icon class="mb-2 opacity-50" icon="mdi-shape-outline" size="48" />
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
