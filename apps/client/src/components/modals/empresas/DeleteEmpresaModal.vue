<template>
    <v-dialog v-model="internalDialog" max-width="500px">
        <v-card class="rounded-lg">
            <v-card-title class="text-h6 font-weight-bold pa-4">
                ¿Mover a papelera?
            </v-card-title>
            
            <v-card-text class="pa-4 pt-0">
                <div class="text-body-1 mb-4">
                    Estás a punto de desactivar la empresa <span class="font-weight-bold">"{{ itemName }}"</span>.
                </div>
                <v-alert
                    type="warning"
                    variant="tonal"
                    border="start"
                    class="text-caption"
                >
                    La empresa dejará de estar visible y sus usuarios perderán acceso. Podrás restaurarla desde la Papelera de Reciclaje.
                </v-alert>
            </v-card-text>

            <v-card-actions class="pa-4 bg-grey-lighten-5">
                <v-spacer></v-spacer>
                <v-btn
                    variant="text"
                    color="grey-darken-1"
                    @click="close"
                    :disabled="isPending"
                >
                    Cancelar
                </v-btn>
                <v-btn
                    color="error"
                    variant="flat"
                    @click="handleDelete"
                    :loading="isPending"
                    class="px-6"
                >
                    Mover a Papelera
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { computed } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { deleteEmpresa } from '@/services/empresas.service';
import { showSuccessToast, showErrorToast } from '@/plugins/sweetalert2';

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    empresa: {
        type: Object,
        default: () => null
    }
});

const emit = defineEmits(['update:modelValue']);
const queryClient = useQueryClient();

const internalDialog = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const itemName = computed(() => props.empresa?.nombre_empresa || 'esta empresa');

const { mutate, isPending } = useMutation({
    mutationFn: (id) => deleteEmpresa(id),
    onSuccess: () => {
        showSuccessToast('Empresa movida a la papelera');
        queryClient.invalidateQueries({ queryKey: ['empresas'] });
        queryClient.invalidateQueries({ queryKey: ['empresas', 'trashed'] });
        close();
    },
    onError: (error) => {
        console.error(error);
        showErrorToast(error.response?.data?.error || 'Error al eliminar la empresa');
    }
});

const handleDelete = () => {
    if (props.empresa?.id) {
        mutate(props.empresa.id);
    }
};

const close = () => {
    internalDialog.value = false;
};
</script>
