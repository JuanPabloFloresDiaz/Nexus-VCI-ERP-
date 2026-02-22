<script setup>
  import { useHead } from '@unhead/vue';
  import { useRouter } from 'vue-router';
  import heroImage from '@/assets/hero-1.avif';
  
  import IconChart from '@/components/icons/Chart.vue';
  import IconGithub from '@/components/icons/Github.vue';
  import IconJavaScript from '@/components/icons/JavaScript.vue';
  // Icons
  import IconLinkedIn from '@/components/icons/LinkedIn.vue';
  import IconMariaDB from '@/components/icons/MariaDB.vue';
  import IconNode from '@/components/icons/Node.vue';
  import IconPinia from '@/components/icons/Pinia.vue';
  import IconPlatzi from '@/components/icons/Platzi.vue';
  import IconSequelize from '@/components/icons/Sequelize.vue';
  import IconTanstack from '@/components/icons/Tanstack.vue';
  import IconVue from '@/components/icons/Vue.vue';
  import IconVuetify from '@/components/icons/Vuetify.vue';

  const router = useRouter();

  // --- SEO ---
  useHead({
    title: 'Nexus VCI - ERP Inteligente para Pymes',
    meta: [
      { name: 'description', content: 'Optimiza compras, inventario y ventas con Inteligencia Artificial. Elimina el stock muerto y mejora tu liquidez.' },
      // Open Graph
      { property: 'og:title', content: 'Nexus VCI - ERP Inteligente para Pymes' },
      { property: 'og:description', content: 'Optimiza compras, inventario y ventas con Inteligencia Artificial. Elimina el stock muerto y mejora tu liquidez.' },
      { property: 'og:image', content: 'https://cdn.vuetifyjs.com/images/cards/server-room.jpg' }, // Using the dashboard/hero image as fallback
      { property: 'og:type', content: 'website' },
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Nexus VCI - ERP Inteligente para Pymes' },
      { name: 'twitter:description', content: 'Optimiza compras, inventario y ventas con Inteligencia Artificial. Elimina el stock muerto y mejora tu liquidez.' },
      { name: 'twitter:image', content: 'https://cdn.vuetifyjs.com/images/cards/server-room.jpg' }
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });

  const modules = [
    {
      icon: 'mdi-package-variant-closed',
      title: 'Inventario Preciso',
      description: 'Control total de stock, variantes y categorización. Nunca más pierdas una venta por falta de producto.'
    },
    {
      icon: 'mdi-point-of-sale',
      title: 'Ventas Ágiles',
      description: 'Punto de venta (POS) rápido y moderno. Facturación eficiente y gestión de clientes integrada.'
    },
    {
      icon: 'mdi-cart-arrow-down',
      title: 'Compras Inteligentes',
      description: 'Gestión de proveedores automatizada. La IA sugiere qué comprar y cuándo para evitar sobrestock.'
    },
    {
      icon: 'mdi-brain',
      title: 'Inteligencia Artificial',
      description: 'Predicciones de demanda y análisis de tendencias. Toma decisiones basadas en datos, no en intuición.'
    }
  ];
</script>

<template>
  <div class="bg-surface">
    <!-- Navbar -->
    <v-app-bar class="px-md-16 px-4" color="white" elevation="1" height="80">
      <div class="d-flex align-center">
        <v-icon class="mr-3" color="primary" size="32">mdi-cube-outline</v-icon>
        <div class="text-h6 font-weight-bold text-primary">Nexus VCI</div>
      </div>
      <v-spacer />
      <div class="d-none d-md-flex gap-4">
        <v-btn color="primary" to="/auth/login" variant="text">Iniciar Sesión</v-btn>
        <v-btn color="primary" elevation="2" to="/auth/register" variant="flat">Crear Cuenta</v-btn>
      </div>
    </v-app-bar>

    <!-- Hero Section -->
    <section class="position-relative pt-16 pb-16 overflow-hidden">
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-chip
              class="mb-4"
              color="secondary"
              label
              size="small"
              variant="tonal"
            >
              Developer Foundations Challenge 2025
            </v-chip>
            <h1 class="text-h2 font-weight-bold text-primary mb-6" style="line-height: 1.1;">
              Optimización operativa en el mundo real.
            </h1>
            <p class="text-h6 text-medium-emphasis font-weight-regular mb-8" style="line-height: 1.6;">
              Nexus VCI es el ERP compacto que centraliza la <span class="font-weight-bold text-secondary">Trinidad Operativa</span>: Compras, Inventario y Ventas. Integrado con IA para transformar tus datos en liquidez.
            </p>
            <div class="d-flex flex-wrap gap-4">
              <v-btn
                color="secondary"
                elevation="3"
                height="56"
                prepend-icon="mdi-rocket-launch"
                rounded="lg"
                size="large"
                to="/auth/register"
              >
                Empezar Gratis
              </v-btn>
              <v-btn
                color="primary"
                height="56"
                prepend-icon="mdi-play-circle-outline"
                rounded="lg"
                size="large"
                variant="outlined"
              >
                Ver Demo
              </v-btn>
            </div>
          </v-col>
          <v-col class="position-relative d-none d-md-block" cols="12" md="6">
            <!-- abstract geometric shapes behind -->
            <div class="blob-bg opacity-20" />
            <v-img
              alt="Nexus VCI Hero"
              class="rounded-xl elevation-10 border"
              cover
              position="top"
              :src="heroImage" 
              style="transform: perspective(1000px) rotateY(-5deg) rotateX(2deg);"
            >
              <!-- Optional overlay content if the image needs it, otherwise clean -->
            </v-img>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Problem / Solution Section -->
    <section class="bg-grey-lighten-5 py-16">
      <v-container>
        <v-row justify="center">
          <v-col class="text-center" cols="12" md="8">
            <h2 class="text-h3 font-weight-bold text-primary mb-4">El Problema de la "Caja Negra"</h2>
            <p class="text-body-1 text-medium-emphasis mb-12">
              Muchos negocios mueren por descontrol. Compran por intuición, acumulan stock que no se vende y pierden ventas por no tener lo que el cliente busca.
            </p>
          </v-col>
        </v-row>

        <v-row class="mt-8" justify="center">
          <v-col cols="12" md="4">
            <v-card class="h-100 py-6 px-4 border-t-error" color="white" elevation="2">
              <div class="d-flex justify-center mb-4">
                <v-avatar color="red-lighten-5" size="64">
                  <v-icon color="error" size="32">mdi-cart-off</v-icon>
                </v-avatar>
              </div>
              <h3 class="text-h6 font-weight-bold text-center mb-2">Stock Muerto</h3>
              <p class="text-body-2 text-center text-medium-emphasis">
                Capital estancado en productos que no rotan, ocupando espacio y perdiendo valor.
              </p>
            </v-card>
          </v-col>
          <v-col class="d-flex align-center justify-center" cols="12" md="1">
            <v-icon color="medium-emphasis" size="48">mdi-arrow-right-thick</v-icon>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="h-100 py-6 px-4 border-t-success" color="white" elevation="2">
              <div class="d-flex justify-center mb-4">
                <v-avatar color="green-lighten-5" size="64">
                  <v-icon color="success" size="32">mdi-robot-happy</v-icon>
                </v-avatar>
              </div>
              <h3 class="text-h6 font-weight-bold text-center mb-2">Decisiones con IA</h3>
              <p class="text-body-2 text-center text-medium-emphasis">
                Nexus analiza historial y tendencias para sugerir compras exactas y liberar tu flujo de caja.
              </p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Modules Grid -->
    <section class="py-16">
      <v-container>
        <div class="text-center mb-16">
          <h2 class="text-h3 font-weight-bold text-primary">Todo en una sola plataforma</h2>
          <p class="text-h6 text-medium-emphasis mt-4">Módulos integrados para una gestión sin fricción</p>
        </div>

        <v-row>
          <v-col
            v-for="module in modules"
            :key="module.title"
            cols="12"
            md="3"
            sm="6"
          >
            <v-card class="h-100 hover-card" elevation="0" variant="outlined">
              <v-card-text class="pa-6">
                <v-avatar class="mb-4" color="primary-lighten-5" rounded="lg" size="56">
                  <v-icon color="primary" size="28">{{ module.icon }}</v-icon>
                </v-avatar>
                <h3 class="text-h6 font-weight-bold mb-2">{{ module.title }}</h3>
                <p class="text-body-2 text-medium-emphasis" style="line-height: 1.6;">
                  {{ module.description }}
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- CTA Section -->
    <section class="bg-primary text-white py-16">
      <v-container class="text-center">
        <h2 class="text-h3 font-weight-bold mb-6">¿Listo para retomar el control?</h2>
        <p class="text-h6 opacity-80 mb-8 mx-auto" style="max-width: 700px;">
          Únete a los empresarios que ya están optimizando su operación con Nexus VCI.
        </p>
        <v-btn
          class="text-primary font-weight-bold px-8"
          color="white"
          height="56"
          rounded="lg"
          size="large"
          to="/auth/register"
        >
          Crear Cuenta Gratis
        </v-btn>
      </v-container>
    </section>

    <!-- Footer -->
    <v-footer class="bg-grey-darken-4 py-12">
      <v-container>
        <v-row align="center" justify="center">
          <v-col class="text-center" cols="12">
            <div class="d-flex align-center justify-center mb-6">
              <v-icon class="mr-2" color="white" size="32">mdi-cube-outline</v-icon>
              <span class="text-h5 font-weight-bold">Nexus VCI</span>
            </div>

            <p class="text-body-2 opacity-60 mb-2">
              Technology Stack
            </p>
            
            <!-- Tech Stack Icons -->
            <div class="d-flex justify-center flex-wrap gap-6 mb-8 align-center">
              <a class="tech-icon" href="https://vuejs.org/" target="_blank" title="Vue.js"><IconVue /></a>
              <a class="tech-icon" href="https://vuetifyjs.com/" target="_blank" title="Vuetify"><IconVuetify /></a>
              <a class="tech-icon" href="https://pinia.vuejs.org/" target="_blank" title="Pinia"><IconPinia /></a>
              <a class="tech-icon" href="https://www.chartjs.org/" target="_blank" title="Chart.js"><IconChart /></a>
              <a class="tech-icon" href="https://tanstack.com/" target="_blank" title="TanStack"><IconTanstack /></a>
              <a class="tech-icon" href="https://mariadb.org/" target="_blank" title="MariaDB"><IconMariaDB /></a>
              <a class="tech-icon" href="https://nodejs.org/" target="_blank" title="Node.js"><IconNode /></a>
              <a class="tech-icon" href="https://sequelize.org/" target="_blank" title="Sequelize"><IconSequelize /></a>
              <a class="tech-icon" href="https://developer.mozilla.org/es/docs/Web/JavaScript" target="_blank" title="JavaScript"><IconJavaScript style="border-radius: 4px;" /></a>
            </div>

            <p class="text-body-2 opacity-60 mb-2">
              Developed by Juan Pablo Flores for Developer Foundations Challenge 2025.
            </p>
            
            <!-- Social Links -->
            <div class="d-flex justify-center gap-4 mb-6">
              <a class="social-icon" href="https://www.linkedin.com/in/juan-pablo-flores-díaz-5271b533a" target="_blank" title="LinkedIn"><IconLinkedIn /></a>
              <a class="social-icon" href="https://github.com/JuanPabloFloresDiaz/Nexus-VCI-ERP-" target="_blank" title="GitHub"><IconGithub /></a>
              <a class="social-icon" href="https://platzi.com/p/pablojuanfd/" target="_blank" title="Platzi"><IconPlatzi /></a>
            </div>

            <p class="text-caption opacity-40">
              &copy; {{ new Date().getFullYear() }} Nexus VCI ERP. All rights reserved.
            </p>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </div>
</template>

<style scoped>
.gap-4 { gap: 16px; }
.gap-6 { gap: 24px; }

.tech-icon {
  width: 40px;
  height: 40px;
  opacity: 0.7;
  transition: opacity 0.2s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tech-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}

.social-icon {
  width: 32px;
  height: 32px;
  color: white; /* Fallback */
  opacity: 0.8;
  transition: all 0.2s;
  display: block;
}

.social-icon:hover {
  opacity: 1;
  transform: translateY(-2px);
}

.blob-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.4), transparent 70%);
  z-index: 0;
}

.hover-card {
  transition: transform 0.2s, border-color 0.2s;
}

.hover-card:hover {
  transform: translateY(-5px);
  border-color: rgb(var(--v-theme-primary));
}

.border-t-error {
  border-top: 4px solid rgb(var(--v-theme-error)) !important;
}

.border-t-success {
  border-top: 4px solid rgb(var(--v-theme-success)) !important;
}
</style>
