<script setup>
  import { useMutation, useQuery } from '@tanstack/vue-query';
  import { vMaska } from 'maska/vue';
  import { computed, reactive, ref, watch } from 'vue';
  import { useAuth } from '@/hooks/useAuth';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { getAllEmpresas } from '@/services/empresas.service';
  import { updateProveedor } from '@/services/proveedores.service';

  const props = defineProps({
    modelValue: Boolean,
    proveedor: {
      type: Object,
      required: true
    }
  });

  const emit = defineEmits(['update:modelValue', 'success']);

  const { isSuperAdmin } = useAuth();

  // Form State
  const valid = ref(false);
  const form = ref(null);

  const formData = reactive({
    nombre_proveedor: '',
    contacto_nombre: '',
    correo_proveedor: '',
    telefono_proveedor: '',
    nit_dui_proveedor: '',
    direccion_proveedor: '',
    dias_credito: 0,
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

  // Watch for prop changes to fill form
  watch(() => props.proveedor, (newItem) => {
    if (newItem) {
      formData.nombre_proveedor = newItem.nombre_proveedor;
      formData.contacto_nombre = newItem.contacto_nombre;
      formData.correo_proveedor = newItem.correo_proveedor;
      formData.telefono_proveedor = newItem.telefono_proveedor;
      formData.nit_dui_proveedor = newItem.nit_dui_proveedor;
      formData.direccion_proveedor = newItem.direccion_proveedor;
      formData.dias_credito = newItem.dias_credito;
      formData.id_empresa = newItem.id_empresa; // Important for SuperAdmin
    }
  }, { immediate: true });

  // Mutation
  const { mutate, isPending } = useMutation({
    mutationFn: (data) => updateProveedor(props.proveedor.id, data),
    onSuccess: () => {
      showSuccessToast('Proveedor actualizado exitosamente');
      emit('success');
      close();
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.error || 'Error al actualizar proveedor');
    }
  });

  async function submit () {
    const { valid: isValid } = await form.value.validate();
    if (!isValid) return;

    const payload = { ...formData };
    // Remove if not SuperAdmin just in case, though backend validates
    if (!isSuperAdmin.value) {
      delete payload.id_empresa;
    }

    mutate(payload);
  }

  function close () {
    emit('update:modelValue', false);
  }
</script>

<template>
  <v-dialog
    max-width="600px"
    :model-value="modelValue"
    persistent
    @update:model-value="close"
  >
    <v-card>
      <v-card-title class="bg-primary text-white d-flex align-center justify-space-between">
        Editar Proveedor
        <v-btn icon variant="text" @click="close">
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <v-form ref="form" v-model="valid" @submit.prevent="submit">
          <v-row dense>
            <!-- Company Selection (SuperAdmin) -->
            <v-col v-if="isSuperAdmin" cols="12">
              <v-autocomplete
                v-model="formData.id_empresa"
                density="compact"
                item-title="nombre_empresa"
                item-value="id"
                :items="empresas"
                label="Empresa"
                required
                :rules="[rules.required]"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.nombre_proveedor"
                density="compact"
                label="Nombre del Proveedor *"
                :rules="[rules.required, rules.min3]"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.contacto_nombre"
                density="compact"
                label="Nombre del Contacto"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.telefono_proveedor"
                v-maska="'####-####'"
                density="compact"
                label="Teléfono"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.correo_proveedor"
                density="compact"
                label="Correo Electrónico"
                :rules="[rules.email]"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.nit_dui_proveedor"
                v-maska="'####-######-###-#'"
                density="compact"
                label="NIT / DUI"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.dias_credito"
                density="compact"
                label="Días de Crédito"
                min="0"
                type="number"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.direccion_proveedor"
                density="compact"
                label="Dirección"
                rows="2"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-6 pt-0">
        <v-spacer />
        <v-btn color="grey-darken-1" variant="text" @click="close">Cancelar</v-btn>
        <v-btn
          color="primary"
          :disabled="isPending"
          :loading="isPending"
          variant="elevated"
          @click="submit"
        >
          Actualizar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
