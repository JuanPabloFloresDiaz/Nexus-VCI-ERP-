<route lang="yaml">
meta:
  layout: AuthLayout
</route>

<script setup>
// Placeholder for password recovery
</script>

<template>
  <v-card flat class="bg-transparent">
    <div class="mb-8">
      <h2 class="text-h4 font-weight-bold text-primary mb-2">Recuperar Contraseña</h2>
      <p class="text-body-1 text-medium-emphasis">
        Ingresa tu correo electrónico y te enviaremos las instrucciones.
      </p>
    </div>

    <!-- TODO: Implement recovery logic -->
    <v-alert type="info" variant="tonal" class="mb-6">
        Funcionalidad en construcción.
    </v-alert>

    <div class="text-center text-body-2 text-medium-emphasis">
      <router-link 
        to="/auth/login" 
        class="text-primary text-decoration-none font-weight-bold"
      >
        <v-icon start icon="mdi-arrow-left" size="small" />
        Volver al inicio
      </router-link>
    </div>
  </v-card>
</template>
