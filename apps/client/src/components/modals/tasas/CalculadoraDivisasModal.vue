<script setup>
  import { computed, ref } from 'vue';
  import { useQuery } from '@tanstack/vue-query';
  import { getDivisasList } from '@/services/divisas.service';
  import { getTasasCambio } from '@/services/tasasCambio.service';

  const props = defineProps({
    modelValue: Boolean
  });

  const emit = defineEmits(['update:modelValue']);

  // Obtener Divisas
  const { data: divisasData } = useQuery({
    queryKey: ['divisas', 'select'],
    queryFn: getDivisasList,
    staleTime: 5 * 60 * 1000
  });
  const divisas = computed(() => divisasData.value?.data || []);

  // Obtener Tasas
  const { data: tasasData } = useQuery({
    queryKey: ['tasas-cambio', { limit: 1000 }],
    queryFn: () => getTasasCambio({ limit: 1000 }),
    staleTime: 5 * 60 * 1000
  });
  const tasas = computed(() => tasasData.value?.data || []);

  const amount = ref(1);
  const selectedDivisa = ref('USD');

  const conversions = computed(() => {
    if (!tasas.value.length || !amount.value || !selectedDivisa.value) return [];
    
    let amountInUsd = amount.value;
    
    // Si eligen otra que no es USD, calculamos su valor equivalente en USD primero cruzando la tasa
    if (selectedDivisa.value !== 'USD') {
      const rateToUsd = tasas.value.find(t => t.codigo_iso_destino === selectedDivisa.value && t.codigo_iso_origen === 'USD');
      if (rateToUsd) {
        amountInUsd = amount.value / rateToUsd.tasa_cambio;
      } else {
        return []; 
      }
    }

    const results = [];
    
    tasas.value.forEach(t => {
      if (t.codigo_iso_origen === 'USD') {
         if (t.codigo_iso_destino !== selectedDivisa.value) {
            results.push({
               moneda: t.codigo_iso_destino,
               simbolo: t.divisa_destino?.simbolo || '',
               valor: (amountInUsd * t.tasa_cambio).toFixed(2),
               tasa: t.tasa_cambio
            });
         }
      }
    });

    if (selectedDivisa.value !== 'USD') {
        const usdDivisa = divisas.value.find(d => d.codigo_iso === 'USD');
        results.push({
            moneda: 'USD',
            simbolo: usdDivisa?.simbolo || '$',
            valor: amountInUsd.toFixed(2),
            tasa: 1
        });
    }

    return results;
  });

  function close () {
    emit('update:modelValue', false);
  }
</script>

<template>
  <v-dialog 
    max-width="500px" 
    :model-value="modelValue" 
    @update:model-value="close"
  >
    <v-card>
      <v-toolbar color="secondary" density="compact">
        <v-toolbar-title class="text-h6 font-weight-bold d-flex align-center gap-2">
          <v-icon>mdi-calculator</v-icon>
          Convertidor de Divisas
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-4">
        <p class="text-medium-emphasis text-caption mb-4">
            Ingresa un monto en cualquier divisa registrada para ver la equivalencia al precio de venta en las demás monedas operativas.
        </p>
        <v-row dense class="mb-2">
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="amount"
              density="compact"
              label="Monto"
              type="number"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="selectedDivisa"
              :items="divisas"
              item-title="nombre_divisa"
              item-value="codigo_iso"
              density="compact"
              label="Moneda Origen"
              variant="outlined"
              hide-details
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props" :title="item.raw.codigo_iso + ' - ' + item.raw.nombre_divisa">
                </v-list-item>
              </template>
            </v-autocomplete>
          </v-col>
        </v-row>

        <v-divider class="my-4"></v-divider>

        <div v-if="conversions.length > 0">
           <div class="text-subtitle-2 text-medium-emphasis mb-2">Equivalencias según Tasa de Cambio actual:</div>
           <v-list class="bg-grey-lighten-4 rounded-lg">
             <v-list-item v-for="c in conversions" :key="c.moneda" class="border-b">
                <template #prepend>
                   <v-avatar color="primary" variant="tonal" size="36" class="mr-3 font-weight-bold">
                     {{ c.simbolo }}
                   </v-avatar>
                </template>
                <v-list-item-title class="text-h6 font-weight-bold">{{ c.valor }} {{ c.moneda }}</v-list-item-title>
             </v-list-item>
           </v-list>
        </div>
        <div v-else class="text-center pa-4 text-medium-emphasis">
          <v-icon size="32" class="mb-2" color="grey">mdi-cash-remove</v-icon>
          <div>No hay equivalencias configuradas para esta divisa origen.</div>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn color="primary" variant="text" @click="close">
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.gap-2 { gap: 8px; }
</style>
