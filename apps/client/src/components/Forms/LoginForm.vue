<script setup>
  import { reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuth } from '@/hooks/useAuth';

  const router = useRouter();
  const { login } = useAuth();

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

  async function handleLogin () {
    if (!form.email || !form.password) return;
  
    loading.value = true;
    errorMsg.value = '';

    try {
      const payload = {
        correo_electronico: form.email,
        clave_acceso: form.password
      };

      const result = await login(payload);
    
      if (result.success) {
        // Redireccionar al dashboard
        router.push('/main/dashboard');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(error);
      errorMsg.value = error.message || 'Credenciales inválidas. Por favor intenta de nuevo.';
    } finally {
      loading.value = false;
    }
  }
</script>

<template>
  <v-card class="bg-transparent" flat>
    <div class="mb-8">
      <h2 class="text-h4 font-weight-bold text-primary mb-2">Bienvenido de nuevo</h2>
      <p class="text-body-1 text-medium-emphasis">
        Ingresa tus credenciales para acceder a tu cuenta
      </p>
    </div>

    <v-alert
      v-if="errorMsg"
      class="mb-6"
      closable
      type="error"
      variant="tonal"
      @click:close="errorMsg = ''"
    >
      {{ errorMsg }}
    </v-alert>

    <v-form @submit.prevent="handleLogin">
      <v-text-field
        v-model="form.email"
        class="mb-2"
        color="primary"
        label="Correo electrónico"
        placeholder="ejemplo@empresa.com"
        prepend-inner-icon="mdi-email-outline"
        :rules="[rules.required, rules.email]"
        variant="outlined"
      />

      <v-text-field
        v-model="form.password"
        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        class="mb-4"
        color="primary"
        label="Contraseña"
        placeholder="Ingresa tu contraseña"
        prepend-inner-icon="mdi-lock-outline"
        :rules="[rules.required]"
        :type="showPassword ? 'text' : 'password'"
        variant="outlined"
        @click:append-inner="showPassword = !showPassword"
      />

      <div class="d-flex align-center justify-space-between mb-6">
        <v-checkbox
          v-model="form.rememberMe"
          color="primary"
          density="compact"
          hide-details
          label="Recordarme"
        />
        
        <router-link 
          class="text-body-2 text-primary text-decoration-none font-weight-medium" 
          to="/auth/recovery"
        >
          ¿Olvidaste tu contraseña?
        </router-link>
      </div>

      <v-btn
        block
        class="text-none font-weight-bold mb-6"
        color="primary"
        elevation="2"
        :loading="loading"
        size="large"
        type="submit"
      >
        Iniciar Sesión
      </v-btn>
    </v-form>

    <div class="text-center text-body-2 text-medium-emphasis">
      ¿Aún no tienes cuenta? 
      <router-link 
        class="text-primary text-decoration-none font-weight-bold ml-1" 
        to="/auth/register"
      >
        Regístrate aquí
      </router-link>
    </div>
  </v-card>
</template>
