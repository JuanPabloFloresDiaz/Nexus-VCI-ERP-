<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useMutation, useQueryClient, useQuery } from '@tanstack/vue-query';
import { updateUsuario } from '@/services/usuarios.service';
import { getAllEmpresas } from '@/services/empresas.service';
import { useAuth } from '@/hooks/useAuth';
import { showSuccessToast, showErrorToast } from '@/plugins/sweetalert2';

const props = defineProps({
    modelValue: Boolean,
    usuario: Object
});

const emit = defineEmits(['update:modelValue', 'success']);

const { isSuperAdmin } = useAuth();

const form = ref(null);
const valid = ref(false);

const userData = reactive({
    nombre_usuario: '',
    correo_electronico: '',
    rol_usuario: null,
    estado_usuario: true,
    id_empresa: null
});

watch(() => props.usuario, (newItem) => {
    if (newItem) {
        userData.nombre_usuario = newItem.nombre_usuario;
        userData.correo_electronico = newItem.correo_electronico;
        userData.rol_usuario = newItem.rol_usuario;
        userData.estado_usuario = newItem.estado_usuario;
        userData.id_empresa = newItem.id_empresa || newItem.empresa?.id; // backend might send id_empresa or nested object
    }
}, { immediate: true });

const rules = {
    required: v => !!v || 'Campo requerido',
    email: v => /.+@.+\..+/.test(v) || 'Correo inválido',
};

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
    mutationFn: (payload) => updateUsuario(props.usuario.id, payload),
    onSuccess: () => {
        showSuccessToast('Usuario actualizado exitosamente');
        emit('success');
        handleClose();
    },
    onError: (error) => {
        showErrorToast(error.response?.data?.message || 'Error al actualizar usuario');
    }
});

const handleSubmit = async () => {
    const { valid } = await form.value.validate();
    if (!valid) return;

    const payload = { ...userData };
    if (!isSuperAdmin.value) delete payload.id_empresa;
    
    // We don't send password here
    mutate(payload);
};

const handleClose = () => {
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
                Editar Usuario
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

                        <v-col cols="12">
                            <v-switch
                                v-model="userData.estado_usuario"
                                color="success"
                                label="Estado del Usuario"
                                hide-details
                                inset
                            >
                                <template v-slot:label>
                                    <span :class="userData.estado_usuario ? 'text-success' : 'text-error'">
                                        {{ userData.estado_usuario ? 'Activo' : 'Inactivo' }}
                                    </span>
                                </template>
                            </v-switch>
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
                    Guardar Cambios
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
