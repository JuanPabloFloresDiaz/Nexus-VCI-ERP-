<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { computed, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import DeleteComprasModal from '@/components/modals/compras/DeleteComprasModal.vue';
  import DetalleComprasModal from '@/components/modals/compras/DetalleComprasModal.vue';
  import { getCompras } from '@/services/compras.service';
  import { getProveedores } from '@/services/proveedores.service';

  const router = useRouter();

  const search = ref('');
  const page = ref(1);
  const itemsPerPage = ref(10);
  const selectedStatus = ref(null);
  const selectedProveedor = ref(null);

  // Modals State
  const showDetailModal = ref(false);
  const showDeleteModal = ref(false);
  const selectedItem = ref(null);

  const headers = computed(() => [
    { title: 'ID', key: 'id', align: 'start' },
    { title: 'Proveedor', key: 'proveedor.nombre_proveedor', align: 'start' },
    { title: 'Fecha', key: 'created_at', align: 'start' },
    { title: 'Comprador', key: 'usuario_comprador.nombre_usuario', align: 'start' }, // Assuming Backend returns this
    { title: 'Total', key: 'total_compra', align: 'end' },
    { title: 'Estado', key: 'estado_compra', align: 'center' },
    { title: 'Acciones', key: 'actions', align: 'end', sortable: false },
  ]);

  // Fetch Proveedores for Filter
  const { data: proveedoresData } = useQuery({
    queryKey: ['proveedores-list'],
    queryFn: () => getProveedores('limit=1000') // Updated to query string
  });

  const proveedoresList = computed(() => {
    return proveedoresData.value?.data?.map(p => ({
      title: p.nombre_proveedor,
      value: p.id
    })) || [];
  });

  // Fetch Compras
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['compras', page, itemsPerPage, search, selectedStatus, selectedProveedor],
    queryFn: () => getCompras({
      page: page.value,
      limit: itemsPerPage.value,
      search: search.value,
      estado_compra: selectedStatus.value,
      id_proveedor: selectedProveedor.value
    }),
    placeholderData: (previousData) => previousData,
  });

  const compras = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  function formatCurrency (amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDate (dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getStatusColor (status) {
    switch (status) {
      case 'Recibido': { return 'success';
      }
      case 'Pendiente': { return 'warning';
      }
      case 'Cancelado': { return 'error';
      }
      default: { return 'grey';
      }
    }
  }

  function handleSuccess () {
    refetch();
    showDeleteModal.value = false;
    selectedItem.value = null;
  }

  function openDetailModal (item) {
    selectedItem.value = item;
    showDetailModal.value = true;
  }

  function openDeleteModal (item) {
    selectedItem.value = item;
    showDeleteModal.value = true;
  }

  function create () {
    router.push('/main/compras/crear');
  }

  function createBulk () {
    router.push('/main/compras/crear_masivo');
  }

  // Watch filters to reset page
  watch([search, selectedStatus, selectedProveedor], () => {
    page.value = 1;
  });
</script>

<template>
  <v-container class="pa-6" fluid>
    <div class="mb-6 d-flex flex-wrap align-center justify-space-between gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold text-primary">Compras</h1>
        <p class="text-body-1 text-medium-emphasis">Gestión de abastecimiento y gastos</p>
      </div>
      <div>
        <v-btn
          class="mr-2"
          color="success"
          elevation="0"
          prepend-icon="mdi-file-excel"
          @click="createBulk" 
        >
          Carga Masiva
        </v-btn>
        <v-btn 
          color="primary" 
          elevation="0" 
          prepend-icon="mdi-cart-plus" 
          @click="create"
        >
          Nueva Compra
        </v-btn>
      </div>
    </div>

    <v-card class="border rounded-lg" elevation="0">
      <!-- Toolbar / Filters -->
      <v-toolbar class="px-4 border-b" color="transparent" density="comfortable">
        <v-text-field
          v-model="search"
          class="mr-2"
          density="compact"
          hide-details
          placeholder="Buscar (ID, Total)..."
          prepend-inner-icon="mdi-magnify"
          single-line
          style="max-width: 250px;"
          variant="outlined"
        />
                
        <v-select
          v-model="selectedStatus"
          class="mr-2"
          clearable
          density="compact"
          hide-details
          :items="['Pendiente', 'Recibido', 'Cancelado']"
          label="Estado"
          style="max-width: 180px;"
          variant="outlined"
        />

        <v-autocomplete
          v-model="selectedProveedor"
          class="mr-2"
          clearable
          density="compact"
          hide-details
          :items="proveedoresList"
          label="Proveedor"
          style="max-width: 250px;"
          variant="outlined"
        />

        <v-spacer />
        <v-btn icon variant="text" @click="refetch">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-toolbar>

      <!-- Table -->
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        class="elevation-0"
        :headers="headers"
        hover
        :items="compras"
        :items-length="totalItems"
        :loading="isLoading"
        :page="page"
        @update:page="page = $event"
      >
        <template #loading>
          <v-skeleton-loader type="table-row@5" />
        </template>

        <!-- ID Column -->
        <template #item.id="{ item }">
          <span class="text-caption font-weight-bold text-medium-emphasis">#{{ item.id?.substring(0, 8) }}</span>
        </template>

        <!-- Date Column -->
        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>

        <!-- Total Column -->
        <template #item.total_compra="{ item }">
          <span class="font-weight-bold">{{ formatCurrency(item.total_compra) }}</span>
        </template>

        <!-- Status Column -->
        <template #item.estado_compra="{ item }">
          <v-chip :color="getStatusColor(item.estado_compra)" size="small" variant="flat">
            {{ item.estado_compra }}
          </v-chip>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <div class="d-flex justify-end gap-2">
            <v-btn
              v-tooltip="'Ver Detalles'"
              color="info"
              icon
              size="small"
              variant="text"
              @click="openDetailModal(item)"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>

            <v-btn
              v-if="item.estado_compra !== 'Cancelado'"
              v-tooltip="'Editar'"
              color="primary"
              icon
              size="small"
              variant="text"
              @click="router.push(`/main/compras/editar/${item.id}`)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>

            <v-btn
              v-if="item.estado_compra !== 'Cancelado'" 
              v-tooltip="'Eliminar'"
              color="error"
              icon
              size="small"
              variant="text"
              @click="openDeleteModal(item)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
        </template>

        <template #no-data>
          <div class="pa-8 text-center">
            <v-icon class="mb-4" color="medium-emphasis" size="48">mdi-cart-off</v-icon>
            <h3 class="text-h6 text-medium-emphasis">No se encontraron compras</h3>
            <p class="text-body-2 text-disabled">Registra una nueva orden de compra</p>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Modals -->
    <DetalleComprasModal
      v-if="selectedItem"
      v-model="showDetailModal"
      :compra="selectedItem"
    />

    <DeleteComprasModal
      v-if="selectedItem"
      v-model="showDeleteModal"
      :compra="selectedItem"
      @success="handleSuccess"
    />
  </v-container>
</template>
