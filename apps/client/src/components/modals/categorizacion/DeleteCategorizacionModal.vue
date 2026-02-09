<script setup>
import { ref } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { deleteCategoria } from '@/services/categorizacion.service';
import { showSuccessToast, showErrorToast } from '@/plugins/sweetalert2';

const dialog = ref(false);
const itemToDelete = ref(null);
const queryClient = useQueryClient();

const open = (item) => {
    itemToDelete.value = item;
    dialog.value = true;
};

const close = () => {
    dialog.value = false;
    itemToDelete.value = null;
};

const { mutate, isLoading } = useMutation({
    mutationFn: (id) => deleteCategoria(id),
    onSuccess: () => {
        showSuccessToast('Categoría eliminada correctamente');
        queryClient.invalidateQueries({ queryKey: ['categorias'] });
        close();
    },
    onError: (error) => {
        showErrorToast(error.message || 'Error al eliminar categoría');
    }
});

const handleConfirm = () => {
    if (itemToDelete.value) {
        mutate(itemToDelete.value.id);
    }
};

defineExpose({ open });
</script>

<template>
    <v-dialog v-model="dialog" max-width="400">
        <v-card>
            <v-card-title class="text-h6 bg-error text-white">
                Confirmar Eliminación
            </v-card-title>
            <v-card-text class="pa-4">
                <div v-if="itemToDelete">
                    ¿Estás seguro de que deseas eliminar la categoría <strong>{{ itemToDelete.nombre_categoria }}</strong>?
                    <div class="text-caption text-medium-emphasis mt-2">
                        Esta acción enviará la categoría a la papelera.
                    </div>
                </div>
            </v-card-text>
            <v-card-actions class="justify-end pa-4">
                <v-btn
                    variant="text"
                    @click="close"
                    :disabled="isLoading"
                >
                    Cancelar
                </v-btn>
                <v-btn
                    color="error"
                    variant="elevated"
                    @click="handleConfirm"
                    :loading="isLoading"
                >
                    Eliminar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
