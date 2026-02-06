<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { authRegister } from '@/services/auth.service';

const router = useRouter();
const step = ref(1);
const loading = ref(false);
const errorMsg = ref('');
const showPassword = ref(false);

const form = reactive({
  // Step 1: Empresa
  nombre_empresa: '',
  nit_empresa: '',
  telefono_empresa: '',
  direccion_empresa: '',
  logo: null,
  
  // Step 2: Usuario
  nombre_usuario: '',
  correo_electronico: '',
  clave_acceso: ''
});

// Reglas de validación
const rules = {
  required: v => !!v || 'Este campo es requerido',
  email: v => /.+@.+\..+/.test(v) || 'El correo debe ser válido',
  min: v => (v && v.length >= 8) || 'Mínimo 8 caracteres',
  phone: v => !v || /^\d{4}-\d{4}$/.test(v) || 'Formato: 0000-0000'
};

const nextStep = () => {
  if (step.value === 1) {
    if (!form.nombre_empresa) {
        errorMsg.value = "Ingresa el nombre de la empresa";
        return;
    }
    // Basic validation passed
    errorMsg.value = '';
    step.value = 2;
  }
};

const handleRegister = async () => {
  if (!form.correo_electronico || !form.clave_acceso || !form.nombre_usuario) return;

  loading.value = true;
  errorMsg.value = '';

  try {
    // Usamos el servicio que detecta archivos para FormData si es necesario
    // Aunque el backend actual espera JSON, preparamos la estructura
    const payload = {
      nombre_empresa: form.nombre_empresa,
      nit_empresa: form.nit_empresa,
      telefono_empresa: form.telefono_empresa,
      direccion_empresa: form.direccion_empresa,
      nombre_usuario: form.nombre_usuario,
      correo_electronico: form.correo_electronico,
      clave_acceso: form.clave_acceso
    };
    
    // Si hay logo, el AxiosRequest convertirá todo a FormData
    if (form.logo) {
        payload.logo = form.logo;
    }

    await authRegister(payload);
    
    // Redirigir al login con mensaje de éxito (o auto-login)
    // Por ahora, redirigimos al login
    router.push({ path: '/auth/login', query: { registered: 'true' } });
  } catch (error) {
    console.error(error);
    errorMsg.value = error.message || 'Error al registrar la cuenta.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-card flat class="bg-transparent">
    <div class="mb-6">
      <h2 class="text-h4 font-weight-bold text-primary mb-2">Crear cuenta</h2>
      <p class="text-body-1 text-medium-emphasis">
        {{ step === 1 ? 'Paso 1: Datos de tu Empresa' : 'Paso 2: Datos del Administrador' }}
      </p>
    </div>

    <!-- Indicador de pasos -->
    <v-progress-linear
        :model-value="step === 1 ? 50 : 100"
        color="primary"
        height="6"
        rounded
        class="mb-8"
    ></v-progress-linear>

    <v-alert
      v-if="errorMsg"
      type="error"
      variant="tonal"
      class="mb-6"
      closable
      @click:close="errorMsg = ''"
    >
      {{ errorMsg }}
    </v-alert>

    <v-form @submit.prevent="step === 1 ? nextStep() : handleRegister()">
      <v-window v-model="step">
        <!-- Paso 1: Empresa -->
        <v-window-item :value="1">
            <v-text-field
                v-model="form.nombre_empresa"
                label="Nombre de la Empresa *"
                placeholder="Tech Solutions S.A."
                variant="outlined"
                color="primary"
                prepend-inner-icon="mdi-domain"
                :rules="[rules.required]"
                class="mb-2"
            />

            <v-row>
                <v-col cols="12" sm="6">
                    <v-text-field
                        v-model="form.nit_empresa"
                        label="NIT / Registro"
                        placeholder="0000-000000-000-0"
                        variant="outlined"
                        color="primary"
                        class="mb-2"
                    />
                </v-col>
                <v-col cols="12" sm="6">
                    <v-text-field
                        v-model="form.telefono_empresa"
                        label="Teléfono"
                        placeholder="2222-2222"
                        variant="outlined"
                        color="primary"
                        prepend-inner-icon="mdi-phone"
                        class="mb-2"
                    />
                </v-col>
            </v-row>

            <v-textarea
                v-model="form.direccion_empresa"
                label="Dirección Física"
                variant="outlined"
                color="primary"
                rows="2"
                auto-grow
                class="mb-2"
            />
            
            <v-file-input
                v-model="form.logo"
                label="Logo de la Empresa"
                variant="outlined"
                color="primary"
                prepend-icon=""
                prepend-inner-icon="mdi-camera"
                accept="image/*"
                show-size
                class="mb-2"
            />

            <v-btn
                block
                color="primary"
                size="large"
                class="text-none font-weight-bold mt-4"
                elevation="2"
                @click="nextStep"
            >
                Siguiente
                <v-icon end icon="mdi-arrow-right" />
            </v-btn>
        </v-window-item>

        <!-- Paso 2: Usuario -->
        <v-window-item :value="2">
            <v-text-field
                v-model="form.nombre_usuario"
                label="Nombre Completo *"
                placeholder="Juan Pérez"
                variant="outlined"
                color="primary"
                prepend-inner-icon="mdi-account"
                :rules="[rules.required]"
                class="mb-2"
            />

            <v-text-field
                v-model="form.correo_electronico"
                label="Correo Electrónico *"
                placeholder="juan@empresa.com"
                variant="outlined"
                color="primary"
                prepend-inner-icon="mdi-email"
                :rules="[rules.required, rules.email]"
                class="mb-2"
            />

            <v-text-field
                v-model="form.clave_acceso"
                :type="showPassword ? 'text' : 'password'"
                label="Contraseña *"
                placeholder="Mínimo 8 caracteres"
                variant="outlined"
                color="primary"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                :rules="[rules.required, rules.min]"
                class="mb-4"
            />

            <div class="d-flex gap-4 mt-4">
                <v-btn
                    variant="text"
                    size="large"
                    class="text-none"
                    @click="step = 1"
                    :disabled="loading"
                >
                    <v-icon start icon="mdi-arrow-left" />
                    Atrás
                </v-btn>

                <v-btn
                    type="submit"
                    color="primary"
                    size="large"
                    :loading="loading"
                    class="text-none font-weight-bold flex-grow-1"
                    elevation="2"
                >
                    Registrar Cuenta
                </v-btn>
            </div>
        </v-window-item>
      </v-window>
    </v-form>

    <div class="text-center text-body-2 text-medium-emphasis mt-6">
      ¿Ya tienes cuenta? 
      <router-link 
        to="/auth/login" 
        class="text-primary text-decoration-none font-weight-bold ml-1"
      >
        Inicia sesión aquí
      </router-link>
    </div>
  </v-card>
</template>
