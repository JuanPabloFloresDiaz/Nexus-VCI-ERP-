<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title class="text-h5 bg-error text-white">
        <v-icon class="mr-2">mdi-alert-circle</v-icon>
        Eliminar Movimiento
      </v-card-title>
      <v-card-text class="pt-4">
        <p class="mb-2">¿Estás seguro de que deseas eliminar este registro de movimiento?</p>
        
        <v-card variant="outlined" class="pa-2 mb-4" v-if="movimiento">
             <div class="d-flex justify-space-between align-center">
                 <span class="font-weight-bold">{{ movimiento.tipo_movimiento }}</span>
                 <span :class="movimiento.cantidad < 0 ? 'text-error' : 'text-success'">{{ movimiento.cantidad }} unidades</span>
             </div>
             <div class="text-caption">{{ movimiento.variante?.producto?.nombre_producto }}</div>
             <div class="text-caption">{{ formatDate(movimiento.fecha_movimiento) }}</div>
        </v-card>

        <v-alert type="error" variant="tonal" density="compact" class="mb-0">
          <strong>Advertencia:</strong> Esto es un Soft Delete. El registro se ocultará pero el Stock NO se revertirá automáticamente. Si necesitas corregir stock, debes crear un movimiento de ajuste.
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
import { deleteMovimiento } from '@/services/movimientos.service';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';

const props = defineProps({
  modelValue: Boolean,
  movimiento: Object
});

const emit = defineEmits(['update:modelValue', 'deleted']);

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const loading = ref(false);

async function confirmDelete() {
    if (!props.movimiento) return;
    
    loading.value = true;
    try {
        await deleteMovimiento(props.movimiento.id);
        Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El movimiento ha sido eliminado correctamente.',
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
            text: error.response?.data?.message || 'No se pudo eliminar el movimiento.'
        });
    } finally {
        loading.value = false;
    }
}

function formatDate(date) {
    return dayjs(date).format('DD/MM/YYYY');
}
</script>
