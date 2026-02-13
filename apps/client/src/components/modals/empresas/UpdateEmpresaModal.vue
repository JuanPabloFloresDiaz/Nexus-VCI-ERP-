<template>
  <v-dialog v-model="internalDialog" max-width="700px" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="pa-4 d-flex justify-space-between align-center border-b">
        <span class="text-h6 font-weight-bold">Editar Empresa</span>
        <v-btn icon variant="text" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <v-row>
            <!-- Logo Upload Section -->
            <v-col class="d-flex flex-column align-center mb-4" cols="12">
              <v-avatar class="mb-2 elevation-1 border" color="grey-lighten-4" size="100">
                <v-img v-if="previewUrl || formData.logo_url" cover :src="previewUrl || formData.logo_url" />
                <v-icon v-else color="grey" size="40">mdi-image-plus</v-icon>
              </v-avatar>
              <v-btn
                color="primary"
                :loading="uploading"
                prepend-icon="mdi-upload"
                size="small"
                variant="tonal"
                @click="$refs.fileInput.click()"
              >
                Cambiar Logo
              </v-btn>
              <input
                ref="fileInput"
                accept="image/*"
                class="d-none"
                type="file"
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
                density="comfortable"
                label="Nombre de la Empresa"
                required
                :rules="[v => !!v || 'El nombre es requerido']"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.nit_empresa"
                v-maska="'####-######-###-#'"
                density="comfortable"
                label="NIT"
                placeholder="0000-000000-000-0"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.correo_empresa"
                density="comfortable"
                label="Correo Electrónico"
                :rules="[
                  v => !v || /.+@.+\..+/.test(v) || 'Correo no válido'
                ]"
                type="email"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.telefono_empresa"
                v-maska="'####-####'"
                density="comfortable"
                label="Teléfono"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.direccion_empresa"
                auto-grow
                density="comfortable"
                label="Dirección Física"
                rows="3"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 bg-grey-lighten-5">
        <v-spacer />
        <v-btn
          color="grey-darken-1"
          :disabled="isPending"
          variant="text"
          @click="close"
        >
          Cancelar
        </v-btn>
        <v-btn
          class="px-6"
          color="primary"
          :disabled="!valid"
          :loading="isPending || uploading"
          variant="flat"
          @click="handleSubmit"
        >
          Guardar Cambios
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { useMutation, useQueryClient } from '@tanstack/vue-query';
  import { computed, reactive, ref, watch } from 'vue';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { updateEmpresa } from '@/services/empresas.service';
  import { uploadFile } from '@/services/storage.service';

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

  // Watch for dialog open or empresa prop change to populate form
  watch(
    [internalDialog, () => props.empresa],
    ([isOpen, empresa]) => {
      if (isOpen && empresa) {
        populateForm(empresa);
      }
    }
  );

  function populateForm (data) {
    formData.nombre_empresa = data.nombre_empresa || '';
    formData.nit_empresa = data.nit_empresa || '';
    formData.correo_empresa = data.correo_empresa || '';
    formData.telefono_empresa = data.telefono_empresa || '';
    formData.direccion_empresa = data.direccion_empresa || '';
    formData.logo_url = data.logo_url || null;
    
    selectedFile.value = null;
    previewUrl.value = null;
  }

  function handleFileSelect (event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('El archivo es demasiado grande (Máx. 5MB)');
      return;
    }

    selectedFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => updateEmpresa(props.empresa.id, data),
    onSuccess: () => {
      showSuccessToast('Empresa actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      close();
    },
    onError: (error) => {
      console.error(error);
      showErrorToast(error.response?.data?.error || 'Error al actualizar la empresa');
    }
  });

  async function handleSubmit () {
    if (!props.empresa?.id) return;
    const { valid: isValid } = await form.value.validate();
    if (!isValid) return;

    // Handle File Upload if new file selected
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
        showErrorToast('Error al subir el nuevo logo, se conservará el anterior.');
      } finally {
        uploading.value = false;
      }
    }

    // Submit Update
    mutate(formData);
  }

  function close () {
    internalDialog.value = false;
  }
</script>
