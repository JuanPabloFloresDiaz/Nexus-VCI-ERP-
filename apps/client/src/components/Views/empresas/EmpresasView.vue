<template>
  <v-container fluid class="pa-6">
    <div class="mb-6 d-flex flex-wrap align-center justify-space-between gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold text-primary">Gestión de Empresas</h1>
        <p class="text-body-1 text-medium-emphasis">Administración total de empresas (SuperAdmin)</p>
      </div>
      <div>
         <v-btn color="primary" prepend-icon="mdi-plus" elevation="0" disabled>
            Nueva Empresa
         </v-btn>
      </div>
    </div>

    <v-card elevation="0" class="border rounded-lg">
      <!-- Toolbar -->
      <v-toolbar color="transparent" density="comfortable" class="px-4 border-b">
        <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Buscar por nombre, NIT o correo..."
            density="compact"
            variant="outlined"
            hide-details
            single-line
            style="max-width: 400px;"
            class="mr-2"
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-btn icon variant="text" @click="refetch">
            <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-toolbar>

      <!-- Data Table -->
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="items"
        :items-length="totalItems"
        :loading="isLoading"
        :search="search"
        item-value="id"
        class="elevation-0"
        @update:options="loadItems"
      >
        <!-- Logo Column -->
        <template v-slot:item.logo_url="{ item }">
            <AsyncAvatar 
                :src="item.logo_url" 
                :name="item.nombre_empresa" 
                size="32" 
                class="elevation-1"
            />
        </template>

         <!-- Info Column -->
         <template v-slot:item.nombre_empresa="{ item }">
            <div>
                <div class="font-weight-bold">{{ item.nombre_empresa }}</div>
                <div class="text-caption text-medium-emphasis">NIT: {{ item.nit_empresa || 'N/A' }}</div>
            </div>
        </template>

        <!-- Actions Column -->
        <template v-slot:item.actions="{ item }">
            <v-tooltip text="Ver detalles" location="top">
                <template v-slot:activator="{ props }">
                    <v-btn icon variant="text" color="info" size="small" v-bind="props" disabled>
                        <v-icon>mdi-eye-outline</v-icon>
                    </v-btn>
                </template>
            </v-tooltip>
            <v-tooltip text="Editar" location="top">
                <template v-slot:activator="{ props }">
                    <v-btn icon variant="text" color="primary" size="small" v-bind="props" disabled>
                        <v-icon>mdi-pencil-outline</v-icon>
                    </v-btn>
                </template>
            </v-tooltip>
            <v-tooltip text="Mover a papelera" location="top">
                <template v-slot:activator="{ props }">
                     <v-btn icon variant="text" color="error" size="small" v-bind="props" @click="handleDelete(item)">
                        <v-icon>mdi-delete-outline</v-icon>
                    </v-btn>
                </template>
            </v-tooltip>
        </template>

        <template v-slot:no-data>
             <div class="pa-8 text-center text-medium-emphasis">
                <v-icon icon="mdi-domain-off" size="large" class="mb-2 opacity-50"></v-icon>
                <div>No se encontraron registros</div>
             </div>
        </template>
      </v-data-table-server>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, watch } from 'vue';
import { getEmpresas, deleteEmpresa } from '@/services/empresas.service';
import AsyncAvatar from '@/components/common/AsyncAvatar.vue';
import Swal from 'sweetalert2';

// State
const search = ref('');
const itemsPerPage = ref(10);
const items = ref([]);
const totalItems = ref(0);
const isLoading = ref(false);

// Table Headers
const headers = [
  { title: 'Logo', key: 'logo_url', sortable: false, width: '60px' },
  { title: 'Empresa', key: 'nombre_empresa', align: 'start' },
  { title: 'Correo', key: 'correo_empresa', align: 'start' },
  { title: 'Teléfono', key: 'telefono_empresa', align: 'start' },
  { title: 'Dirección', key: 'direccion_empresa', align: 'start' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
];

/**
 * Load items from API based on current state (page, sort, search)
 */
const loadItems = async ({ page, itemsPerPage: limit, sortBy }) => {
  isLoading.value = true;
  try {
    const offset = (page - 1) * limit;
    let order = '';
    if (sortBy.length) {
       order = `${sortBy[0].key},${sortBy[0].order.toUpperCase()}`;
    }

    const queryParams = new URLSearchParams({
        limit,
        offset,
        search: search.value,
        order
    }).toString();

    const response = await getEmpresas(queryParams);

    if (response.success) {
        items.value = response.data;
        totalItems.value = response.count;
    }
  } catch (error) {
    console.error('Error loading empresas:', error);
  } finally {
    isLoading.value = false;
  }
};

const refetch = () => {
    // Manually trigger reload if needed, usually searching or pagination handles it
};

// ACTIONS

const handleDelete = async (item) => {
    const result = await Swal.fire({
        title: '¿Mover a papelera?',
        text: `La empresa "${item.nombre_empresa}" será desactivada.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, borrar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await deleteEmpresa(item.id);
            Swal.fire('¡Borrado!', 'La empresa ha sido movida a la papelera.', 'success');
             // Trigger reload logic (e.g., refresh items) 
            items.value = items.value.filter(i => i.id !== item.id);
            totalItems.value--;
        } catch (error) {
             Swal.fire('Error', 'No se pudo borrar la empresa.', 'error');
        }
    }
};
</script>
