<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import AsyncAvatar from '@/components/common/AsyncAvatar.vue';
  import { getProveedores } from '@/services/proveedores.service';

  const search = ref('');
  const page = ref(1);
  const itemsPerPage = ref(12); // Grid format usually supports more items or different pagination

  // Query Params
  const queryParams = computed(() => {
    const offset = (page.value - 1) * itemsPerPage.value;
    return new URLSearchParams({
      limit: itemsPerPage.value,
      offset,
      search: search.value,
      order: 'nombre_proveedor,ASC'
    }).toString();
  });

  // Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['proveedores', 'vendor', queryParams],
    queryFn: () => getProveedores(queryParams.value),
    keepPreviousData: true
  });

  const items = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);
  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value));

</script>

<template>
  <v-container class="pa-6" fluid>
    <div class="mb-8">
      <h1 class="text-h4 font-weight-bold text-primary mb-2">Directorio de Proveedores</h1>
      <p class="text-body-1 text-medium-emphasis">Consulta la lista de proveedores autorizados de la empresa.</p>
    </div>

    <!-- Search Bar -->
    <div class="mb-6">
      <v-text-field
        v-model="search"
        class="mx-auto"
        elevation="2"
        hide-details
        placeholder="Buscar proveedor..."
        prepend-inner-icon="mdi-magnify"
        rounded="lg"
        style="max-width: 600px;"
        variant="solo"
      />
    </div>

    <div v-if="isLoading" class="d-flex justify-center py-12">
      <v-progress-circular color="primary" indeterminate size="64" />
    </div>

    <div v-else-if="items.length === 0" class="text-center py-12 text-medium-emphasis">
      <v-icon class="mb-4 text-disabled" size="64">mdi-card-search-outline</v-icon>
      <h3 class="text-h6">No se encontraron proveedores</h3>
    </div>

    <div v-else>
      <!-- Grid Layout -->
      <v-row>
        <v-col 
          v-for="proveedor in items" 
          :key="proveedor.id"
          cols="12" 
          lg="3" 
          md="4" 
          sm="6"
        >
          <v-card class="h-100 rounded-lg transition-swing card-hover" elevation="2">
            <v-card-text class="d-flex flex-column align-center text-center pt-6">
              <AsyncAvatar 
                class="mb-4 elevation-2" 
                :name="proveedor.nombre_proveedor" 
                size="80"
              />
                            
              <h3 class="text-h6 font-weight-bold mb-1 text-truncate w-100">
                {{ proveedor.nombre_proveedor }}
              </h3>
                            
              <v-chip class="mb-4" color="primary" size="small" variant="tonal">
                Proveedor
              </v-chip>

              <v-divider class="w-100 mb-4" />

              <div class="w-100 text-left px-2">
                <div v-if="proveedor.contacto_nombre" class="d-flex align-center mb-2">
                  <v-icon class="mr-2" color="medium-emphasis" size="small">mdi-account</v-icon>
                  <span class="text-body-2 text-medium-emphasis text-truncate">{{ proveedor.contacto_nombre }}</span>
                </div>
                <div v-if="proveedor.telefono_proveedor" class="d-flex align-center mb-2">
                  <v-icon class="mr-2" color="medium-emphasis" size="small">mdi-phone</v-icon>
                  <a class="text-body-2 text-decoration-none text-medium-emphasis table-link" :href="`tel:${proveedor.telefono_proveedor}`">
                    {{ proveedor.telefono_proveedor }}
                  </a>
                </div>
                <div v-if="proveedor.correo_proveedor" class="d-flex align-center">
                  <v-icon class="mr-2" color="medium-emphasis" size="small">mdi-email</v-icon>
                  <a class="text-body-2 text-decoration-none text-medium-emphasis table-link text-truncate d-inline-block" :href="`mailto:${proveedor.correo_proveedor}`" style="max-width: 200px;">
                    {{ proveedor.correo_proveedor }}
                  </a>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Pagination -->
      <div class="d-flex justify-center mt-8">
        <v-pagination
          v-model="page"
          :length="totalPages"
          rounded="circle"
          :total-visible="5"
        />
      </div>
    </div>
  </v-container>
</template>

<style scoped>
.card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.1) !important;
}

.table-link:hover {
    color: rgb(var(--v-theme-primary)) !important;
    text-decoration: underline !important;
}
</style>
