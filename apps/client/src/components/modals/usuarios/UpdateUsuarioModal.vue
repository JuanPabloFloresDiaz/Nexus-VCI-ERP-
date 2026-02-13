<script setup>
  import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
  import { computed, reactive, ref, watch } from 'vue';
  import { useAuth } from '@/hooks/useAuth';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { getAllEmpresas } from '@/services/empresas.service';
  import { updateUsuario } from '@/services/usuarios.service';

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

  async function handleSubmit () {
    const { valid } = await form.value.validate();
    if (!valid) return;

    const payload = { ...userData };
    if (!isSuperAdmin.value) delete payload.id_empresa;
    
    // We don't send password here
    mutate(payload);
  }

  function handleClose () {
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
      <v-card-title class="d-flex justify-space-between align-center pa-4 text-h5 font-weight-bold text-primary">
        Editar Usuario
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

            <v-col cols="12">
              <v-switch
                v-model="userData.estado_usuario"
                color="success"
                hide-details
                inset
                label="Estado del Usuario"
              >
                <template #label>
                  <span :class="userData.estado_usuario ? 'text-success' : 'text-error'">
                    {{ userData.estado_usuario ? 'Activo' : 'Inactivo' }}
                  </span>
                </template>
              </v-switch>
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
          Guardar Cambios
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
