<script setup>
  import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
  import { computed, ref } from 'vue';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { getDivisasList } from '@/services/divisas.service';
  import { createTasaCambio } from '@/services/tasasCambio.service';

  const props = defineProps({
    modelValue: Boolean
  });

  const emit = defineEmits(['update:modelValue', 'success']);
  const queryClient = useQueryClient();

  const form = ref(null);
  const valid = ref(false);

  const formData = ref({
    codigo_iso_origen: '',
    codigo_iso_destino: '',
    tasa_cambio: null
  });

  // Fetch Divisas for Selects
  const { data: divisasData, isLoading: isLoadingDivisas } = useQuery({
    queryKey: ['divisas', 'select'],
    queryFn: getDivisasList,
    staleTime: 5 * 60 * 1000
  });

  const divisas = computed(() => divisasData.value?.data || []);

  const { mutate, isPending } = useMutation({
    mutationFn: createTasaCambio,
    onSuccess: () => {
      showSuccessToast('Tasa de cambio creada correctamente');
      emit('success');
      close();
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.error || 'Error al crear la tasa de cambio');
    }
  });

  async function handleSubmit () {
    const { valid: isValid } = await form.value.validate();
    if (!isValid) return;

    if (formData.value.codigo_iso_origen === formData.value.codigo_iso_destino) {
      showErrorToast('La divisa origen y destino no pueden ser la misma');
      return;
    }

    mutate({
      codigo_iso_origen: formData.value.codigo_iso_origen,
      codigo_iso_destino: formData.value.codigo_iso_destino,
      tasa_cambio: Number(formData.value.tasa_cambio)
    });
  }

  function resetForm () {
    formData.value = {
      codigo_iso_origen: '',
      codigo_iso_destino: '',
      tasa_cambio: null
    };
    if (form.value) form.value.resetValidation();
  }

  function close () {
    emit('update:modelValue', false);
    resetForm();
  }

  // Rules
  const isoRules = [
    v => !!v || 'Debes seleccionar una divisa'
  ];

  const rateRules = [
    v => !!v || 'La tasa de cambio es obligatoria',
    v => (!isNaN(v) && Number(v) > 0) || 'Debe ser un número mayor a 0'
  ];

</script>

<template>
  <v-dialog 
    max-width="500px" 
    :model-value="modelValue" 
    persistent
    @update:model-value="close"
  >
    <v-card>
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-h6 font-weight-bold">
          Nueva Tasa de Cambio
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-4">
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <v-row dense>
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.codigo_iso_origen"
                density="compact"
                hide-no-data
                item-title="nombre_divisa"
                item-value="codigo_iso"
                :items="divisas"
                label="Divisa Origen *"
                :loading="isLoadingDivisas"
                prepend-inner-icon="mdi-cash-fast"
                :rules="isoRules"
                variant="outlined"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :subtitle="item.raw.codigo_iso" :title="item.raw.nombre_divisa">
                    <template #prepend>
                      <v-avatar color="primary" size="32" variant="tonal">
                        {{ item.raw.simbolo }}
                      </v-avatar>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.codigo_iso_destino"
                density="compact"
                hide-no-data
                item-title="nombre_divisa"
                item-value="codigo_iso"
                :items="divisas"
                label="Divisa Destino *"
                :loading="isLoadingDivisas"
                prepend-inner-icon="mdi-cash-multiple"
                :rules="isoRules"
                variant="outlined"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :subtitle="item.raw.codigo_iso" :title="item.raw.nombre_divisa">
                    <template #prepend>
                      <v-avatar color="primary" size="32" variant="tonal">
                        {{ item.raw.simbolo }}
                      </v-avatar>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.tasa_cambio"
                density="compact"
                label="Tasa de Cambio (Ej. 1 Origen = X Destino) *"
                placeholder="7.80"
                prepend-inner-icon="mdi-swap-horizontal"
                :rules="rateRules"
                type="number"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-form>
        <small class="text-caption text-medium-emphasis">* Campos requeridos. Base de cálculo = 1 Divisa Origen</small>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn color="error" variant="text" @click="close">
          Cancelar
        </v-btn>
        <v-btn 
          color="primary" 
          :disabled="!valid" 
          :loading="isPending" 
          variant="flat"
          @click="handleSubmit"
        >
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
