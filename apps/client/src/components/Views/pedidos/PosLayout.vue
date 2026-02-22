<script setup>
  import { onMounted, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  // Fetch Almacenes
  import { getAlmacenes } from '@/services/almacenes.service';
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

        const variant = d.variante;
        const product = d.producto;
        const warehouseId = val.id_almacen_origen || val.almacen_origen?.id;

        let currentStock = 0;
        if (variant) {
          if (warehouseId && variant.stock) {
            const entry = variant.stock.find(s => s.id_almacen === warehouseId);
            currentStock = entry ? entry.stock_actual : 0;
          } else {
            currentStock = variant.stock_actual || 0;
          }
        } else {
          currentStock = product?.stock_actual || 0;
        }

        return {
          ...product,
          id: product?.id, 
          id_producto: product?.id,
          id_variante: variant?.id, // Map Variant ID
          sku: variant?.sku,
          nombre_producto: product?.nombre_producto,
          imagen_url: variant?.imagen_url || product?.imagen_url,
          stock_actual: currentStock + d.cantidad, 
          // Note: added d.cantidad back to stock for "Available" logic in UI editing

          cantidad: d.cantidad,
          precio_historico: d.precio_historico,
          precio_unitario: d.precio_historico, // normalize
          subtotal: d.subtotal,
          detalles_producto: details,
          detalles_filtros: variant?.detalles_filtros || [], // Assuming backend includes this if needed for display, otherwise empty
          cartItemId: Date.now() + Math.random().toString(36).slice(2, 11)
        };
      });

      if (val.cliente) {
        selectedClient.value = val.cliente;
      }
      if (val.almacen_origen) {
        // If editing, use the order's warehouse
        selectedWarehouse.value = val.id_almacen_origen || val.almacen_origen?.id; // Adjust based on API response
      }
    }
  }, { immediate: true });
  const almacenes = ref([]);
  const selectedWarehouse = ref(null);

  onMounted(async () => {
    try {
      const res = await getAlmacenes({ limit: 100 });
      if (res.data) {
        almacenes.value = res.data;
        // Default to main or first if not editing
        if (!props.isEdit && !selectedWarehouse.value) {
          const main = almacenes.value.find(a => a.es_principal);
          selectedWarehouse.value = main ? main.id : almacenes.value[0]?.id;
        }
      }
    } catch (error) { console.error(error); }
  });

  function addToCart (payload) {
    // payload can be { producto, variant } or just producto (legacy/safeguard)
    let product, variant;
    
    if (payload.producto && payload.variant) {
      product = payload.producto;
      variant = payload.variant;
    } else {
      // Fallback or direct product add (shouldn't happen with updated Catalog)
      product = payload;
      // Try to find default variant if exists
      variant = product.variantes?.[0];
    }
    

    // Validate Stock
    let stockAvailable = 0;
    if (variant) {
      if (selectedWarehouse.value && variant.stock) {
        const entry = variant.stock.find(s => s.id_almacen === selectedWarehouse.value);
        stockAvailable = entry ? entry.stock_actual : 0;
      } else {
        stockAvailable = variant.stock_actual || 0;
      }
    } else {
      stockAvailable = product.stock_actual || 0;
    }
    if (stockAvailable <= 0) {
      // Should have been disabled in UI, but double check
      return;
    }

    const cartItemId = Date.now() + Math.random().toString(36).slice(2, 11);
    
    cart.value.push({
      ...product, // Keep parent info
      // Override with variant specific info
      cartItemId,
      id_producto: product.id,
      id_variante: variant?.id,
      sku: variant?.sku,
      stock_actual: stockAvailable,
      precio_unitario: variant ? variant.precio_unitario : product.precio_unitario,
      precio_historico: variant ? variant.precio_unitario : product.precio_unitario,
      
      cantidad: 1,
      subtotal: Number(variant ? variant.precio_unitario : product.precio_unitario),
      
      // Pass variant attributes for display in Carrito
      detalles_filtros: variant?.detalles_filtros || [],
      detalles_producto: {} // Legacy field for editable options, might be unused now
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
        <!-- Header: Client & Warehouse -->
        <div class="bg-white pa-3 border-b">
          <v-row align="center">
            <v-col cols="12" md="6">
              <ClienteWidget v-model="selectedClient" />
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="selectedWarehouse"
                density="compact"
                :disabled="cart.length > 0"
                hide-details
                item-title="nombre_almacen"
                item-value="id"
                :items="almacenes"
                label="Almacén de Origen"
                variant="outlined" 
              />
              <!-- Disable changing warehouse if cart has items to avoid stock mismatch issues? 
                    Or just re-validate. Safer to disable or warn. -->
            </v-col>
            <v-col class="text-right d-none d-md-block" cols="12" md="2">
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
          <CatalogoProductosWidget 
            :warehouse-id="selectedWarehouse"
            @add-to-cart="addToCart" 
          />
        </div>
      </div>

      <!-- Right: Cart -->
      <div class="w-33 h-100 bg-white border-s elevation-2" style="min-width: 350px; max-width: 450px;">
        <CarritoWidget
          v-model="cart"
          :cliente="selectedClient"
          :is-edit="isEdit"
          :order-id="initialOrder?.id"
          :warehouse-id="selectedWarehouse"
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
