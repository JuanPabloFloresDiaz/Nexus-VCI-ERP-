<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import DeletePedidoModal from '@/components/modals/pedidos/DeletePedidoModal.vue';
  // Modals
  import DetallePedidosModal from '@/components/modals/pedidos/DetallePedidosModal.vue';

  import { useAuth } from '@/hooks/useAuth';
  import { getPedidos } from '@/services/pedidos.service';
  // import UpdatePedidoModal from ... (Maybe later for quick status update)

  const router = useRouter();
  const { isVendor } = useAuth();

  const search = ref('');
  const page = ref(1);
  const itemsPerPage = ref(10);
  const selectedStatus = ref(null);

  // Modals State
  const showDetailModal = ref(false);
  const showDeleteModal = ref(false);
  const selectedItem = ref(null);

  const headers = computed(() => [
    { title: 'ID', key: 'id', align: 'start' },
    { title: 'Cliente', key: 'cliente.nombre_cliente', align: 'start' },
    { title: 'Fecha', key: 'created_at', align: 'start' },
    { title: 'Total', key: 'total_pedido', align: 'end' },
    { title: 'Estado', key: 'estado_pedido', align: 'center' },
    { title: 'Vendedor', key: 'usuario_creador.nombre_usuario', align: 'start' },
    { title: 'Acciones', key: 'actions', align: 'end', sortable: false },
  ]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pedidos', page, itemsPerPage, search, selectedStatus],
    queryFn: () => getPedidos({
      page: page.value,
      limit: itemsPerPage.value,
      search: search.value,
      estado_pedido: selectedStatus.value
    }),
    placeholderData: (previousData) => previousData,
  });

  const pedidos = computed(() => data.value?.data || []);
  const totalItems = computed(() => data.value?.count || 0);

  function formatCurrency (amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDate (dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getStatusColor (status) {
    switch (status) {
      case 'Completado': { return 'success';
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
    router.push('/main/pedidos/crear');
  }

  function createBulk () {
    router.push('/main/pedidos/crear_masivo'); // Assuming route exists
  }
</script>

<template>
  <v-container class="pa-6" fluid>
    <div class="mb-6 d-flex flex-wrap align-center justify-space-between gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold text-primary">Pedidos</h1>
        <p class="text-body-1 text-medium-emphasis">Gestión de ventas y despachos</p>
      </div>
      <div>
        <v-btn
          v-if="!isVendor"
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
          Nuevo Pedido
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
          placeholder="Buscar pedido (ID, Total)..."
          prepend-inner-icon="mdi-magnify"
          single-line
          style="max-width: 300px;"
          variant="outlined"
        />
                
        <v-select
          v-model="selectedStatus"
          class="mr-2"
          clearable
          density="compact"
          hide-details
          :items="['Pendiente', 'Completado', 'Cancelado']"
          label="Estado"
          style="max-width: 200px;"
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
        :items="pedidos"
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
          <span class="text-caption font-weight-bold text-medium-emphasis">#{{ item.id.substring(0, 8) }}</span>
        </template>

        <!-- Date Column -->
        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>

        <!-- Total Column -->
        <template #item.total_pedido="{ item }">
          <span class="font-weight-bold">{{ formatCurrency(item.total_pedido) }}</span>
        </template>

        <!-- Status Column -->
        <template #item.estado_pedido="{ item }">
          <v-chip :color="getStatusColor(item.estado_pedido)" size="small" variant="flat">
            {{ item.estado_pedido }}
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
              v-if="item.estado_pedido === 'Pendiente'"
              v-tooltip="'Editar Pedido'"
              color="primary"
              icon
              size="small"
              variant="text"
              @click="router.push(`/main/pedidos/editar/${item.id}`)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>

            <v-btn
              v-if="!isVendor"
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
            <h3 class="text-h6 text-medium-emphasis">No se encontraron pedidos</h3>
            <p class="text-body-2 text-disabled">Registra una nueva venta</p>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Modals -->
    <DetallePedidosModal
      v-if="selectedItem"
      v-model="showDetailModal"
      :pedido="selectedItem"
    />

    <DeletePedidoModal
      v-if="selectedItem"
      v-model="showDeleteModal"
      :pedido="selectedItem"
      @success="handleSuccess"
    />
  </v-container>
</template>
