<template>
  <v-container fluid class="fill-height pa-0">
    <v-row no-gutters class="fill-height">
      <!-- Left Column: Hero Content -->
      <v-col cols="12" md="6" class="d-flex flex-column justify-center align-start bg-background px-10 py-16">
        <div class="ma-auto" style="max-width: 600px;">
          <!-- Brand / Logo Area -->
          <div class="mb-8 d-flex align-center">
            <v-icon color="secondary" size="48" class="mr-3">mdi-cube-outline</v-icon>
            <h1 class="text-h4 font-weight-bold text-primary">Nexus VCI</h1>
          </div>

          <!-- Main Headline -->
          <h2 class="text-h2 font-weight-bold mb-4 text-primary" style="line-height: 1.2;">
            Optimización operativa en el mundo real.
          </h2>

          <!-- Pitch/Introduction -->
          <p class="text-body-1 text-medium-emphasis mb-8" style="font-size: 1.1rem; line-height: 1.6;">
            Muchos negocios pequeños mueren por descontrol en su trinidad operativa:
            <span class="font-weight-bold text-secondary">Compras, Inventario y Ventas</span>.
            Nexus VCI es un ERP compacto diseñado para centralizar estos tres pilares en una interfaz moderna.
            Aprovechando el Reto Developer Foundations, he integrado IA para transformar datos de inventario
            en decisiones de compra inteligentes, resolviendo el problema de stock muerto y falta de liquidez.
          </p>

          <!-- Call to Action -->
          <div class="d-flex gap-4">
            <v-btn
              color="secondary"
              size="x-large"
              rounded="lg"
              elevation="4"
              prepend-icon="mdi-login"
              to="/auth/login"
              class="text-none px-8 py-3"
            >
              Iniciar Sesión
            </v-btn>
          </div>

          <!-- Footer/Credits -->
          <div class="mt-16 pt-8 border-t">
            <p class="text-caption text-disabled">
              Powered by Vue 3, Node.js & AI Integration
            </p>
          </div>
        </div>
      </v-col>

      <!-- Right Column: Visual/Abstract Background -->
      <v-col cols="12" md="6" class="d-none d-md-flex align-center justify-center position-relative overflow-hidden bg-primary">
        <!-- Abstract gradient circles -->
        <div class="position-absolute" style="top: -20%; right: -20%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(30,41,59,0) 70%); border-radius: 50%;"></div>
        <div class="position-absolute" style="bottom: -10%; left: -10%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(245,158,11,0.15) 0%, rgba(30,41,59,0) 70%); border-radius: 50%;"></div>

        <!-- UI Mockup / Illustration Placeholder -->
        <v-card
          width="80%"
          max-width="600"
          elevation="0"
          rounded="xl"
          class="position-relative backdrop-blur"
          style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);"
        >
          <v-card-text class="d-flex flex-column align-center justify-center py-16 text-center text-white">
            <v-icon size="80" color="white" class="mb-6 opacity-80">mdi-chart-timeline-variant</v-icon>
            <h3 class="text-h4 font-weight-medium mb-2">Control Total</h3>
            <p class="text-body-1 opacity-70 px-8">
              Centraliza tus operaciones y toma decisiones basadas en datos.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  // Setup script
</script>

<style scoped>
.backdrop-blur {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.gap-4 {
  gap: 16px;
}
</style>
