<script setup>
  import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
  import { computed, reactive, ref } from 'vue';
  import { useAuth } from '@/hooks/useAuth';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { getAllEmpresas } from '@/services/empresas.service'; // Need this for SuperAdmin
  import { createUsuario } from '@/services/usuarios.service';

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

  async function handleSubmit () {
    const { valid } = await form.value.validate();
    if (!valid) return;

    const payload = { ...userData };
    // Clean payload
    if (!isSuperAdmin.value) delete payload.id_empresa;

    mutate(payload);
  }

  function handleClose () {
    userData.nombre_usuario = '';
    userData.correo_electronico = '';
    userData.clave_acceso = '';
    userData.rol_usuario = null;
    userData.id_empresa = null;
    emit('update:modelValue', false);
  }
</script>

<template>
  <v-dialog
    max-width="600"
    :model-value="modelValue"
    persistent
    @update:model-value="handleClose"
  >
    <v-card class="rounded-lg">
      <v-card-title class="d-flex justify-space-between align-center pa-4 text-h5 font-weight-bold text-secondary">
        Nuevo Usuario
        <v-btn icon variant="text" @click="handleClose">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
            
      <v-divider />

      <v-card-text class="pa-4">
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <v-row>
            <!-- Empresa Selector (SuperAdmin Only) -->
            <v-col v-if="isSuperAdmin" cols="12">
              <v-autocomplete
                v-model="userData.id_empresa"
                color="primary"
                density="comfortable"
                item-title="nombre_empresa"
                item-value="id"
                :items="empresas"
                label="Empresa"
                prepend-inner-icon="mdi-domain"
                :rules="[rules.required]"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="userData.nombre_usuario"
                color="primary"
                density="comfortable"
                label="Nombre Completo"
                prepend-inner-icon="mdi-account"
                :rules="[rules.required]"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="userData.correo_electronico"
                color="primary"
                density="comfortable"
                label="Correo Electrónico"
                prepend-inner-icon="mdi-email"
                :rules="[rules.required, rules.email]"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="userData.clave_acceso"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                color="primary"
                density="comfortable"
                label="Contraseña"
                prepend-inner-icon="mdi-lock"
                :rules="[rules.required, rules.min]"
                :type="showPassword ? 'text' : 'password'"
                variant="outlined"
                @click:append-inner="showPassword = !showPassword"
              />
            </v-col>

            <v-col cols="12">
              <v-select
                v-model="userData.rol_usuario"
                color="primary"
                density="comfortable"
                :items="availableRoles"
                label="Rol"
                prepend-inner-icon="mdi-shield-account"
                :rules="[rules.required]"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          color="medium-emphasis"
          variant="text"
          @click="handleClose"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          :loading="isPending"
          variant="flat"
          @click="handleSubmit"
        >
          Crear Usuario
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
