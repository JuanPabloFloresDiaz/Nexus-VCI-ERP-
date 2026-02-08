<script setup>
import { useMutation } from '@tanstack/vue-query';
import { deleteCliente } from '@/services/clientes.service';
import { showSuccessToast, showErrorToast } from '@/plugins/sweetalert2';

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

const close = () => {
    emit('update:modelValue', false);
};
</script>

<template>
    <v-dialog 
        :model-value="modelValue" 
        @update:model-value="close" 
        max-width="500px"
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
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="close">
                    Cancelar
                </v-btn>
                <v-btn 
                    color="error" 
                    variant="flat" 
                    @click="mutate" 
                    :loading="isPending"
                >
                    Eliminar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
