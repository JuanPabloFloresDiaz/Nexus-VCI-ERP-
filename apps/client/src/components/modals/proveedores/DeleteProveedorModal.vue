<script setup>
  import { useMutation } from '@tanstack/vue-query';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { deleteProveedor } from '@/services/proveedores.service';

  const props = defineProps({
    modelValue: Boolean,
    proveedor: {
      type: Object,
      required: true
    }
  });

  const emit = defineEmits(['update:modelValue', 'success']);

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteProveedor(props.proveedor.id),
    onSuccess: () => {
      showSuccessToast('Proveedor eliminado exitosamente');
      emit('success');
      close();
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.error || 'Error al eliminar proveedor');
    }
  });

  function confirm () {
    mutate();
  }

  function close () {
    emit('update:modelValue', false);
  }
</script>

<template>
  <v-dialog
    max-width="450px"
    :model-value="modelValue"
    @update:model-value="close"
  >
    <v-card>
      <v-card-title class="text-h6 pt-4 px-4 text-wrap">
        ¿Estás seguro de eliminar este proveedor?
      </v-card-title>
            
      <v-card-text class="pa-4">
        <div class="d-flex align-center mb-4">
          <v-avatar class="mr-3" color="error" variant="tonal">
            <v-icon>mdi-alert-outline</v-icon>
          </v-avatar>
          <div>
            <div class="font-weight-bold">{{ proveedor.nombre_proveedor }}</div>
            <div class="text-caption text-medium-emphasis">Se moverá a la papelera</div>
          </div>
        </div>
        <p class="text-body-2 text-medium-emphasis">
          Esta acción no eliminará las compras asociadas, pero el proveedor dejará de estar disponible para nuevas operaciones. Podrás restaurarlo después desde la papelera.
        </p>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn
          color="error"
          :disabled="isPending"
          :loading="isPending"
          variant="elevated"
          @click="confirm"
        >
          Eliminar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
