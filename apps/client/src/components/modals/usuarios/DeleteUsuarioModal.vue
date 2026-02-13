<script setup>
  import { useMutation } from '@tanstack/vue-query';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { deleteUsuario } from '@/services/usuarios.service';

  const props = defineProps({
    modelValue: Boolean,
    usuario: Object
  });

  const emit = defineEmits(['update:modelValue', 'success']);

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteUsuario(props.usuario.id),
    onSuccess: () => {
      showSuccessToast('Usuario enviado a la papelera');
      emit('success');
      handleClose();
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.message || 'Error al eliminar usuario');
    }
  });

  function handleDelete () {
    mutate();
  }

  function handleClose () {
    emit('update:modelValue', false);
  }
</script>

<template>
  <v-dialog
    max-width="400"
    :model-value="modelValue"
    persistent
    @update:model-value="handleClose"
  >
    <v-card class="rounded-lg">
      <v-card-title class="text-h5 font-weight-bold text-primary pa-4">
        Confirmar Eliminación
      </v-card-title>
            
      <v-card-text class="pa-4 text-body-1">
        ¿Estás seguro que deseas eliminar al usuario 
        <span class="font-weight-bold text-high-emphasis">{{ usuario?.nombre_usuario }}</span>?
        <br><br>
        <span class="text-caption text-medium-emphasis">
          Esta acción enviará al usuario a la papelera. Podrás restaurarlo después.
        </span>
      </v-card-text>

      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-spacer />
        <v-btn
          color="medium-emphasis"
          variant="text"
          @click="handleClose"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="error"
          :loading="isPending"
          variant="flat"
          @click="handleDelete"
        >
          Eliminar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
