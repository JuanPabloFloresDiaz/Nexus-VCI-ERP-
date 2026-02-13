<route lang="yaml">
meta:
  layout: AuthLayout
</route>

<script setup>
// Placeholder for password recovery
</script>

<template>
  <v-card class="bg-transparent" flat>
    <div class="mb-8">
      <h2 class="text-h4 font-weight-bold text-primary mb-2">Recuperar Contraseña</h2>
      <p class="text-body-1 text-medium-emphasis">
        Ingresa tu correo electrónico y te enviaremos las instrucciones.
      </p>
    </div>

    <!-- TODO: Implement recovery logic -->
    <v-alert class="mb-6" type="info" variant="tonal">
      Funcionalidad en construcción.
    </v-alert>

    <div class="text-center text-body-2 text-medium-emphasis">
      <router-link 
        class="text-primary text-decoration-none font-weight-bold" 
        to="/auth/login"
      >
        <v-icon icon="mdi-arrow-left" size="small" start />
        Volver al inicio
      </router-link>
    </div>
  </v-card>
</template>
