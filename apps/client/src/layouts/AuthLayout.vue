<script setup>
  import heroImage from '@/assets/hero-1.avif';
</script>

<template>
  <v-app>
    <v-container class="pa-0 fill-height" fluid>
      <!-- Content kept same -->
      <v-row class="fill-height" no-gutters>
        <!-- Sección Izquierda: Imagen y Branding -->
        <v-col class="d-none d-md-flex relative position-relative" cols="12" lg="7" md="6">
          <v-img
            class="fill-height image-overlay"
            cover
            :src="heroImage"
          >
            <div class="d-flex flex-column fill-height justify-space-between pa-16 text-white overlay-content">
              <div class="branding">
                <div class="d-flex align-center gap-4 mb-4">
                  <!-- Logo Placeholder if needed -->
                  <!-- <v-img src="@/assets/logo.png" width="40" height="40" /> -->
                </div>
              </div>
            
              <div class="hero-text mb-16">
                <h1 class="text-h2 font-weight-bold mb-4">Nexus VCI</h1>
                <p class="text-h5 font-weight-light opacity-90" style="max-width: 600px; line-height: 1.6;">
                  Gestión empresarial inteligente, simplificada y eficiente. 
                  Todo lo que necesitas para escalar tu negocio en una sola plataforma.
                </p>
              </div>

              <div class="copyright text-caption opacity-70">
                &copy; {{ new Date().getFullYear() }} Nexus VCI ERP. Todos los derechos reservados.
              </div>
            </div>
          </v-img>
        </v-col>

        <!-- Sección Derecha: Formularios -->
        <v-col class="d-flex align-center justify-center bg-surface" cols="12" lg="5" md="6">
          <div class="w-100 pa-8 pa-sm-12" style="max-width: 550px">
            <!-- Transición para las vistas (Login/Register) -->
            <router-view v-slot="{ Component }">
              <v-slide-x-transition mode="out-in">
                <component :is="Component" />
              </v-slide-x-transition>
            </router-view>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<style scoped>
.image-overlay :deep(.v-img__img) {
  filter: brightness(0.85);
}

.overlay-content {
  background: linear-gradient(
    to right,
    rgba(30, 41, 59, 0.9) 0%,
    rgba(30, 41, 59, 0.7) 50%,
    rgba(30, 41, 59, 0.4) 100%
  );
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.text-h2 {
  font-family: 'Roboto', sans-serif;
  letter-spacing: -0.02em;
}
</style>
