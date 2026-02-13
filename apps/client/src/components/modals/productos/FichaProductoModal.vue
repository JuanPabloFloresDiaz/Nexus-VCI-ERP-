<script setup>
  // Since we need to fetch details, let's add logic to fetch on open.
  import { useQuery } from '@tanstack/vue-query';
  import { computed, ref, watch } from 'vue';

  import AsyncAvatar from '@/components/common/AsyncAvatar.vue';
  import { getProductoById } from '@/services/productos.service';

  import { calculateFinancials } from '@/utils/financialCalculations';

  const props = defineProps({
    modelValue: Boolean,
    producto: Object
  });

  const emit = defineEmits(['update:modelValue']);

  const isOpen = ref(props.modelValue);

  watch(() => props.modelValue, (val) => {
    isOpen.value = val;
  });

  watch(isOpen, (val) => {
    emit('update:modelValue', val);
  });

  function formatCurrency (value) {
    if (!value) return '';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  // Computed Attributes List
  const attributes = computed(() => {
    if (!props.producto?.detalles_filtros) return [];
    
    // Group by Filter Name? usually they are distinct.
    // detail: { id, opcion_filtro: { valor_opcion, filtro: { nombre_filtro } } }
    // Note: getProductoById from controller includes details->opcion->filtro.
    // Can we trust props.producto has this structure?
    // If props.producto comes from the TABLE list, it typically DOES NOT have deep nested details.
    // So usually we fetch details when opening the modal OR assume the list view included them.
    // BUT list view is optimized.
    // Strategy: Fetch full details if needed?
    // Or assume the parent component fetches it?
    // Let's check `ProductosEmpresaView`. It calls `getProductos` (index).
    // `ProductosController.index` DOES NOT include `detalles_filtros`.
    // So `props.producto` passed here will be incomplete (missing attributes).
    
    // We MUST fetch full details here.
    return []; 
  });

  const { data: fullProductData, isLoading } = useQuery({
    queryKey: ['producto-detail', props.producto?.id],
    queryFn: () => getProductoById(props.producto?.id),
    enabled: computed(() => !!isOpen.value && !!props.producto?.id) // only fetch when open
  });

  const fullProduct = computed(() => fullProductData.value?.data || props.producto);

  const detailsList = computed(() => {
    if (!fullProduct.value?.detalles_filtros) return [];
    
    return fullProduct.value.detalles_filtros.map(d => ({
      filtro: d.opcion_filtro?.filtro?.nombre_filtro || 'Especificación',
      opcion: d.opcion_filtro?.valor_opcion || '?'
    }));
  });

  const stockFinancials = computed(() => {
    if (!fullProduct.value) return {};
    return calculateFinancials(
      fullProduct.value.precio_unitario,
      fullProduct.value.costo_unitario,
      fullProduct.value.stock_actual,
      fullProduct.value.stock_inicial // Pass Initial Stock
    );
  });

</script>

<template>
  <v-dialog v-model="isOpen" max-width="800px" scrollable>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Ficha de Producto</span>
        <v-btn icon="mdi-close" size="small" variant="text" @click="isOpen = false" />
      </v-card-title>
            
      <v-divider />

      <v-card-text class="pa-0" style="max-height: 70vh; overflow-y: auto;">
        <div v-if="isLoading" class="d-flex justify-center py-8">
          <v-progress-circular color="primary" indeterminate />
        </div>
                
        <v-container v-else-if="fullProduct" fluid>
          <v-row>
            <!-- Image Column -->
            <v-col class="d-flex justify-center" cols="12" md="5">
              <AsyncAvatar
                class="elevation-2"
                :name="fullProduct.nombre_producto"
                rounded="lg"
                size="250"
                :src="fullProduct.imagen_url"
              />
            </v-col>
                        
            <!-- Info Column -->
            <v-col cols="12" md="7">
              <div class="text-h5 font-weight-bold text-primary mb-1">
                {{ fullProduct.nombre_producto }}
              </div>
              <v-chip class="mb-4" color="secondary" size="small" variant="flat">
                {{ fullProduct.subcategoria?.nombre_subcategoria || 'Sin Categoría' }}
              </v-chip>

              <div class="text-body-1 mb-4">
                {{ fullProduct.descripcion_producto }}
              </div>

              <v-divider class="mb-4" />

              <v-row class="mb-4" dense>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Precio</div>
                  <div class="text-h6 font-weight-bold">
                    {{ formatCurrency(fullProduct.precio_unitario) }}
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Costo</div>
                  <div class="text-h6 font-weight-bold text-medium-emphasis">
                    {{ formatCurrency(fullProduct.costo_unitario || 0) }}
                  </div>
                </v-col>
                <v-col class="mt-2" cols="6">
                  <div class="text-caption text-medium-emphasis">Stock Disponible</div>
                  <div :class="['text-h6 font-weight-bold', fullProduct.stock_actual <= fullProduct.stock_minimo ? 'text-error' : 'text-success']">
                    {{ fullProduct.stock_actual }} Unidades
                  </div>
                </v-col>
                <v-col class="mt-2" cols="6">
                  <div class="text-caption text-medium-emphasis">Inversión en Stock</div>
                  <div class="text-h6 font-weight-bold">
                    {{ formatCurrency(stockFinancials.inversionTotal) }}
                  </div>
                </v-col>
              </v-row>

              <!-- Financial Analysis -->
              <v-card class="mb-4 pa-3" color="info" variant="tonal">
                <div class="text-subtitle-2 font-weight-bold mb-2">Análisis de Rentabilidad (Lote Completo)</div>
                <v-row dense>
                  <v-col cols="6" md="4">
                    <div class="text-caption font-weight-bold">Margen Unitario</div>
                    <div>{{ formatCurrency(stockFinancials.margenUnitario) }} ({{ stockFinancials.margenPorcentaje.toFixed(1) }}%)</div>
                  </v-col>
                  <v-col cols="6" md="4">
                    <div class="text-caption font-weight-bold">Ingreso Potencial (Total)</div>
                    <div>{{ formatCurrency(stockFinancials.ingresoTotalPotencial) }}</div>
                  </v-col>
                  <v-col cols="6" md="4">
                    <div class="text-caption font-weight-bold">Utilidad Potencial</div>
                    <div class="text-success font-weight-bold">{{ formatCurrency(stockFinancials.utilidadTotalPotencial) }}</div>
                  </v-col>
                  <v-col class="mt-2" cols="12">
                    <div class="text-caption font-weight-bold">Punto de Equilibrio (Stock Inicial: {{ stockFinancials.qInicial }})</div>
                    <div class="text-caption">
                      Para recuperar la inversión inicial de <strong>{{ formatCurrency(stockFinancials.inversionTotal) }}</strong>, debes vender:
                      <strong class="text-primary">{{ Math.ceil(stockFinancials.puntoEquilibrioUnidades) }} unidades</strong>
                      (aprox. {{ ((stockFinancials.puntoEquilibrioUnidades / stockFinancials.qInicial) * 100).toFixed(1) }}% del lote)
                    </div>
                  </v-col>
                </v-row>
              </v-card>
                            
              <!-- Attributes Section -->
              <div v-if="detailsList.length > 0">
                <div class="text-subtitle-2 font-weight-bold mb-2">Especificaciones</div>
                <v-table class="border rounded" density="compact">
                  <tbody>
                    <tr v-for="(item, i) in detailsList" :key="i">
                      <td class="text-medium-emphasis font-weight-medium" style="width: 40%">{{ item.filtro }}</td>
                      <td>{{ item.opcion }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
              <div v-else class="text-caption font-italic text-medium-emphasis mt-2">
                No se encontraron especificaciones adicionales.
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
