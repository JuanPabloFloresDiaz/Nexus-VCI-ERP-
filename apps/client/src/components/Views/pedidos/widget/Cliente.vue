<script setup>
import { ref, watch } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { getClientes } from '@/services/clientes.service';
import _ from 'lodash';
import CreateClienteModal from '@/components/modals/clientes/CreateClienteModal.vue'; // Reuse existing modal

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

const selectClient = (cliente) => {
    emit('update:modelValue', cliente);
    search.value = '';
    showResults.value = false;
};

const onClientCreated = (newClient) => {
    selectClient(newClient); // Auto-select created client
    showCreateModal.value = false;
};
</script>

<template>
    <div class="position-relative">
        <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-account-search"
            label="Buscar cliente (Nombre, NIT, Correo)..."
            variant="outlined"
            density="compact"
            hide-details
            clearable
            persistent-placeholder
            @focus="showResults = !!search"
        >
            <template v-slot:append>
                <v-btn
                    color="primary"
                    icon="mdi-plus"
                    size="small"
                    variant="tonal"
                    @click="showCreateModal = true"
                    title="Nuevo Cliente"
                ></v-btn>
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
                        <v-progress-circular indeterminate size="20" color="primary"></v-progress-circular>
                    </div>
                </v-list-item>
                
                <template v-else>
                    <v-list-item
                        v-for="cliente in clientesData?.data"
                        :key="cliente.id"
                        @click="selectClient(cliente)"
                        lines="two"
                    >
                        <template v-slot:prepend>
                            <v-avatar color="primary" size="32" variant="tonal" class="mr-2">
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
            <v-btn size="small" variant="text" color="primary" @click="showCreateModal = true">
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
