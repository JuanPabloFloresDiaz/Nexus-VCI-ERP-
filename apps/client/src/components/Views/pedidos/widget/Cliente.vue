<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import _ from 'lodash';
  import { ref, watch } from 'vue';
  import CreateClienteModal from '@/components/modals/clientes/CreateClienteModal.vue'; // Reuse existing modal
  import { getClientes } from '@/services/clientes.service';

  const props = defineProps({
    modelValue: {
      type: Object,
      default: null
    }
  });

  const emit = defineEmits(['update:modelValue']);

  const search = ref('');
  const showCreateModal = ref(false);
  const showResults = ref(false);

  // Debounced Search
  const debouncedSearch = ref('');
  const updateSearch = _.debounce((val) => {
    debouncedSearch.value = val;
    showResults.value = !!val;
  }, 300);

  watch(search, (val) => updateSearch(val));

  // Fetch Clients
  const { data: clientesData, isLoading } = useQuery({
    queryKey: ['clientes', debouncedSearch],
    queryFn: () => getClientes({
      search: debouncedSearch.value,
      limit: 5
    }),
    enabled: () => !!debouncedSearch.value
  });

  function selectClient (cliente) {
    emit('update:modelValue', cliente);
    search.value = '';
    showResults.value = false;
  }

  function onClientCreated (newClient) {
    selectClient(newClient); // Auto-select created client
    showCreateModal.value = false;
  }
</script>

<template>
  <div class="position-relative">
    <v-text-field
      v-model="search"
      clearable
      density="compact"
      hide-details
      label="Buscar cliente (Nombre, NIT, Correo)..."
      persistent-placeholder
      prepend-inner-icon="mdi-account-search"
      variant="outlined"
      @focus="showResults = !!search"
    >
      <template #append>
        <v-btn
          color="primary"
          icon="mdi-plus"
          size="small"
          title="Nuevo Cliente"
          variant="tonal"
          @click="showCreateModal = true"
        />
      </template>
    </v-text-field>

    <!-- Search Results Dropdown -->
    <v-card
      v-if="showResults && (isLoading || (clientesData?.data && clientesData.data.length > 0))"
      class="position-absolute w-100 mt-1 z-index-dropdown"
      elevation="4"
      max-height="300"
      style="z-index: 1000; overflow-y: auto;"
    >
      <v-list density="compact">
        <v-list-item v-if="isLoading">
          <div class="d-flex justify-center pa-2">
            <v-progress-circular color="primary" indeterminate size="20" />
          </div>
        </v-list-item>
                
        <template v-else>
          <v-list-item
            v-for="cliente in clientesData?.data"
            :key="cliente.id"
            lines="two"
            @click="selectClient(cliente)"
          >
            <template #prepend>
              <v-avatar class="mr-2" color="primary" size="32" variant="tonal">
                <span class="text-caption">{{ cliente.nombre_cliente.charAt(0) }}</span>
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-bold">
              {{ cliente.nombre_cliente }} {{ cliente.apellido_cliente }}
            </v-list-item-title>
            <v-list-item-subtitle>
              <span v-if="cliente.nit_cliente" class="mr-2 text-caption font-weight-bold">NIT: {{ cliente.nit_cliente }}</span>
              <span v-if="cliente.correo_cliente">{{ cliente.correo_cliente }}</span>
            </v-list-item-subtitle>
          </v-list-item>
        </template>
      </v-list>
    </v-card>
    <v-card
      v-else-if="showResults && !isLoading && search.length > 2"
      class="position-absolute w-100 mt-1 z-index-dropdown pa-4 text-center"
      elevation="4"
      style="z-index: 1000;"
    >
      <div class="text-medium-emphasis mb-2">No se encontraron clientes</div>
      <v-btn color="primary" size="small" variant="text" @click="showCreateModal = true">
        Crear nuevo cliente
      </v-btn>
    </v-card>

    <!-- Create Client Modal -->
    <CreateClienteModal
      v-model="showCreateModal"
      @created="onClientCreated"
    />
  </div>
</template>
