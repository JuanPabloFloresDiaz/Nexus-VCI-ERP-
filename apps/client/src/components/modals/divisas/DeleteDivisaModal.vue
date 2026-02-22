<script setup>
  import { useMutation } from '@tanstack/vue-query';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { deleteDivisa } from '@/services/divisas.service';

  const props = defineProps({
    modelValue: Boolean,
    divisa: {
      type: Object,
      default: null
    }
  });

  const emit = defineEmits(['update:modelValue', 'success']);

  const { mutate, isPending } = useMutation({
    mutationFn: deleteDivisa,
    onSuccess: () => {
      showSuccessToast('Divisa eliminada exitosamente');
      emit('success');
      close();
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.error || 'No se pudo eliminar la divisa. Puede que esté en uso.');
    }
  });

  function handleDelete () {
    if (!props.divisa?.id) return;
    mutate(props.divisa.id);
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
    <v-card v-if="divisa">
      <v-card-title class="text-h6 font-weight-bold text-error d-flex align-center gap-2 pa-4">
        <v-icon>mdi-alert-circle</v-icon>
        Eliminar Divisa
      </v-card-title>
      
      <v-card-text class="pt-2">
        ¿Estás seguro que deseas eliminar la divisa <strong>{{ divisa.nombre_divisa }} ({{ divisa.codigo_iso }})</strong>?
        <br>
        <span class="text-caption text-medium-emphasis mt-2 d-block">
          Esta acción enviará la divisa a la papelera. Asegúrate de que no esté definida como moneda base de ninguna empresa.
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
