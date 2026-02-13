<script setup>
  import { useMutation, useQuery } from '@tanstack/vue-query';
  import { vMaska } from 'maska/vue'; // Using explicit path for maska v3
  import { computed, ref } from 'vue';
  import { useAuth } from '@/hooks/useAuth';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { createCliente } from '@/services/clientes.service'; // Ensure this service exists
  import { getAllEmpresas } from '@/services/empresas.service'; // Ensure this service exists

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

  async function handleSubmit () {
    const { valid: isValid } = await form.value.validate();
    if (!isValid) return;

    mutate(formData.value);
  }

  function resetForm () {
    formData.value = {
      nombre_cliente: '',
      apellido_cliente: '',
      correo_cliente: '',
      telefono_cliente: '',
      dui_cliente: '',
      id_empresa: null
    };
    if (form.value) form.value.resetValidation();
  }

  function close () {
    emit('update:modelValue', false);
    resetForm();
  }

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
    max-width="600px" 
    :model-value="modelValue" 
    persistent
    @update:model-value="close"
  >
    <v-card>
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-h6 font-weight-bold">
          Nuevo Cliente
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-4">
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <v-row dense>
            <!-- Empresa Selection (SuperAdmin only) -->
            <v-col v-if="isSuperAdmin" cols="12">
              <v-autocomplete
                v-model="formData.id_empresa"
                density="compact"
                item-title="nombre_empresa"
                hint="Asignar cliente a una empresa"
                item-value="id"
                :items="empresas"
                label="Empresa *"
                persistent-hint
                prepend-inner-icon="mdi-domain"
                :rules="[v => !!v || 'Selecciona una empresa']"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.nombre_cliente"
                density="compact"
                label="Nombres *"
                prepend-inner-icon="mdi-account"
                :rules="nameRules"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.apellido_cliente"
                density="compact"
                label="Apellidos *"
                prepend-inner-icon="mdi-account-outline"
                :rules="nameRules"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.correo_cliente"
                density="compact"
                label="Correo Electrónico *"
                prepend-inner-icon="mdi-email"
                :rules="emailRules"
                type="email"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.telefono_cliente"
                v-maska="'####-####'"
                density="compact"
                label="Teléfono"
                placeholder="0000-0000"
                prepend-inner-icon="mdi-phone"
                :rules="phoneRules"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.dui_cliente"
                v-maska="'########-#'"
                density="compact"
                label="DUI"
                placeholder="00000000-0"
                prepend-inner-icon="mdi-card-account-details"
                :rules="duiRules"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-form>
        <small class="text-caption text-medium-emphasis">* Campos requeridos</small>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn color="error" variant="text" @click="close">
          Cancelar
        </v-btn>
        <v-btn 
          color="primary" 
          :disabled="!valid" 
          :loading="isPending" 
          variant="flat"
          @click="handleSubmit"
        >
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
