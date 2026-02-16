<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import DeleteCategorizacionModal from '@/components/modals/categorizacion/DeleteCategorizacionModal.vue';
  import DetalleFiltrosModal from '@/components/modals/categorizacion/DetalleFiltrosModal.vue';
  import { useAuth } from '@/hooks/useAuth';
  import { getCategorias } from '@/services/categorizacion.service';
  import { useHead } from '@unhead/vue';

  // --- SEO ---
  useHead({
    title: 'Gestión de Categorización',
    meta: [
      { name: 'description', content: 'Administración de categorías, subcategorías y filtros.' }
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });

  // ... (other refs)
  const deleteModalRef = ref(null);
  const filtrosModalRef = ref(null);

  // Pagination and search state
  const page = ref(1);
  const limit = ref(10);
  const search = ref('');
  const expanded = ref([]); // For expanded rows in data table

  const queryParams = computed(() => ({
    page: page.value,
    limit: limit.value,
    search: search.value,
  }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['categorias', queryParams],
    queryFn: () => {
      console.log('Fetching categorias with params:', queryParams.value);
      return getCategorias(queryParams.value);
    },
    // keepPreviousData: true // Deprecated in v5? checking package.json
  });

  console.log('CategorizacionView mounted');
  console.log('QueryParams:', queryParams.value);

  const categorias = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);
  const pageCount = computed(() => Math.ceil(totalItems.value / limit.value));

  function handleCreate () {
    // Navigate to create page
    // router.push({ name: 'create-categorizacion' }); // Adjust route name
  }

  function handleEdit (item) {
    // Navigate to edit page
    // router.push({ name: 'edit-categorizacion', params: { id: item.id } });
  }

  function handleDelete (item) {
    deleteModalRef.value?.open(item);
  }

  function handleViewFilters (sub) {
    filtrosModalRef.value?.open(sub);
  }
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <!-- Header -->
    <div class="d-flex align-center pa-4 gap-4 bg-white border-b">
      <div>
        <h1 class="text-h5 font-weight-bold">Categorización</h1>
        <div class="text-subtitle-2 text-medium-emphasis">
          Gestión de categorías, subcategorías y filtros
        </div>
      </div>
      <v-spacer />
      <div class="d-flex gap-2">
        <v-btn
          color="success"
          prepend-icon="mdi-file-excel-outline"
          to="/main/categorizacion/crear_masivo"
          variant="outlined"
        >
          Carga Masiva
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          to="/main/categorizacion/crear"
        >
          Nueva Categoría
        </v-btn>
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

    <!-- Content Area -->
    <div class="flex-grow-1 overflow-y-auto pa-4 bg-grey-lighten-5">
      <div v-if="isLoading" class="d-flex justify-center pa-8">
        <v-progress-circular color="primary" indeterminate />
      </div>

      <div v-else-if="categorias.length === 0" class="d-flex flex-column align-center justify-center py-8 text-medium-emphasis">
        <v-icon class="mb-2 opacity-50" icon="mdi-shape-outline" size="48" />
        <span>No se encontraron categorías</span>
      </div>

      <v-expansion-panels v-else class="mb-4" variant="popout">
        <v-expansion-panel
          v-for="item in categorias"
          :key="item.id"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center flex-grow-1 mr-4">
              <v-icon class="mr-3" color="primary" icon="mdi-shape" />
              <div>
                <div class="text-subtitle-1 font-weight-medium">{{ item.nombre_categoria }}</div>
                <div v-if="item.descripcion_categoria" class="text-caption text-medium-emphasis">
                  {{ item.descripcion_categoria }}
                </div>
              </div>
              <v-spacer />
              <v-chip class="mr-4" color="primary" size="small" variant="tonal">
                {{ item.subcategorias?.length || 0 }} Subcategorías
              </v-chip>
                            
              <!-- Stop propagation to prevent accordion toggle when clicking actions -->
              <div class="d-flex gap-1" @click.stop>
                <v-btn
                  color="warning"
                  icon
                  size="small"
                  :to="`/main/categorizacion/editar/${item.id}`"
                  variant="text"
                >
                  <v-icon>mdi-pencil</v-icon>
                  <v-tooltip activator="parent" location="top">Editar</v-tooltip>
                </v-btn>
                <v-btn
                  color="error"
                  icon
                  size="small"
                  variant="text"
                  @click="handleDelete(item)"
                >
                  <v-icon>mdi-delete</v-icon>
                  <v-tooltip activator="parent" location="top">Eliminar</v-tooltip>
                </v-btn>
              </div>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <div class="pt-2">
              <div class="text-subtitle-2 mb-2 text-medium-emphasis">
                Subcategorías
              </div>
                            
              <v-row v-if="item.subcategorias && item.subcategorias.length > 0">
                <v-col 
                  v-for="sub in item.subcategorias" 
                  :key="sub.id"
                  cols="12" 
                  md="4" 
                  sm="6"
                >
                  <v-card class="h-100" variant="outlined">
                    <v-card-text>
                      <div class="d-flex align-center justify-space-between">
                        <div class="d-flex align-center">
                          <v-icon class="mr-2" color="secondary" size="small">mdi-subdirectory-arrow-right</v-icon>
                          <span class="text-body-2 font-weight-medium">{{ sub.nombre_subcategoria }}</span>
                        </div>
                        <v-btn
                          color="info"
                          prepend-icon="mdi-filter-variant"
                          size="x-small"
                          variant="tonal"
                          @click="handleViewFilters(sub)"
                        >
                          {{ sub.filtros?.length || 0 }} Filtros
                        </v-btn>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
                            
              <div v-else class="text-caption text-medium-emphasis font-italic">
                No hay subcategorías registradas en esta categoría.
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <!-- Footer Pagination -->
    <div class="bg-white border-t pa-2 d-flex align-center justify-end">
      <div class="text-caption text-medium-emphasis mr-4">
        Total: {{ totalItems }}
      </div>
      <v-pagination
        v-model="page"
        active-color="primary"
        density="comfortable"
        :length="pageCount"
        size="small"
        :total-visible="5"
        variant="flat"
      />
    </div>

    <DeleteCategorizacionModal ref="deleteModalRef" />
    <DetalleFiltrosModal ref="filtrosModalRef" />
  </div>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
