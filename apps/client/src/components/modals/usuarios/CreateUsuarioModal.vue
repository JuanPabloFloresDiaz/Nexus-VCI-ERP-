<script setup>
import { ref, reactive, computed } from 'vue';
import { useMutation, useQueryClient, useQuery } from '@tanstack/vue-query';
import { createUsuario } from '@/services/usuarios.service';
import { getAllEmpresas } from '@/services/empresas.service'; // Need this for SuperAdmin
import { useAuth } from '@/hooks/useAuth';
import { showSuccessToast, showErrorToast } from '@/plugins/sweetalert2';

const props = defineProps({
    modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'success']);

const queryClient = useQueryClient();
const { isSuperAdmin } = useAuth();

const form = ref(null);
const valid = ref(false);
const showPassword = ref(false);

const userData = reactive({
    nombre_usuario: '',
    correo_electronico: '',
    clave_acceso: '',
    rol_usuario: null,
    id_empresa: null // Only for SuperAdmin
});

const rules = {
    required: v => !!v || 'Campo requerido',
    email: v => /.+@.+\..+/.test(v) || 'Correo inválido',
    min: v => (v && v.length >= 8) || 'Mínimo 8 caracteres',
    empresaRequired: v => (!isSuperAdmin.value || (isSuperAdmin.value && !!v)) || 'Empresa requerida para SuperAdmin'
};

const roles = ['Administrador', 'Vendedor'];
// If SuperAdmin, they can arguably create other SuperAdmins? Usually not via this simple form, sticking to Admin/Vendor per requirement or allowing SuperAdmin if needed.
// Requirement said: "el super admin, puede crear y editar cualquier usuario"
// Usually SuperAdmin creation is restricted. I'll include 'SuperAdministrador' ONLY if the current user is SuperAdmin, OR maybe restricting it.
// The code in controller allows it. I'll add it to the list if isSuperAdmin.
const availableRoles = computed(() => {
    const r = ['Administrador', 'Vendedor'];
    if (isSuperAdmin.value) r.push('SuperAdministrador');
    return r;
});


// Fetch Empresas for SuperAdmin
const { data: empresasData } = useQuery({
    queryKey: ['empresas-all'],
    queryFn: getAllEmpresas,
    enabled: isSuperAdmin,
});

const empresas = computed(() => empresasData.value?.data || []);

const { mutate, isPending } = useMutation({
    mutationFn: createUsuario,
    onSuccess: () => {
        showSuccessToast('Usuario creado exitosamente');
        emit('success');
        handleClose();
    },
    onError: (error) => {
        showErrorToast(error.response?.data?.message || 'Error al crear usuario');
    }
});

const handleSubmit = async () => {
    const { valid } = await form.value.validate();
    if (!valid) return;

    const payload = { ...userData };
    // Clean payload
    if (!isSuperAdmin.value) delete payload.id_empresa;

    mutate(payload);
};

const handleClose = () => {
    userData.nombre_usuario = '';
    userData.correo_electronico = '';
    userData.clave_acceso = '';
    userData.rol_usuario = null;
    userData.id_empresa = null;
    emit('update:modelValue', false);
};
</script>

<template>
    <v-dialog
        :model-value="modelValue"
        @update:model-value="handleClose"
        max-width="600"
        persistent
    >
        <v-card class="rounded-lg">
            <v-card-title class="d-flex justify-space-between align-center pa-4 text-h5 font-weight-bold text-primary">
                Nuevo Usuario
                <v-btn icon variant="text" @click="handleClose">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            
            <v-divider></v-divider>

            <v-card-text class="pa-4">
                <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
                    <v-row>
                        <!-- Empresa Selector (SuperAdmin Only) -->
                        <v-col cols="12" v-if="isSuperAdmin">
                            <v-autocomplete
                                v-model="userData.id_empresa"
                                :items="empresas"
                                item-title="nombre_empresa"
                                item-value="id"
                                label="Empresa"
                                variant="outlined"
                                density="comfortable"
                                :rules="[rules.required]"
                                color="primary"
                                prepend-inner-icon="mdi-domain"
                            ></v-autocomplete>
                        </v-col>

                        <v-col cols="12">
                            <v-text-field
                                v-model="userData.nombre_usuario"
                                label="Nombre Completo"
                                variant="outlined"
                                density="comfortable"
                                :rules="[rules.required]"
                                color="primary"
                                prepend-inner-icon="mdi-account"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12">
                            <v-text-field
                                v-model="userData.correo_electronico"
                                label="Correo Electrónico"
                                variant="outlined"
                                density="comfortable"
                                :rules="[rules.required, rules.email]"
                                color="primary"
                                prepend-inner-icon="mdi-email"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12">
                            <v-text-field
                                v-model="userData.clave_acceso"
                                label="Contraseña"
                                variant="outlined"
                                density="comfortable"
                                :rules="[rules.required, rules.min]"
                                :type="showPassword ? 'text' : 'password'"
                                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                                @click:append-inner="showPassword = !showPassword"
                                color="primary"
                                prepend-inner-icon="mdi-lock"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12">
                            <v-select
                                v-model="userData.rol_usuario"
                                :items="availableRoles"
                                label="Rol"
                                variant="outlined"
                                density="comfortable"
                                :rules="[rules.required]"
                                color="primary"
                                prepend-inner-icon="mdi-shield-account"
                            ></v-select>
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn
                    variant="text"
                    color="medium-emphasis"
                    @click="handleClose"
                >
                    Cancelar
                </v-btn>
                <v-btn
                    color="primary"
                    variant="flat"
                    :loading="isPending"
                    @click="handleSubmit"
                >
                    Crear Usuario
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
