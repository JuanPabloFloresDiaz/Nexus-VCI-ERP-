<script setup>
import { ref, computed } from 'vue';
import { useMutation, useQuery } from '@tanstack/vue-query';
import { createCliente } from '@/services/clientes.service'; // Ensure this service exists
import { getAllEmpresas } from '@/services/empresas.service'; // Ensure this service exists
import { useAuth } from '@/hooks/useAuth';
import { showSuccessToast, showErrorToast } from '@/plugins/sweetalert2';
import { vMaska } from 'maska/vue'; // Using explicit path for maska v3

const props = defineProps({
    modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'success']);

const { isSuperAdmin } = useAuth();
const form = ref(null);
const valid = ref(false);

const formData = ref({
    nombre_cliente: '',
    apellido_cliente: '',
    correo_cliente: '',
    telefono_cliente: '',
    dui_cliente: '',
    id_empresa: null
});

// Fetch Empresas for SuperAdmin
const { data: empresasData } = useQuery({
    queryKey: ['empresas', 'select'],
    queryFn: getAllEmpresas,
    enabled: isSuperAdmin,
    staleTime: 5 * 60 * 1000
});

const empresas = computed(() => empresasData.value?.data || []);

const { mutate, isPending } = useMutation({
    mutationFn: createCliente,
    onSuccess: () => {
        showSuccessToast('Cliente creado correctamente');
        emit('success');
        resetForm();
    },
    onError: (error) => {
        showErrorToast(error.response?.data?.error || 'Error al crear cliente');
    }
});

const handleSubmit = async () => {
    const { valid: isValid } = await form.value.validate();
    if (!isValid) return;

    mutate(formData.value);
};

const resetForm = () => {
    formData.value = {
        nombre_cliente: '',
        apellido_cliente: '',
        correo_cliente: '',
        telefono_cliente: '',
        dui_cliente: '',
        id_empresa: null
    };
    if (form.value) form.value.resetValidation();
};

const close = () => {
    emit('update:modelValue', false);
    resetForm();
};

// Rules
const nameRules = [
    v => !!v || 'Campo requerido',
    v => v.length <= 100 || 'Máximo 100 caracteres'
];

const emailRules = [
    v => !!v || 'Correo es requerido',
    v => /.+@.+\..+/.test(v) || 'Correo inválido'
];

const phoneRules = [
    v => !v || v.length >= 8 || 'Teléfono inválido' // Basic check, mask validation handles format
];

const duiRules = [
    v => !v || v.length === 10 || 'DUI debe tener 9 dígitos y guión' // 00000000-0
];

</script>

<template>
    <v-dialog 
        :model-value="modelValue" 
        @update:model-value="close" 
        max-width="600px"
        persistent
    >
        <v-card>
            <v-toolbar color="primary" density="compact">
                <v-toolbar-title class="text-h6 font-weight-bold">
                    Nuevo Cliente
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="close">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar>

            <v-card-text class="pa-4">
                <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
                    <v-row dense>
                        <!-- Empresa Selection (SuperAdmin only) -->
                        <v-col cols="12" v-if="isSuperAdmin">
                            <v-autocomplete
                                v-model="formData.id_empresa"
                                :items="empresas"
                                item-title="nombre_empresa"
                                item-value="id"
                                label="Empresa *"
                                variant="outlined"
                                density="compact"
                                :rules="[v => !!v || 'Selecciona una empresa']"
                                persistent-hint
                                hint="Asignar cliente a una empresa"
                                prepend-inner-icon="mdi-domain"
                            ></v-autocomplete>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.nombre_cliente"
                                label="Nombres *"
                                variant="outlined"
                                density="compact"
                                :rules="nameRules"
                                prepend-inner-icon="mdi-account"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.apellido_cliente"
                                label="Apellidos *"
                                variant="outlined"
                                density="compact"
                                :rules="nameRules"
                                prepend-inner-icon="mdi-account-outline"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12">
                            <v-text-field
                                v-model="formData.correo_cliente"
                                label="Correo Electrónico *"
                                variant="outlined"
                                density="compact"
                                :rules="emailRules"
                                prepend-inner-icon="mdi-email"
                                type="email"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.telefono_cliente"
                                label="Teléfono"
                                variant="outlined"
                                density="compact"
                                :rules="phoneRules"
                                prepend-inner-icon="mdi-phone"
                                v-maska="'####-####'"
                                placeholder="0000-0000"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.dui_cliente"
                                label="DUI"
                                variant="outlined"
                                density="compact"
                                :rules="duiRules"
                                prepend-inner-icon="mdi-card-account-details"
                                v-maska="'########-#'"
                                placeholder="00000000-0"
                            ></v-text-field>
                        </v-col>
                    </v-row>
                </v-form>
                <small class="text-caption text-medium-emphasis">* Campos requeridos</small>
            </v-card-text>

            <v-card-actions class="pa-4 pt-0">
                <v-spacer></v-spacer>
                <v-btn variant="text" color="error" @click="close">
                    Cancelar
                </v-btn>
                <v-btn 
                    color="primary" 
                    variant="flat" 
                    @click="handleSubmit" 
                    :loading="isPending"
                    :disabled="!valid"
                >
                    Guardar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
