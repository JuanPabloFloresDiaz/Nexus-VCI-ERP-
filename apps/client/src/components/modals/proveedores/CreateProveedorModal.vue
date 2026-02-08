<script setup>
import { ref, reactive, computed } from 'vue';
import { useMutation, useQuery } from '@tanstack/vue-query';
import { createProveedor } from '@/services/proveedores.service';
import { getAllEmpresas } from '@/services/empresas.service';
import { useAuth } from '@/hooks/useAuth';
import { showSuccessToast, showErrorToast } from '@/plugins/sweetalert2';
import { vMaska } from 'maska/vue';

const props = defineProps({
    modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'success']);

const { isSuperAdmin, user } = useAuth();

// Form State
const valid = ref(false);
const form = ref(null);
const loading = ref(false);

const formData = reactive({
    nombre_proveedor: '',
    contacto_nombre: '',
    correo_proveedor: '',
    telefono_proveedor: '',
    id_empresa: null
});

// Rules
const rules = {
    required: v => !!v || 'Campo requerido',
    email: v => !v || /.+@.+\..+/.test(v) || 'Correo inválido',
    min3: v => v?.length >= 3 || 'Mínimo 3 caracteres'
};

// Fetch Empresas (SuperAdmin only)
const { data: empresasData } = useQuery({
    queryKey: ['empresas', 'select'],
    queryFn: getAllEmpresas,
    enabled: computed(() => isSuperAdmin.value)
});

const empresas = computed(() => empresasData.value?.data || []);

// Mutation
const { mutate, isPending } = useMutation({
    mutationFn: createProveedor,
    onSuccess: (data) => {
        showSuccessToast('Proveedor creado exitosamente');
        emit('success');
        close();
    },
    onError: (error) => {
        showErrorToast(error.response?.data?.error || 'Error al crear proveedor');
    }
});

const submit = async () => {
    const { valid: isValid } = await form.value.validate();
    if (!isValid) return;

    const payload = { ...formData };
    if (!isSuperAdmin.value) {
        payload.id_empresa = user.value.id_empresa;
    }

    mutate(payload);
};

const close = () => {
    emit('update:modelValue', false);
    // Reset form logic if needed, usually cleaner to destroy modal or reset refs
    formData.nombre_proveedor = '';
    formData.contacto_nombre = '';
    formData.correo_proveedor = '';
    formData.telefono_proveedor = '';
    formData.id_empresa = null;
    if(form.value) form.value.resetValidation();
};
</script>

<template>
    <v-dialog
        :model-value="modelValue"
        @update:model-value="close"
        max-width="600px"
        persistent
    >
        <v-card>
            <v-card-title class="bg-primary text-white d-flex align-center justify-space-between">
                Nuevo Proveedor
                <v-btn icon variant="text" @click="close">
                    <v-icon color="white">mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-card-text class="pa-4">
                <v-form ref="form" v-model="valid" @submit.prevent="submit">
                    <v-row dense>
                        <!-- Company Selection (SuperAdmin) -->
                        <v-col cols="12" v-if="isSuperAdmin">
                            <v-autocomplete
                                v-model="formData.id_empresa"
                                :items="empresas"
                                item-title="nombre_empresa"
                                item-value="id"
                                label="Empresa"
                                variant="outlined"
                                density="compact"
                                :rules="[rules.required]"
                                required
                            ></v-autocomplete>
                        </v-col>

                        <v-col cols="12">
                            <v-text-field
                                v-model="formData.nombre_proveedor"
                                label="Nombre del Proveedor *"
                                variant="outlined"
                                density="compact"
                                :rules="[rules.required, rules.min3]"
                                placeholder="Ej. Distribuidora S.A."
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12">
                            <v-text-field
                                v-model="formData.contacto_nombre"
                                label="Nombre del Contacto"
                                variant="outlined"
                                density="compact"
                                placeholder="Ej. Juan Pérez"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.telefono_proveedor"
                                label="Teléfono"
                                variant="outlined"
                                density="compact"
                                v-maska="'####-####'"
                                placeholder="####-####"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.correo_proveedor"
                                label="Correo Electrónico"
                                variant="outlined"
                                density="compact"
                                :rules="[rules.email]"
                                placeholder="contacto@ejemplo.com"
                            ></v-text-field>
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>

            <v-card-actions class="px-6 pb-6 pt-0">
                <v-spacer></v-spacer>
                <v-btn variant="text" color="grey-darken-1" @click="close">Cancelar</v-btn>
                <v-btn
                    color="primary"
                    variant="elevated"
                    @click="submit"
                    :loading="isPending"
                    :disabled="isPending"
                >
                    Guardar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
