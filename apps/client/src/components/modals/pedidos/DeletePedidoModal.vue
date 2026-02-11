<script setup>
import { ref, computed } from 'vue';
import { useMutation } from '@tanstack/vue-query';
import { deletePedido } from '@/services/pedidos.service';
import { showSuccessToast, showErrorToast } from '@/plugins/sweetalert2';

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    pedido: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:modelValue', 'success']);

const show = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const { mutate, isPending } = useMutation({
    mutationFn: deletePedido,
    onSuccess: () => {
        showSuccessToast('Pedido eliminado correctamente');
        emit('success');
        show.value = false;
    },
    onError: (error) => {
        showErrorToast(error.response?.data?.message || 'Error al eliminar pedido');
    }
});

const confirmDelete = () => {
    if (props.pedido?.id) {
        mutate(props.pedido.id);
    }
};
</script>

<template>
    <v-dialog v-model="show" max-width="500">
        <v-card>
            <v-card-title class="text-h5 bg-error text-white">
                Confirmar Eliminación
            </v-card-title>
            
            <v-card-text class="pa-4 pt-6">
                ¿Estás seguro que deseas eliminar el pedido <strong>#{{ pedido?.id?.substring(0,8) }}</strong>?
                <br><br>
                <div class="text-caption text-medium-emphasis">
                    Esta acción moverá el pedido a la papelera. Podrás restaurarlo después si es necesario.
                </div>
            </v-card-text>
            
            <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn
                    color="grey-darken-1"
                    variant="text"
                    @click="show = false"
                    :disabled="isPending"
                >
                    Cancelar
                </v-btn>
                <v-btn
                    color="error"
                    variant="flat"
                    @click="confirmDelete"
                    :loading="isPending"
                >
                    Eliminar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
