<script setup>
import { ref } from 'vue';
import { useMutation } from '@tanstack/vue-query';
import { deleteCompra } from '@/services/compras.service';
import Swal from 'sweetalert2';

const props = defineProps({
    modelValue: Boolean,
    compra: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['update:modelValue', 'success']);

const loading = ref(false);

const { mutate } = useMutation({
    mutationFn: deleteCompra,
    onSuccess: () => {
        Swal.fire({
            icon: 'success',
            title: 'Compra eliminada',
            text: 'La compra ha sido movida a la papelera',
            timer: 2000,
            showConfirmButton: false
        });
        emit('success');
        emit('update:modelValue', false);
    },
    onError: (error) => {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.response?.data?.message || 'No se pudo eliminar la compra'
        });
    },
    onSettled: () => {
        loading.value = false;
    }
});

function confirmDelete() {
    loading.value = true;
    mutate(props.compra.id);
}
</script>

<template>
    <v-dialog :model-value="modelValue" max-width="500px" persistent @update:model-value="emit('update:modelValue', $event)">
        <v-card class="rounded-lg">
            <v-card-title class="text-h5 bg-error text-white pa-4">
                Confirmar Eliminación
            </v-card-title>

            <v-card-text class="pa-4 text-body-1">
                ¿Estás seguro de que deseas eliminar la compra <strong>#{{ compra.id.substring(0, 8) }}</strong>?
                <br><br>
                <div class="text-caption text-medium-emphasis">
                    Esta acción moverá la compra a la papelera. Podrás restaurarla posteriormente si es necesario.
                </div>
            </v-card-text>

            <v-card-actions class="pa-4">
                <v-spacer />
                <v-btn
                    :disabled="loading"
                    variant="text"
                    @click="emit('update:modelValue', false)"
                >
                    Cancelar
                </v-btn>
                <v-btn
                    color="error"
                    :loading="loading"
                    variant="flat"
                    @click="confirmDelete"
                >
                    Eliminar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
