<script setup>
  import { useMutation } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import AsyncImage from '@/components/common/AsyncImage.vue';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { createPedido, updatePedido } from '@/services/pedidos.service';
  import { useAuthStore } from '@/stores/auth';

  const props = defineProps({
    modelValue: {
      type: Array, // Cart items
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
  const estadoPedido = ref('Completado');
  
  // Computed Totals
  const subtotal = computed(() => {
    return props.modelValue.reduce((acc, item) => acc + (Number(item.precio_historico || item.precio_unitario) * item.cantidad), 0);
  });

  const total = computed(() => subtotal.value);

  function formatCurrency (amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Update Quantity
  function updateQuantity (index, delta) {
    const newItems = [...props.modelValue];
    const item = newItems[index];
    const newQuantity = item.cantidad + delta;

    if (newQuantity <= 0) {
      removeItem(index);
      return;
    }

    if (newQuantity > item.stock_actual) {
      showErrorToast(`Solo hay ${item.stock_actual} unidades disponibles`);
      return;
    }

    item.cantidad = newQuantity;
    item.subtotal = item.cantidad * Number(item.precio_historico || item.precio_unitario);
    emit('update:modelValue', newItems);
  }

  function removeItem (index) {
    const newCart = [...props.modelValue];
    newCart.splice(index, 1);
    emit('update:modelValue', newCart);
  }
  
  // Helper to display variant attributes
  function getVariantAttributes(item) {
    if (!item.detalles_filtros || item.detalles_filtros.length === 0) return [];
      
    return item.detalles_filtros.map(df => ({
      label: df.opcion_filtro?.filtro?.nombre_filtro || 'Opción',
      value: df.opcion_filtro?.valor_opcion || df.valor_opcion // Handle both nested and flat if needed
    }));
  }

  // Checkout
  const { mutate: createOrder, isPending: isCreating } = useMutation({
    mutationFn: createPedido,
    onSuccess: (data) => {
      showSuccessToast('Pedido creado exitosamente');
      emit('order-created', data);
      emit('clear-cart');
    },
    onError: (error) => showErrorToast(error.response?.data?.message || 'Error al crear pedido')
  });

  const { mutate: updateOrderObs, isPending: isUpdating } = useMutation({
    mutationFn: (data) => updatePedido(props.orderId, data),
    onSuccess: (data) => {
      showSuccessToast('Pedido actualizado exitosamente');
      emit('order-updated', data);
    },
    onError: (error) => showErrorToast(error.response?.data?.message || 'Error al actualizar pedido')
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

    // Transform content
    const detalles = props.modelValue.map(item => ({
      id_producto: item.id_producto, // Parent ID
      id_variante: item.id_variante, // Variant ID (new)
      cantidad: Number(item.cantidad),
      precio_historico: Number(item.precio_unitario || item.precio_historico),
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
          :key="item.cartItemId || index"
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
            <div class="d-flex align-center mt-1">
              <span class="mr-2">{{ formatCurrency(item.precio_historico || item.precio_unitario) }}</span>
              <v-chip v-if="item.sku" class="mr-1" size="x-small" variant="outlined">{{ item.sku }}</v-chip>
            </div>
          </v-list-item-subtitle>
          
          <!-- Variant Attributes Display -->
          <div v-if="getVariantAttributes(item).length > 0" class="mt-2 text-caption">
            <v-chip 
              v-for="(attr, i) in getVariantAttributes(item)" 
              :key="i"
              class="mr-1 mb-1"
              color="secondary"
              size="x-small"
              variant="tonal"
            >
              {{ attr.label }}: {{ attr.value }}
            </v-chip>
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

    <!-- Footer -->
    <div class="pa-4 border-t bg-grey-lighten-4 mt-auto">
      <v-row class="mb-2" dense>
        <v-col><div class="text-subtitle-2 text-medium-emphasis">Subtotal</div></v-col>
        <v-col class="text-right"><div class="text-subtitle-2 font-weight-bold">{{ formatCurrency(subtotal) }}</div></v-col>
      </v-row>
      <v-divider class="mb-3" />
      <v-row class="mb-4" dense>
        <v-col><div class="text-h6 font-weight-black">TOTAL</div></v-col>
        <v-col class="text-right"><div class="text-h5 font-weight-black text-primary">{{ formatCurrency(total) }}</div></v-col>
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
