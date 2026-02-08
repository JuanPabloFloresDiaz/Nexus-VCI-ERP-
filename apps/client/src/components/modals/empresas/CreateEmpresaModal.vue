<template>
    <v-dialog v-model="internalDialog" max-width="700px" persistent>
        <v-card class="rounded-lg">
            <v-card-title class="pa-4 d-flex justify-space-between align-center border-b">
                <span class="text-h6 font-weight-bold">Nueva Empresa</span>
                <v-btn icon variant="text" @click="close">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-card-text class="pa-6">
                <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
                    <v-row>
                        <!-- Logo Upload Section -->
                        <v-col cols="12" class="d-flex flex-column align-center mb-4">
                            <v-avatar size="100" color="grey-lighten-4" class="mb-2 elevation-1 border">
                                <v-img v-if="previewUrl" :src="previewUrl" cover></v-img>
                                <v-icon v-else size="40" color="grey">mdi-image-plus</v-icon>
                            </v-avatar>
                            <v-btn
                                variant="tonal"
                                size="small"
                                color="primary"
                                prepend-icon="mdi-upload"
                                @click="$refs.fileInput.click()"
                                :loading="uploading"
                            >
                                Subir Logo
                            </v-btn>
                            <input
                                ref="fileInput"
                                type="file"
                                accept="image/*"
                                class="d-none"
                                @change="handleFileSelect"
                            >
                            <div class="text-caption text-medium-emphasis mt-1">
                                Máx. 5MB (PNG, JPG, WEBP)
                            </div>
                        </v-col>

                        <!-- Form Fields -->
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.nombre_empresa"
                                label="Nombre de la Empresa"
                                variant="outlined"
                                density="comfortable"
                                :rules="[v => !!v || 'El nombre es requerido']"
                                required
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.nit_empresa"
                                label="NIT"
                                variant="outlined"
                                density="comfortable"
                                placeholder="0000-000000-000-0"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.correo_empresa"
                                label="Correo Electrónico"
                                type="email"
                                variant="outlined"
                                density="comfortable"
                                :rules="[
                                    v => !v || /.+@.+\..+/.test(v) || 'Correo no válido'
                                ]"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model="formData.telefono_empresa"
                                label="Teléfono"
                                variant="outlined"
                                density="comfortable"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12">
                            <v-textarea
                                v-model="formData.direccion_empresa"
                                label="Dirección Física"
                                variant="outlined"
                                density="comfortable"
                                rows="3"
                                auto-grow
                            ></v-textarea>
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>

            <v-divider></v-divider>

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
                    color="primary"
                    variant="flat"
                    @click="handleSubmit"
                    :loading="isPending || uploading"
                    :disabled="!valid"
                    class="px-6"
                >
                    Crear Empresa
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { createEmpresa } from '@/services/empresas.service';
import { uploadFile } from '@/services/storage.service';
import { showSuccessToast, showErrorToast } from '@/plugins/sweetalert2';

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue']);

const queryClient = useQueryClient();
const form = ref(null);
const valid = ref(false);
const fileInput = ref(null);
const previewUrl = ref(null);
const selectedFile = ref(null);
const uploading = ref(false);

const formData = reactive({
    nombre_empresa: '',
    nit_empresa: '',
    correo_empresa: '',
    telefono_empresa: '',
    direccion_empresa: '',
    logo_url: null
});

const internalDialog = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

// Reset form when dialog opens
watch(internalDialog, (val) => {
    if (val) {
        resetForm();
    }
});

const resetForm = () => {
    formData.nombre_empresa = '';
    formData.nit_empresa = '';
    formData.correo_empresa = '';
    formData.telefono_empresa = '';
    formData.direccion_empresa = '';
    formData.logo_url = null;
    selectedFile.value = null;
    previewUrl.value = null;
    if (form.value) form.value.resetValidation();
};

const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showErrorToast('El archivo es demasiado grande (Máx. 5MB)');
        return;
    }

    selectedFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
};

const { mutate, isPending } = useMutation({
    mutationFn: createEmpresa,
    onSuccess: () => {
        showSuccessToast('Empresa creada exitosamente');
        queryClient.invalidateQueries({ queryKey: ['empresas'] });
        close();
    },
    onError: (error) => {
        console.error(error);
        showErrorToast(error.response?.data?.error || 'Error al crear la empresa');
    }
});

const handleSubmit = async () => {
    const { valid: isValid } = await form.value.validate();
    if (!isValid) return;

    // Handle File Upload first if exists
    if (selectedFile.value) {
        uploading.value = true;
        try {
            const uploadFormData = { image: selectedFile.value };            
            const uploadResponse = await uploadFile(uploadFormData);
            if (uploadResponse.success && uploadResponse.data?.url) {
                formData.logo_url = uploadResponse.data.url;
            }
        } catch (error) {
            console.error('Upload error:', error);
            showErrorToast('Error al subir el logo, se creará sin imagen.');
        } finally {
            uploading.value = false;
        }
    }

    // Submit Company Data
    mutate(formData);
};

const close = () => {
    internalDialog.value = false;
};
</script>
