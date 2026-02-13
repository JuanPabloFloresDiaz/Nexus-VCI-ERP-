<script setup>
  import { useMutation } from '@tanstack/vue-query';
  import { ref, watch } from 'vue';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { deleteProducto } from '@/services/productos.service';

  const props = defineProps({
    modelValue: Boolean,
    producto: Object
  });

  const emit = defineEmits(['update:modelValue', 'success']);

  const isOpen = ref(props.modelValue);
  const isDeleting = ref(false);

  watch(() => props.modelValue, (val) => {
    isOpen.value = val;
  });

  watch(isOpen, (val) => {
    emit('update:modelValue', val);
  });

  const { mutate } = useMutation({
    mutationFn: deleteProducto,
    onSuccess: () => {
      showSuccessToast('Producto eliminado correctamente');
      isOpen.value = false;
      emit('success');
    },
    onError: (error) => {
      showErrorToast('Error al eliminar producto');
      isDeleting.value = false;
    }
  });

  function handleConfirm () {
    if (!props.producto?.id) return;
    isDeleting.value = true;
    mutate(props.producto.id);
  }
</script>

<template>
  <v-dialog v-model="isOpen" max-width="500px">
    <v-card>
      <v-card-title class="text-h5 bg-error text-white">
        Confirmar Eliminación
      </v-card-title>
      <v-card-text class="pt-4">
        ¿Estás seguro que deseas eliminar el producto <strong>{{ producto?.nombre_producto }}</strong>?
        <div class="text-caption text-medium-emphasis mt-2">
          Esta acción enviará el producto a la papelera.
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="grey-darken-1"
          variant="text"
          @click="isOpen = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="error"
          :loading="isDeleting"
          variant="flat"
          @click="handleConfirm"
        >
          Eliminar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
