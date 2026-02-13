<script setup>
  import { useMutation } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import AsyncImage from '@/components/common/AsyncImage.vue';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { createPedido } from '@/services/pedidos.service';
  // Update Order
  import { updatePedido } from '@/services/pedidos.service';

  import { useAuthStore } from '@/stores/auth';

  const props = defineProps({
    modelValue: {
      type: Array, // Cart items: [{ id_producto, nombre_producto, cantidad, precio_historico, subtotal, stock_actual, detalles_producto }]
      default: () => []
    },
    cliente: {
      type: Object,
      default: null
    },
    orderId: {
      type: String,
      default: null
    },
    isEdit: {
      type: Boolean,
      default: false
    }
  });

  const emit = defineEmits(['update:modelValue', 'order-created', 'order-updated', 'clear-cart', 'clear-client']);

  const authStore = useAuthStore();
  const estadoPedido = ref('Completado'); // Default status as per user request
  const loading = ref(false);

  // Computed Totals
  const subtotal = computed(() => {
    return props.modelValue.reduce((acc, item) => acc + (Number(item.precio_historico || item.precio_unitario) * item.cantidad), 0);
  });

  const total = computed(() => subtotal.value); // Add tax logic here if needed later

  // Helper format
  function formatCurrency (amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Item Actions
  function updateQuantity (index, delta) {
    const newItems = [...props.modelValue];
    const item = newItems[index];
    const newQuantity = item.cantidad + delta;

    if (newQuantity <= 0) {
      removeItem(index);
      return;
    }

    if (newQuantity > item.stock_actual) {
      showErrorToast(`Solo hay ${item.stock_actual} unidades disponibles de ${item.nombre_producto}`);
      return;
    }

    item.cantidad = newQuantity;
    item.subtotal = item.cantidad * Number(item.precio_historico || item.precio_unitario);
    emit('update:modelValue', newItems);
  }

  // Group details by Filter Name
  // item.detalles_filtros = [{ opcion_filtro: { valor_opcion: 'X', filtro: { nombre_filtro: 'Y' } } }]
  function getAvailableVariants (item) {
    const groups = {};
    if (item.detalles_filtros) {
      for (const df of item.detalles_filtros) {
        if (df.opcion_filtro && df.opcion_filtro.filtro) {
          const fName = df.opcion_filtro.filtro.nombre_filtro;
          const oValue = df.opcion_filtro.valor_opcion;
                
          if (!groups[fName]) {
            groups[fName] = { options: [] };
          }
          if (!groups[fName].options.includes(oValue)) {
            groups[fName].options.push(oValue);
          }
        }
      }
    }
    return groups;
  }

  function removeItem (id) {
    // Use index or unique ID if possible, but here we might have duplicates by ID.
    // The parent uses v-model "cart", so we emit 'update:modelValue' is not enough if we mutate prop.
    // We should emit an event or splice the prop if it's a ref passed down? 
    // Checks addToCart uses "cart.value.push".
    // Here props.modelValue is array.
    // If we want to remove specific generic item, we need a unique key.
    // I added 'cartItemId' in CreatePedidosView. Let's use it if available, else fallback to index.
     
    // Actually, let's find index.
    const index = props.modelValue.findIndex(i => i.cartItemId === id || i.id === id); // Fallback
    if (index !== -1) {
      const newCart = [...props.modelValue];
      newCart.splice(index, 1);
      emit('update:modelValue', newCart);
    }
  }

  // Checkout
  const { mutate: createOrder, isPending: isCreating } = useMutation({
    mutationFn: createPedido,
    onSuccess: (data) => {
      showSuccessToast('Pedido creado exitosamente');
      emit('order-created', data);
      emit('clear-cart');
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.message || 'Error al crear el pedido');
    }
  }); // Ensure this is imported or added to service

  const { mutate: updateOrderObs, isPending: isUpdating } = useMutation({
    mutationFn: (data) => updatePedido(props.orderId, data),
    onSuccess: (data) => {
      showSuccessToast('Pedido actualizado exitosamente');
      emit('order-updated', data);
      // Do not clear cart immediately? Or redirect? handled by parent.
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.message || 'Error al actualizar el pedido');
    }
  });

  const isPending = computed(() => isCreating.value || isUpdating.value);

  function checkout () {
    if (!props.cliente) {
      showErrorToast('Debe seleccionar un cliente primero');
      return;
    }
    if (props.modelValue.length === 0) {
      showErrorToast('El carrito está vacío');
      return;
    }

    // Transform cart items to API detail structure
    const detalles = props.modelValue.map(item => ({
      id_producto: item.id_producto || item.id, // Handle both if raw product pushed
      cantidad: Number(item.cantidad),
      precio_historico: Number(item.precio_unitario || item.precio_historico), // normalize and ensure number
      detalles_producto: item.detalles_producto || {} // Standardize
    }));

    const payload = {
      id_cliente: props.cliente.id,
      id_usuario_creador: authStore.user.id,
      detalles,
      estado_pedido: estadoPedido.value
    };
   
    if (props.isEdit && props.orderId) {
      updateOrderObs(payload);
    } else {
      createOrder(payload);
    }
  }
</script>

<template>
  <div class="d-flex flex-column h-100 bg-white border-s">
    <!-- Header -->
    <div class="pa-4 border-b bg-grey-lighten-4">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="text-h6 font-weight-bold">
          <v-icon start>mdi-cart</v-icon>
          Carrito
        </div>
        <v-chip color="primary" size="small" variant="flat">
          {{ modelValue.length }} items
        </v-chip>
      </div>
            
      <div v-if="cliente" class="d-flex align-center pa-2 bg-white rounded border">
        <v-avatar class="mr-2" color="primary" size="32">
          <span class="text-caption text-white">{{ cliente.nombre_cliente.charAt(0) }}</span>
        </v-avatar>
        <div class="text-truncate">
          <div class="text-subtitle-2 font-weight-bold">{{ cliente.nombre_cliente }} {{ cliente.apellido_cliente }}</div>
          <div class="text-caption text-medium-emphasis">{{ cliente.nit_cliente || 'CF' }}</div>
        </div>
        <v-spacer />
        <v-btn icon="mdi-close" size="x-small" variant="text" @click="$emit('clear-client')" />
      </div>
      <div v-else class="pa-2 border rounded border-dashed text-center text-medium-emphasis bg-grey-lighten-5">
        <v-icon class="mb-1">mdi-account-plus-outline</v-icon>
        <div class="text-caption">Seleccione un cliente</div>
      </div>
    </div>

    <!-- Items List -->
    <div class="flex-grow-1 overflow-y-auto pa-2">
      <div v-if="modelValue.length === 0" class="d-flex flex-column align-center justify-center h-100 text-medium-emphasis">
        <v-icon class="mb-2 opacity-50" size="48">mdi-cart-off</v-icon>
        <div class="text-body-2">El carrito está vacío</div>
      </div>

      <v-list v-else bg-color="transparent">
        <v-list-item
          v-for="(item, index) in modelValue"
          :key="index"
          class="mb-2 bg-white border rounded elevation-1"
          lines="two"
        >
          <template #prepend>
            <div class="mr-4 rounded-lg overflow-hidden border bg-grey-lighten-4" style="width: 64px; height: 64px;">
              <AsyncImage
                :alt="item.nombre_producto"
                cover
                height="64"
                :icon-size="24"
                :src="item.imagen_url"
              />
            </div>
          </template>

          <v-list-item-title class="font-weight-bold text-subtitle-2">
            {{ item.nombre_producto }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ formatCurrency(item.precio_historico || item.precio_unitario) }} x {{ item.cantidad }}
          </v-list-item-subtitle>
          <!-- Variant Selection -->
          <div v-if="item.detalles_filtros && item.detalles_filtros.length > 0" class="mt-2">
            <!-- 
                            Group filters by filter definition (id_filtro). 
                            If a product has multiple options for "Color", show them.
                            If it has only one option for "Color", show it as read-only or pre-selected?
                            User said: "es solo las opciones que tiene disponibles el producto... elegir los detalles".
                         -->
            <div v-for="(group, filtroName) in getAvailableVariants(item)" :key="filtroName" class="mb-2">
              <v-select
                v-if="group.options.length > 1"
                v-model="item.detalles_producto[filtroName]"
                bg-color="white"
                class="text-caption"
                density="compact"
                hide-details
                :items="group.options"
                :label="filtroName"
                variant="outlined"
              />
              <div v-else class="d-flex align-center">
                <span class="text-caption font-weight-bold mr-2">{{ filtroName }}:</span>
                <v-chip size="x-small" variant="outlined">{{ group.options[0] }}</v-chip>
                <!-- Auto-select the only option to ensure it saves -->
                <div class="d-none">{{ item.detalles_producto[filtroName] = group.options[0] }}</div>
              </div>
            </div>
          </div>

          <template #append>
            <div class="d-flex flex-column align-end">
              <div class="font-weight-bold text-primary mb-1">
                {{ formatCurrency((item.precio_historico || item.precio_unitario) * item.cantidad) }}
              </div>
              <div class="d-flex align-center">
                <v-btn 
                  density="comfortable" 
                  :disabled="item.cantidad <= 1" 
                  icon="mdi-minus" 
                  size="x-small"
                  variant="tonal"
                  @click="updateQuantity(index, -1)"
                />
                <span class="mx-2 font-weight-bold text-body-2">{{ item.cantidad }}</span>
                <v-btn 
                  color="primary" 
                  density="comfortable" 
                  :disabled="item.cantidad >= item.stock_actual"
                  icon="mdi-plus" 
                  size="x-small"
                  variant="tonal"
                  @click="updateQuantity(index, 1)"
                />
                <v-btn 
                  class="ml-2" 
                  color="error" 
                  icon="mdi-delete" 
                  size="x-small"
                  variant="text"
                  @click="removeItem(index)"
                />
              </div>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </div>

    <!-- Footer / Checkout -->
    <div class="pa-4 border-t bg-grey-lighten-4 mt-auto">
      <v-row class="mb-2" dense>
        <v-col>
          <div class="text-subtitle-2 text-medium-emphasis">Subtotal</div>
        </v-col>
        <v-col class="text-right">
          <div class="text-subtitle-2 font-weight-bold">{{ formatCurrency(subtotal) }}</div>
        </v-col>
      </v-row>
      <v-divider class="mb-3" />
      <v-row class="mb-4" dense>
        <v-col>
          <div class="text-h6 font-weight-black">TOTAL</div>
        </v-col>
        <v-col class="text-right">
          <div class="text-h5 font-weight-black text-primary">{{ formatCurrency(total) }}</div>
        </v-col>
      </v-row>

      <v-select
        v-model="estadoPedido"
        class="mb-3"
        density="compact"
        hide-details
        :items="['Pendiente', 'Completado', 'Cancelado']"
        label="Estado del Pedido"
        variant="outlined"
      />

      <v-btn
        block
        color="primary"
        :disabled="modelValue.length === 0 || !cliente"
        elevation="2"
        :loading="isPending"
        size="large"
        @click="checkout"
      >
        <v-icon start>mdi-check-circle</v-icon>
        {{ isEdit ? 'Actualizar Pedido' : 'Confirmar Pedido' }}
      </v-btn>
    </div>
  </div>
</template>
