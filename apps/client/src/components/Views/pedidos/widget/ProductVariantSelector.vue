<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title>
        <span class="text-h5">Seleccionar Detalles</span>
      </v-card-title>
      <v-card-text>
        <div class="mb-4">
          <p class="text-body-1 font-weight-bold">{{ product?.nombre_producto }}</p>
          <p class="text-caption">{{ product?.subcategoria?.nombre_subcategoria }}</p>
        </div>

        <div v-if="loading" class="d-flex justify-center my-4">
          <v-progress-circular color="primary" indeterminate />
        </div>

        <div v-else-if="availableFilters.length > 0">
          <v-row>
            <v-col v-for="filtro in availableFilters" :key="filtro.id" cols="12">
              <v-select
                v-model="selectedOptions[filtro.nombre_filtro]"
                density="comfortable"
                item-title="nombre_opcion"
                item-value="nombre_opcion"
                :items="filtro.opciones"
                :label="filtro.nombre_filtro"
                :rules="[v => !!v || 'Este campo es requerido']"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </div>
        <div v-else class="text-center py-4 text-medium-emphasis">
          No hay opciones disponibles para este producto.
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="blue-darken-1" variant="text" @click="close">Cancelar</v-btn>
        <v-btn color="blue-darken-1" :disabled="!isValid" variant="text" @click="confirm">Agregar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { computed, ref, watch } from 'vue';
  import { getFiltrosBySubcategoria } from '@/services/filtros.service';

  const props = defineProps({
    modelValue: Boolean,
    product: Object
  });

  const emit = defineEmits(['update:modelValue', 'confirm']);

  const dialog = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  });

  const selectedOptions = ref({});
  const availableFilters = ref([]);

  // Fetch filters based on product subcategory
  const { data: filtrosData, isLoading: loading, refetch } = useQuery({
    queryKey: ['filtros-subcategoria', props.product?.id_subcategoria],
    queryFn: () => getFiltrosBySubcategoria(props.product?.id_subcategoria),
    enabled: false // Trigger manually
  });

  watch(() => props.modelValue, async (val) => {
    if (val && props.product?.id_subcategoria) {
      // Reset selection
      selectedOptions.value = {};
        
      // Fetch available filters
      const res = await refetch();
      if (res.data?.data) {
        // Transform data if necessary, assuming structure:
        // [{ id, nombre_filtro, opciones_filtro: [{ id, nombre_opcion }] }]
        // Or if flattened. Adjust based on actual API response structure.
        // Based on service it returns filtros with nested options probably.
        availableFilters.value = res.data.data;
            
        // Pre-fill if product has default values?
        // User wants to CHOOSE. But if product represents a specific SKU with fixed traits, maybe pre-select.
        // Current model: Product has detalles_filtros which are specific choices.
        // If user wants to choose ANOTHER one, it implies the product record is generic?
        // Or maybe they just want to CONFIRM.
        // Let's pre-fill from product.detalles_filtros if matches matches available options.
        if (props.product.detalles_filtros) {
          for (const df of props.product.detalles_filtros) {
            if (df.opcion_filtro && df.opcion_filtro.filtro) {
              selectedOptions.value[df.opcion_filtro.filtro.nombre_filtro] = df.opcion_filtro.nombre_opcion;
            }
          }
        }
      }
    }
  });

  const isValid = computed(() => {
    if (availableFilters.value.length === 0) return true;
    // Check if all displayed filters have a selected value
    return availableFilters.value.every(f => !!selectedOptions.value[f.nombre_filtro]);
  });

  function close () {
    dialog.value = false;
  }

  function confirm () {
    emit('confirm', { ...props.product, detalles_producto: { ...selectedOptions.value } });
    close();
  }
</script>
