<script setup>
  import { useMutation } from '@tanstack/vue-query';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { deleteCliente } from '@/services/clientes.service';

  const props = defineProps({
    modelValue: Boolean,
    cliente: {
      type: Object,
      required: true
    }
  });

  const emit = defineEmits(['update:modelValue', 'success']);

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteCliente(props.cliente.id),
    onSuccess: () => {
      showSuccessToast('Cliente eliminado correctamente');
      emit('success');
      close();
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.error || 'Error al eliminar cliente');
    }
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
      <v-card-title class="text-h6 font-weight-bold pt-4 px-4">
        ¿Eliminar cliente?
      </v-card-title>
            
      <v-card-text class="pa-4">
        Estás a punto de eliminar a 
        <span class="font-weight-bold">{{ cliente.nombre_cliente }} {{ cliente.apellido_cliente }}</span>. 
        <br>
        Esta acción enviará al cliente a la papelera.
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn variant="text" @click="close">
          Cancelar
        </v-btn>
        <v-btn 
          color="error" 
          :loading="isPending" 
          variant="flat" 
          @click="mutate"
        >
          Eliminar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
