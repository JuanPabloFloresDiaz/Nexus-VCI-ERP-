<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { authLogin } from '@/services/auth.service';

const router = useRouter();
const loading = ref(false);
const showPassword = ref(false);
const errorMsg = ref('');

const form = reactive({
  email: '',
  password: '',
  rememberMe: false
});

// Reglas de validación simples para UI
const rules = {
  required: v => !!v || 'Este campo es requerido',
  email: v => /.+@.+\..+/.test(v) || 'El correo debe ser válido',
  min: v => v.length >= 8 || 'Mínimo 8 caracteres'
};

const handleLogin = async () => {
  if (!form.email || !form.password) return;
  
  loading.value = true;
  errorMsg.value = '';

  try {
    const payload = {
      correo_electronico: form.email,
      clave_acceso: form.password
    };

    const response = await authLogin(payload);
    
    // Guardar token y usuario (asumiendo estructura de respuesta)
    localStorage.setItem('jwtToken', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Redireccionar al dashboard
    router.push('/dashboard');
  } catch (error) {
    console.error(error);
    errorMsg.value = error.message || 'Credenciales inválidas. Por favor intenta de nuevo.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-card flat class="bg-transparent">
    <div class="mb-8">
      <h2 class="text-h4 font-weight-bold text-primary mb-2">Bienvenido de nuevo</h2>
      <p class="text-body-1 text-medium-emphasis">
        Ingresa tus credenciales para acceder a tu cuenta
      </p>
    </div>

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

    <v-form @submit.prevent="handleLogin">
      <v-text-field
        v-model="form.email"
        label="Correo electrónico"
        placeholder="ejemplo@empresa.com"
        variant="outlined"
        color="primary"
        prepend-inner-icon="mdi-email-outline"
        :rules="[rules.required, rules.email]"
        class="mb-2"
      />

      <v-text-field
        v-model="form.password"
        :type="showPassword ? 'text' : 'password'"
        label="Contraseña"
        placeholder="Ingresa tu contraseña"
        variant="outlined"
        color="primary"
        prepend-inner-icon="mdi-lock-outline"
        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showPassword = !showPassword"
        :rules="[rules.required]"
        class="mb-4"
      />

      <div class="d-flex align-center justify-space-between mb-6">
        <v-checkbox
          v-model="form.rememberMe"
          label="Recordarme"
          color="primary"
          hide-details
          density="compact"
        />
        
        <router-link 
          to="/auth/recovery" 
          class="text-body-2 text-primary text-decoration-none font-weight-medium"
        >
          ¿Olvidaste tu contraseña?
        </router-link>
      </div>

      <v-btn
        type="submit"
        block
        color="primary"
        size="large"
        :loading="loading"
        class="text-none font-weight-bold mb-6"
        elevation="2"
      >
        Iniciar Sesión
      </v-btn>
    </v-form>

    <div class="text-center text-body-2 text-medium-emphasis">
      ¿Aún no tienes cuenta? 
      <router-link 
        to="/auth/register" 
        class="text-primary text-decoration-none font-weight-bold ml-1"
      >
        Regístrate aquí
      </router-link>
    </div>
  </v-card>
</template>
