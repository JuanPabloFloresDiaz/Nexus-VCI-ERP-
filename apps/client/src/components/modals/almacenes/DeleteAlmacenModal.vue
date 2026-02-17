<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title class="text-h5 bg-error text-white">
        <v-icon class="mr-2">mdi-alert-circle</v-icon>
        Confirmar Eliminación
      </v-card-title>
      <v-card-text class="pt-4">
        <p class="mb-2">Estás a punto de eliminar el almacén:</p>
        <p class="text-h6 font-weight-bold mb-4">{{ almacen?.nombre_almacen }}</p>
        
        <v-alert type="warning" variant="tonal" density="compact" class="mb-0">
          Esta acción enviará el registro a la papelera (Soft Delete).
          <br>El historial de movimientos no se verá afectado inmediatamente, pero el almacén dejará de estar disponible para nuevas operaciones.
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="dialog = false">Cancelar</v-btn>
        <v-btn color="error" variant="elevated" :loading="loading" @click="confirmDelete">Eliminar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { deleteAlmacen } from '@/services/almacenes.service';
import Swal from 'sweetalert2';

const props = defineProps({
  modelValue: Boolean,
  almacen: Object
});

const emit = defineEmits(['update:modelValue', 'deleted']);

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const loading = ref(false);

async function confirmDelete() {
    if (!props.almacen) return;
    
    loading.value = true;
    try {
        await deleteAlmacen(props.almacen.id);
        Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El almacén ha sido eliminado correctamente.',
            timer: 2000,
            showConfirmButton: false
        });
        emit('deleted');
        dialog.value = false;
    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.response?.data?.message || 'No se pudo eliminar el almacén.'
        });
    } finally {
        loading.value = false;
    }
}
</script>
