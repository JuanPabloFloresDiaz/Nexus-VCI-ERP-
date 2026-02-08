<script setup>
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { getProveedores } from '@/services/proveedores.service';
import AsyncAvatar from '@/components/common/AsyncAvatar.vue';

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
    <v-container fluid class="pa-6">
        <div class="mb-8">
            <h1 class="text-h4 font-weight-bold text-primary mb-2">Directorio de Proveedores</h1>
            <p class="text-body-1 text-medium-emphasis">Consulta la lista de proveedores autorizados de la empresa.</p>
        </div>

        <!-- Search Bar -->
        <div class="mb-6">
            <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                placeholder="Buscar proveedor..."
                variant="solo"
                elevation="2"
                rounded="lg"
                hide-details
                style="max-width: 600px;"
                class="mx-auto"
            ></v-text-field>
        </div>

        <div v-if="isLoading" class="d-flex justify-center py-12">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        </div>

        <div v-else-if="items.length === 0" class="text-center py-12 text-medium-emphasis">
            <v-icon size="64" class="mb-4 text-disabled">mdi-card-search-outline</v-icon>
            <h3 class="text-h6">No se encontraron proveedores</h3>
        </div>

        <div v-else>
            <!-- Grid Layout -->
            <v-row>
                <v-col 
                    v-for="proveedor in items" 
                    :key="proveedor.id"
                    cols="12" 
                    sm="6" 
                    md="4" 
                    lg="3"
                >
                    <v-card elevation="2" class="h-100 rounded-lg transition-swing card-hover">
                        <v-card-text class="d-flex flex-column align-center text-center pt-6">
                            <AsyncAvatar 
                                :name="proveedor.nombre_proveedor" 
                                size="80" 
                                class="mb-4 elevation-2"
                            />
                            
                            <h3 class="text-h6 font-weight-bold mb-1 text-truncate w-100">
                                {{ proveedor.nombre_proveedor }}
                            </h3>
                            
                            <v-chip size="small" color="primary" variant="tonal" class="mb-4">
                                Proveedor
                            </v-chip>

                            <v-divider class="w-100 mb-4"></v-divider>

                            <div class="w-100 text-left px-2">
                                <div class="d-flex align-center mb-2" v-if="proveedor.contacto_nombre">
                                    <v-icon color="medium-emphasis" size="small" class="mr-2">mdi-account</v-icon>
                                    <span class="text-body-2 text-medium-emphasis text-truncate">{{ proveedor.contacto_nombre }}</span>
                                </div>
                                <div class="d-flex align-center mb-2" v-if="proveedor.telefono_proveedor">
                                    <v-icon color="medium-emphasis" size="small" class="mr-2">mdi-phone</v-icon>
                                    <a :href="`tel:${proveedor.telefono_proveedor}`" class="text-body-2 text-decoration-none text-medium-emphasis table-link">
                                        {{ proveedor.telefono_proveedor }}
                                    </a>
                                </div>
                                <div class="d-flex align-center" v-if="proveedor.correo_proveedor">
                                    <v-icon color="medium-emphasis" size="small" class="mr-2">mdi-email</v-icon>
                                    <a :href="`mailto:${proveedor.correo_proveedor}`" class="text-body-2 text-decoration-none text-medium-emphasis table-link text-truncate d-inline-block" style="max-width: 200px;">
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
                ></v-pagination>
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
