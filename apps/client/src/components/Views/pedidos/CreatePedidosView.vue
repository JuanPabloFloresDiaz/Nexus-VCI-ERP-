<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// import MainLayout from '@/layouts/MainLayout.vue'; // Removed as layout is handled by router
import ClienteWidget from './widget/Cliente.vue';
import CatalogoProductosWidget from './widget/CatalogoProductos.vue';
import CarritoWidget from './widget/Carrito.vue';

const router = useRouter();
const cart = ref([]);
const selectedClient = ref(null);

const addToCart = (product) => {
    // Always add as new item to allow distinct configuration
    // User requirement: "separar los productos en el mismo carrito... si tuviese que comprar 2 camisas... una talla L y otra talla M"
    
    // We generate a temporary unique ID for the cart item to key by
    const cartItemId = Date.now() + Math.random().toString(36).substr(2, 9);

    cart.value.push({
        ...product, // Copy product basic details
        cartItemId, // Frontend-only unique ID
        id_producto: product.id,
        cantidad: 1,
        precio_historico: product.precio_unitario,
        subtotal: Number(product.precio_unitario),
        // Initialize details empty or with defaults if needed.
        // The user wants to select them in the cart.
        detalles_producto: {} 
    });
};

const clearCart = () => {
    cart.value = [];
    selectedClient.value = null;
};

const onOrderCreated = (order) => {
    // Redirect to list after successful creation
    // Optionally open the detail modal there or show success
    router.push('/main/pedidos');
};
</script>

<template>
    <div class="d-flex flex-column h-100 bg-grey-lighten-4">
            <!-- Top Bar (Optional, can be used for extra controls or breadcrumbs) -->
             <!-- <div class="bg-white px-4 py-2 border-b d-flex align-center">
                <v-btn icon="mdi-arrow-left" variant="text" size="small" to="/main/pedidos" class="mr-2"></v-btn>
                <div class="text-h6">Nuevo Pedido (POS)</div>
             </div> -->

            <!-- POS Layout -->
            <div class="d-flex flex-grow-1 overflow-hidden" style="height: calc(100vh - 64px);"> <!-- Adjust based on MainLayout header height -->
            
            <!-- Left: Catalog & Client Search -->
            <div class="d-flex flex-column flex-grow-1 w-66">
                <!-- Client Widget Section -->
                <div class="bg-white pa-3 border-b">
                        <v-row align="center">
                        <v-col cols="12" md="8">
                            <ClienteWidget v-model="selectedClient" />
                        </v-col>
                        <v-col cols="12" md="4" class="text-right d-none d-md-block">
                            <v-chip v-if="selectedClient" color="success" variant="tonal">
                                <v-icon start>mdi-account-check</v-icon>
                                Cliente seleccionado
                            </v-chip>
                            <div v-else class="text-caption text-error">
                                <v-icon start size="small" color="error">mdi-alert-circle</v-icon>
                                Seleccione un cliente
                            </div>
                        </v-col>
                        </v-row>
                </div>

                <!-- Catalog Widget -->
                <div class="flex-grow-1 overflow-hidden position-relative">
                    <CatalogoProductosWidget @add-to-cart="addToCart" />
                </div>
            </div>

            <!-- Right: Cart -->
            <div class="w-33 h-100 bg-white border-s elevation-2" style="min-width: 350px; max-width: 450px;">
                <CarritoWidget
                    v-model="cart"
                    :cliente="selectedClient"
                    @clear-client="selectedClient = null"
                    @order-created="onOrderCreated"
                    @clear-cart="clearCart"
                />
            </div>
            </div>
    </div>
</template>

<style scoped>
.w-66 { width: 66.6666%; }
.w-33 { width: 33.3333%; }
/* Responsive adjustments handled by Vuetify grid mainly, but flex layout is fixed for POS feel */
@media (max-width: 960px) {
    .d-flex.overflow-hidden {
        flex-direction: column;
        overflow-y: auto !important;
        height: auto !important;
    }
    .w-66, .w-33 { width: 100%; min-width: 100%; max-width: 100%; }
    .h-100 { height: auto !important; }
}
</style>
