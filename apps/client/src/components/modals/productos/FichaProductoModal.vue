<script setup>
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
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  // Fetch Full Details including Variants
  const { data: fullProductData, isLoading } = useQuery({
    queryKey: ['producto-detail', props.producto?.id],
    queryFn: () => getProductoById(props.producto?.id),
    enabled: computed(() => !!isOpen.value && !!props.producto?.id) 
  });

  const fullProduct = computed(() => fullProductData.value?.data || props.producto);

  // Computed Aggregates
  const aggregates = computed(() => {
    if (!fullProduct.value) return {};
    const vars = fullProduct.value.variantes || [];
    if (vars.length === 0) return {
      priceMin: 0, priceMax: 0, stockTotal: 0, costTotal: 0
    };

    const prices = vars.map(v => Number(v.precio_unitario));
    const totalStock = vars.reduce((acc, v) => acc + Number(v.stock_actual), 0);
      
    return {
      priceMin: Math.min(...prices),
      priceMax: Math.max(...prices),
      stockTotal: totalStock
    };
  });

  const priceDisplay = computed(() => {
    const { priceMin, priceMax } = aggregates.value;
    if (priceMin === priceMax) return formatCurrency(priceMin);
    return `${formatCurrency(priceMin)} - ${formatCurrency(priceMax)}`;
  });

  // Financials across ALL variants
  const stockFinancials = computed(() => {
    if (!fullProduct.value || !fullProduct.value.variantes) return {};
    
    // Aggregate financials
    let inversionTotal = 0;
    let ingresoTotalPotencial = 0;
    
    for (const v of fullProduct.value.variantes) {
      const cost = Number(v.costo_unitario) || 0;
      const price = Number(v.precio_unitario) || 0;
      const stock = Number(v.stock_actual) || 0;

      inversionTotal += cost * stock;
      ingresoTotalPotencial += price * stock;
    }

    const utilidadTotalPotencial = ingresoTotalPotencial - inversionTotal;
    const margenGeneral = ingresoTotalPotencial > 0 ? (utilidadTotalPotencial / ingresoTotalPotencial) * 100 : 0;

    return {
      inversionTotal,
      ingresoTotalPotencial,
      utilidadTotalPotencial,
      margenGeneral
    };
  });

  function getVariantName(variant) {
    if (!variant.detalles_filtros || variant.detalles_filtros.length === 0) return 'Estándar';
    return variant.detalles_filtros.map(d => {
      return `${d.opcion_filtro?.filtro?.nombre_filtro}: ${d.opcion_filtro?.valor_opcion}`;
    }).join(', ');
  }

  const financialConclusion = computed(() => {
    const margin = stockFinancials.value.margenGeneral || 0;
    const utility = stockFinancials.value.utilidadTotalPotencial || 0;
    
    if (margin >= 50) {
      return {
        text: 'Este producto ofrece un excelente margen de rentabilidad (>50%). Se recomienda mantener niveles óptimos de stock para maximizar la utilidad.',
        color: 'success'
      };
    } else if (margin >= 25) {
      return {
        text: 'El producto tiene un margen saludable. Vigilar la rotación de inventario para asegurar que se cumplan las metas de utilidad.',
        color: 'info'
      };
    } else if (margin > 0) {
      return {
        text: 'El margen es bajo (<25%). Se sugiere evaluar estrategias para reducir costos o aumentar volumen de ventas para justificar la inversión.',
        color: 'warning'
      };
    } else {
      return {
        text: 'Alerta: El producto no parece ser rentable actualmente. Revisar costos y precios inmediatamente.',
        color: 'error'
      };
    }
  });

  const glossaryTerms = [
    { title: 'Inversión Total', definition: 'Costo total acumulado del inventario actual.' },
    { title: 'Ingreso Potencial', definition: 'Ingresos estimados si se vende todo el stock actual al precio de lista.' },
    { title: 'Utilidad Potencial', definition: 'Ganancia neta esperada (Ingreso Potencial - Inversión Total).' },
    { title: 'Margen General', definition: 'Porcentaje de ganancia sobre el ingreso total proyectado.' },
    { title: 'Punto de Equilibrio', definition: 'Cantidad de unidades que se deben vender para recuperar la inversión inicial.' }
  ];

</script>

<template>
  <v-dialog v-model="isOpen" max-width="900px" scrollable>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Ficha de Producto</span>
        <v-btn icon="mdi-close" size="small" variant="text" @click="isOpen = false" />
      </v-card-title>
            
      <v-divider />

      <v-card-text class="pa-0" style="max-height: 80vh; overflow-y: auto;">
        <div v-if="isLoading" class="d-flex justify-center py-8">
          <v-progress-circular color="primary" indeterminate />
        </div>
                
        <v-container v-else-if="fullProduct" fluid>
          <v-row>
            <!-- Image Column -->
            <v-col class="d-flex justify-center" cols="12" md="4">
              <AsyncAvatar
                class="elevation-2"
                :name="fullProduct.nombre_producto"
                rounded="lg"
                size="200"
                :src="fullProduct.imagen_url"
              />
            </v-col>
                        
            <!-- Info Column -->
            <v-col cols="12" md="8">
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
                  <div class="text-caption text-medium-emphasis">Rango de Precios</div>
                  <div class="text-h6 font-weight-bold">
                    {{ priceDisplay }}
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Stock Total</div>
                  <div class="text-h6 font-weight-bold text-success">
                    {{ aggregates.stockTotal }} Unidades
                  </div>
                </v-col>
                <v-col class="mt-2" cols="6">
                  <div class="text-caption text-medium-emphasis">Inversión Total en Stock</div>
                  <div class="text-h6 font-weight-bold">
                    {{ formatCurrency(stockFinancials.inversionTotal) }}
                  </div>
                </v-col>
              </v-row>

              <!-- Financial Analysis Accordion -->
              <v-expansion-panels class="mb-4">
                <v-expansion-panel bg-color="white" elevation="1">
                  <v-expansion-panel-title class="text-white" color="info">
                    <div class="d-flex align-center">
                      <v-icon class="mr-2" color="white">mdi-chart-line</v-icon>
                      <span class="font-weight-bold text-subtitle-2">Análisis de Rentabilidad</span>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text class="pt-4">
                    
                    <!-- Global Analysis -->
                    <div class="mb-4">
                      <div class="text-overline text-medium-emphasis mb-2">Consolidado Global</div>
                      <v-row dense>
                        <v-col cols="6" md="3">
                          <div class="text-caption font-weight-bold">Inversión Total</div>
                          <div class="text-body-2">{{ formatCurrency(stockFinancials.inversionTotal) }}</div>
                        </v-col>
                        <v-col cols="6" md="3">
                          <div class="text-caption font-weight-bold">Ingreso Potencial</div>
                          <div class="text-body-2">{{ formatCurrency(stockFinancials.ingresoTotalPotencial) }}</div>
                        </v-col>
                        <v-col cols="6" md="3">
                          <div class="text-caption font-weight-bold">Utilidad Potencial</div>
                          <div class="text-body-2 text-success font-weight-bold">{{ formatCurrency(stockFinancials.utilidadTotalPotencial) }}</div>
                        </v-col>
                        <v-col cols="6" md="3">
                          <div class="text-caption font-weight-bold">Margen General</div>
                          <div class="text-body-2">{{ stockFinancials.margenGeneral.toFixed(1) }}%</div>
                        </v-col>
                      </v-row>
                    </div>

                    <v-divider class="mb-4" />

                    <!-- Per Variant Analysis -->
                    <div class="mb-4">
                      <div class="text-overline text-medium-emphasis mb-2">Detalle por Variante</div>
                      <v-table class="text-caption" density="compact">
                        <thead>
                          <tr>
                            <th>Variante</th>
                            <th class="text-right">Margen Unit.</th>
                            <th class="text-right">Inversión</th>
                            <th class="text-right">Utilidad</th>
                            <th class="text-right">Pto. Equilibrio</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="variant in fullProduct.variantes" :key="variant.id">
                            <td class="font-weight-medium">{{ getVariantName(variant) }}</td>
                            <td class="text-right">
                              {{ formatCurrency(Number(variant.precio_unitario) - Number(variant.costo_unitario)) }}
                              <span class="text-medium-emphasis">({{ ((Number(variant.precio_unitario) - Number(variant.costo_unitario)) / Number(variant.precio_unitario) * 100).toFixed(0) }}%)</span>
                            </td>
                            <td class="text-right">{{ formatCurrency(Number(variant.costo_unitario) * Number(variant.stock_actual)) }}</td>
                            <td class="text-right text-success">{{ formatCurrency((Number(variant.precio_unitario) * Number(variant.stock_actual)) - (Number(variant.costo_unitario) * Number(variant.stock_actual))) }}</td>
                            <td class="text-right">
                              {{ Number(variant.precio_unitario) > 0 ? Math.ceil((Number(variant.costo_unitario) * Number(variant.stock_actual)) / Number(variant.precio_unitario)) : 0 }} u.
                            </td>
                          </tr>
                        </tbody>
                      </v-table>
                    </div>

                    <!-- Analysis Conclusion -->
                    <v-alert
                      border="start"
                      class="mb-4 text-caption"
                      :color="financialConclusion.color"
                      variant="tonal"
                    >
                      <div class="font-weight-bold mb-1">Conclusión del Análisis</div>
                      {{ financialConclusion.text }}
                    </v-alert>

                    <!-- Glossary Carousel -->
                    <div class="bg-grey-lighten-4 rounded pa-2">
                      <div class="text-caption font-weight-bold text-center text-medium-emphasis mb-1">Glosario de Términos (Desliza para ver más)</div>
                      <v-carousel
                        cycle
                        height="80"
                        hide-delimiters
                        show-arrows="hover"
                        :show-arrows="false"
                      >
                        <v-carousel-item v-for="(term, i) in glossaryTerms" :key="i">
                          <div class="d-flex flex-column align-center justify-center h-100 text-center px-4">
                            <div class="text-subtitle-2 text-primary font-weight-bold">{{ term.title }}</div>
                            <div class="text-caption">{{ term.definition }}</div>
                          </div>
                        </v-carousel-item>
                      </v-carousel>
                    </div>

                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
            
            <!-- Variants Table Section -->
            <v-col cols="12">
              <div class="text-h6 font-weight-bold mb-2 px-2">Variantes y Existencias</div>
              <v-table class="border rounded" density="compact" hover>
                <thead>
                  <tr>
                    <th class="text-left">Variante</th>
                    <th class="text-left">SKU</th>
                    <th class="text-right">Costo</th>
                    <th class="text-right">Precio</th>
                    <th class="text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="variant in fullProduct.variantes" :key="variant.id">
                    <td>
                      <div class="font-weight-medium">{{ getVariantName(variant) }}</div>
                    </td>
                    <td class="text-medium-emphasis">{{ variant.sku || '-' }}</td>
                    <td class="text-right">{{ formatCurrency(variant.costo_unitario) }}</td>
                    <td class="text-right">{{ formatCurrency(variant.precio_unitario) }}</td>
                    <td class="text-right">
                      <v-chip :color="variant.stock_actual <= (variant.stock_minimo || 5) ? 'error' : 'success'" size="x-small" variant="flat">
                        {{ variant.stock_actual }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-col>

          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
