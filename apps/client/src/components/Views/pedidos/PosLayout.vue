<script setup>
  import { onMounted, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import CarritoWidget from './widget/Carrito.vue';
  import CatalogoProductosWidget from './widget/CatalogoProductos.vue';
  import ClienteWidget from './widget/Cliente.vue';

  const props = defineProps({
    initialOrder: {
      type: Object,
      default: null
    },
    isEdit: {
      type: Boolean,
      default: false
    }
  });

  const router = useRouter();
  const cart = ref([]);
  const selectedClient = ref(null);

  // Initialize with props if provided
  watch(() => props.initialOrder, (val) => {
    if (val) {
      // Map initial order details to cart structure
      cart.value = val.detalles.map(d => {
        // Parse detalles_producto if string
        let details = {};
        if (typeof d.detalles_producto === 'string') {
          try { details = JSON.parse(d.detalles_producto); } catch{}
        } else {
          details = d.detalles_producto || {};
        }

        return {
          ...d.producto,
          id: d.id_producto, // Ensure product ID is at top level for matcher
          id_producto: d.id_producto,
          nombre_producto: d.producto?.nombre_producto,
          imagen_url: d.producto?.imagen_url,
          stock_actual: d.producto?.stock_actual + d.cantidad, // Virtual logic: existing order items "hold" stock, so available = current + held? 
          // WAIT: If I edit an order, the stock in DB is already deducted. 
          // So "stock_actual" in DB is what's LEFT.
          // The item in cart has "cantidad".
          // If I want to increase quantity, I can go up to stock_actual.
          // But wait, if I have 5 in cart, and DB says 10 left. Total available for me is 15.
          // However, the product object from DB (via Catalogo) will show 10.
          // The logical stock available for THIS item line is (DB Stock + Current Cart Quantity).
          // NOTE: CatalogoProductos returns generic product info.
          // When we load existing items, we need to be careful about validation.
          // Let's assume for now stock_actual passed here is from the product relation loaded in Order?
          // Actually `d.producto` might not have up-to-date `stock_actual` if not fetched recently or if `include` didn't get it.
          // It's safer if validation happens on "add more".
          // Let's pass what we have.
          cantidad: d.cantidad,
          precio_historico: d.precio_historico,
          subtotal: d.subtotal,
          detalles_producto: details,
          cartItemId: Date.now() + Math.random().toString(36).slice(2, 11) // Generate valid ID for frontend key
        };
      });

      if (val.cliente) {
        selectedClient.value = val.cliente;
      }
    }
  }, { immediate: true });

  function addToCart (product) {
    const cartItemId = Date.now() + Math.random().toString(36).slice(2, 11);
    cart.value.push({
      ...product,
      cartItemId,
      id_producto: product.id,
      cantidad: 1,
      precio_historico: product.precio_unitario,
      subtotal: Number(product.precio_unitario),
      detalles_producto: {} 
    });
  }

  function clearCart () {
    cart.value = [];
    selectedClient.value = null;
  }

  function onOrderSaved (order) {
    // Redirect to list
    router.push('/main/pedidos');
  }
</script>

<template>
  <div class="d-flex flex-column h-100 bg-grey-lighten-4">
    <!-- POS Layout -->
    <div class="d-flex flex-grow-1 overflow-hidden" style="height: calc(100vh - 64px);">
            
      <!-- Left: Catalog & Client Search -->
      <div class="d-flex flex-column flex-grow-1 w-66">
        <!-- Client Widget Section -->
        <div class="bg-white pa-3 border-b">
          <v-row align="center">
            <v-col cols="12" md="8">
              <ClienteWidget v-model="selectedClient" />
            </v-col>
            <v-col class="text-right d-none d-md-block" cols="12" md="4">
              <v-chip v-if="selectedClient" color="success" variant="tonal">
                <v-icon start>mdi-account-check</v-icon>
                Cliente seleccionado
              </v-chip>
              <div v-else class="text-caption text-error">
                <v-icon color="error" size="small" start>mdi-alert-circle</v-icon>
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
          :is-edit="isEdit"
          :order-id="initialOrder?.id"
          @clear-cart="clearCart"
          @clear-client="selectedClient = null"
          @order-created="onOrderSaved"
          @order-updated="onOrderSaved"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.w-66 { width: 66.6666%; }
.w-33 { width: 33.3333%; }
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
