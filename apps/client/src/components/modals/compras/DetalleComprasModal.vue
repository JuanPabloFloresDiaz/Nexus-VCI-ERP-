<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { computed } from 'vue';
  import { getCompraById } from '@/services/compras.service';

  const props = defineProps({
    modelValue: Boolean,
    compra: {
      type: Object,
      required: true
    }
  });

  const emit = defineEmits(['update:modelValue']);

  const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  });

  // Fetch full details including products
  const { data, isLoading } = useQuery({
    queryKey: ['compra-detail', props.compra.id],
    queryFn: () => getCompraById(props.compra.id),
    enabled: isOpen.value
  });

  const compraData = computed(() => data.value?.data || props.compra);
  const detalles = computed(() => compraData.value.detalles || []);

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }
</script>

<template>
  <v-dialog v-model="isOpen" max-width="900px" scrollable>
    <v-card class="rounded-lg">
      <v-card-title class="d-flex justify-space-between align-center pa-4 bg-primary text-white">
        <span class="text-h6">Detalle de Compra #{{ compraData.id?.substring(0, 8) }}</span>
        <v-btn color="white" icon="mdi-close" variant="text" @click="isOpen = false" />
      </v-card-title>

      <v-card-text class="pa-4" style="max-height: 70vh;">
        <!-- Header Info -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-card class="pa-3 fill-height" variant="outlined">
              <div class="text-subtitle-2 text-medium-emphasis mb-1">Información General</div>
              <div class="d-flex flex-column gap-1">
                <div><strong>Estado:</strong> {{ compraData.estado_compra }}</div>
                <div><strong>Fecha Creación:</strong> {{ formatDate(compraData.created_at) }}</div>
                <div><strong>Fecha Entrega:</strong> {{ formatDate(compraData.fecha_entrega_estimada) }}</div>
                <div><strong>Comprador:</strong> {{ compraData.usuario_comprador?.nombre_usuario || 'N/A' }}</div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card class="pa-3 fill-height" variant="outlined">
              <div class="text-subtitle-2 text-medium-emphasis mb-1">Proveedor</div>
              <div class="d-flex flex-column gap-1">
                <div class="text-h6 text-primary">{{ compraData.proveedor?.nombre_proveedor }}</div>
                <div><strong>Contacto:</strong> {{ compraData.proveedor?.contacto_nombre || 'N/A' }}</div>
                <div><strong>Teléfono:</strong> {{ compraData.proveedor?.telefono_proveedor || 'N/A' }}</div>
                <div><strong>NIT:</strong> {{ compraData.proveedor?.nit_proveedor || 'N/A' }}</div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Products Table -->
        <v-divider class="mb-4" />
        <div class="text-h6 mb-2">Productos</div>
                
        <v-table class="border rounded" density="compact">
          <thead>
            <tr>
              <th class="text-left">Producto</th>
              <th class="text-center">Cantidad</th>
              <th class="text-right">Costo Unitario</th>
              <th class="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td class="text-center pa-4" colspan="4">
                <v-progress-circular color="primary" indeterminate />
              </td>
            </tr>
            <tr v-for="item in detalles" v-else :key="item.id">
              <td>
                <div class="font-weight-medium">{{ item.producto?.nombre_producto }}</div>
                <div class="text-caption text-medium-emphasis">SKU: {{ item.variante?.sku }}</div>
              </td>
              <td class="text-center">{{ item.cantidad }}</td>
              <td class="text-right">{{ formatCurrency(item.precio_costo_historico) }}</td>
              <td class="text-right font-weight-bold">{{ formatCurrency(item.subtotal) }}</td>
            </tr>
          </tbody>
          <tfoot v-if="!isLoading">
            <tr class="bg-grey-lighten-4">
              <td class="text-right font-weight-bold text-h6" colspan="3">TOTAL</td>
              <td class="text-right font-weight-bold text-h6 text-primary">
                {{ formatCurrency(compraData.total_compra) }}
              </td>
            </tr>
          </tfoot>
        </v-table>
      </v-card-text>

      <v-card-actions class="pa-4 border-t">
        <v-spacer />
        <v-btn color="primary" variant="tonal" @click="isOpen = false">
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
