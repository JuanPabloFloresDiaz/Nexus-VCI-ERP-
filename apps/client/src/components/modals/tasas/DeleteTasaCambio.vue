<script setup>
  import { useMutation } from '@tanstack/vue-query';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { deleteTasaCambio } from '@/services/tasasCambio.service';

  const props = defineProps({
    modelValue: Boolean,
    tasa: {
      type: Object,
      default: null
    }
  });

  const emit = defineEmits(['update:modelValue', 'success']);

  const { mutate, isPending } = useMutation({
    mutationFn: deleteTasaCambio,
    onSuccess: () => {
      showSuccessToast('Tasa de cambio eliminada exitosamente');
      emit('success');
      close();
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.error || 'No se pudo eliminar la tasa de cambio.');
    }
  });

  function handleDelete () {
    if (!props.tasa?.id) return;
    mutate(props.tasa.id);
  }

  function close () {
    emit('update:modelValue', false);
  }
</script>

<template>
  <v-dialog 
    max-width="400px" 
    :model-value="modelValue" 
    persistent
    @update:model-value="close"
  >
    <v-card v-if="tasa">
      <v-card-title class="text-h6 font-weight-bold text-error d-flex align-center gap-2 pa-4">
        <v-icon>mdi-alert-circle</v-icon>
        Eliminar Tasa de Cambio
      </v-card-title>
      
      <v-card-text class="pt-2">
        ¿Estás seguro que deseas eliminar la paridad 
        <strong>{{ tasa.codigo_iso_origen }} &rarr; {{ tasa.codigo_iso_destino }}</strong>?
        <br>
        <span class="text-caption text-medium-emphasis mt-2 d-block">
          La tasa de cambio pasará a la papelera.
        </span>
      </v-card-text>

      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-spacer />
        <v-btn :disabled="isPending" variant="text" @click="close">
          Cancelar
        </v-btn>
        <v-btn 
          color="error" 
          :loading="isPending" 
          variant="flat"
          @click="handleDelete"
        >
          Sí, Eliminar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
