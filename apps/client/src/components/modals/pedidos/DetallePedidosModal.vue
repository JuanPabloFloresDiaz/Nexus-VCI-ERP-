<script setup>
  import { computed } from 'vue';
  import AsyncImage from '@/components/common/AsyncImage.vue';

  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false
    },
    pedido: {
      type: Object,
      default: null
    }
  });

  const emit = defineEmits(['update:modelValue']);

  const show = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  });

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function parseDetails (details) {
    if (!details) return {};
    if (typeof details === 'object') return details;
    try {
      return JSON.parse(details);
    } catch (error) {
      console.error('Error parsing details:', error);
      return {};
    }
  }
</script>

<template>
  <v-dialog v-model="show" max-width="900" scrollable>
    <v-card v-if="pedido">
      <v-card-title class="d-flex justify-space-between align-center bg-primary text-white pa-4">
        <span class="text-h6">Detalles del Pedido #{{ pedido.id.substring(0, 8) }}</span>
        <v-btn icon="mdi-close" size="small" variant="text" @click="show = false" />
      </v-card-title>
            
      <v-card-text class="pa-4 bg-grey-lighten-5">
        <!-- Info Grid -->
        <v-row>
          <v-col cols="12" md="6">
            <v-card class="mb-4" elevation="1">
              <v-card-title class="text-subtitle-1 font-weight-bold">Información del Cliente</v-card-title>
              <v-card-text>
                <div class="d-flex flex-column gap-1">
                  <div><strong>Nombre:</strong> {{ pedido.cliente?.nombre_cliente }} {{ pedido.cliente?.apellido_cliente }}</div>
                  <div><strong>Correo:</strong> {{ pedido.cliente?.correo_cliente || 'N/A' }}</div>
                  <div><strong>Teléfono:</strong> {{ pedido.cliente?.telefono_cliente || 'N/A' }}</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card class="mb-4" elevation="1" height="100%">
              <v-card-title class="text-subtitle-1 font-weight-bold">Información del Pedido</v-card-title>
              <v-card-text>
                <div class="d-flex flex-column gap-1">
                  <div><strong>Estado:</strong> 
                    <v-chip 
                      class="ml-2" 
                      :color="pedido.estado_pedido === 'Completado' ? 'success' : pedido.estado_pedido === 'Cancelado' ? 'error' : 'warning'"
                      size="small"
                    >
                      {{ pedido.estado_pedido }}
                    </v-chip>
                  </div>
                  <div><strong>Fecha:</strong> {{ formatDate(pedido.created_at) }}</div>
                  <div><strong>Vendedor:</strong> {{ pedido.usuario_creador?.nombre_usuario || 'Desconocido' }}</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Products Table -->
        <v-card elevation="1">
          <v-card-title class="text-subtitle-2 px-4 py-2 bg-grey-lighten-3 border-b">Productos</v-card-title>
          <v-table density="compact">
            <thead>
              <tr>
                <th>Producto</th>
                <th class="text-right">Precio</th>
                <th class="text-center">Cant.</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="detalle in pedido.detalles" :key="detalle.id">
                <td class="py-2">
                  <div class="d-flex align-center">
                    <div class="mr-3 rounded border bg-grey-lighten-4 overflow-hidden" style="width: 48px; height: 48px; min-width: 48px;">
                      <AsyncImage 
                        :alt="detalle.producto?.nombre_producto"
                        cover
                        height="48"
                        :icon-size="20"
                        :src="detalle.producto?.imagen_url"
                      />
                    </div>
                    <div>
                      <div class="font-weight-medium text-body-2">{{ detalle.producto?.nombre_producto || 'Producto Eliminado' }}</div>
                      <!-- Specs -->
                      <div v-if="parseDetails(detalle.detalles_producto) && Object.keys(parseDetails(detalle.detalles_producto)).length > 0" class="mt-1 d-flex flex-wrap">
                        <v-chip 
                          v-for="(val, key) in parseDetails(detalle.detalles_producto)" 
                          :key="key"
                          class="mr-1 mb-1"
                          density="comfortable"
                          size="x-small"
                          variant="outlined"
                        >
                          <strong class="mr-1">{{ key }}:</strong> {{ val }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="text-right">{{ formatCurrency(detalle.precio_historico) }}</td>
                <td class="text-center">{{ detalle.cantidad }}</td>
                <td class="text-right font-weight-bold">{{ formatCurrency(detalle.subtotal) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="text-right font-weight-bold text-h6 pt-4" colspan="3">TOTAL</td>
                <td class="text-right font-weight-bold text-h6 pt-4 text-primary">{{ formatCurrency(pedido.total_pedido) }}</td>
              </tr>
            </tfoot>
          </v-table>
        </v-card>
      </v-card-text>
            
      <v-divider />
            
      <v-card-actions class="pa-4 bg-white">
        <v-spacer />
        <v-btn color="primary" variant="tonal" @click="show = false">Cerrar</v-btn>
        <!-- Add Print Button maybe? -->
        <v-btn class="ml-2" color="secondary" prepend-icon="mdi-printer" variant="flat">Imprimir</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
