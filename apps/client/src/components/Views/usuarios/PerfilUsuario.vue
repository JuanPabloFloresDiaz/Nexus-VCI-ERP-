<script setup>
  import { useHead } from '@unhead/vue';
  import { useAuth } from '@/hooks/useAuth';
  import AsyncAvatar from '@/components/common/AsyncAvatar.vue';

  // --- SEO ---
  useHead({
    title: 'Mi Perfil',
    meta: [
      { name: 'description', content: 'Gestión de perfil del usuario.' }
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });

  const { user } = useAuth();
</script>

<template>
  <v-container class="fill-height justify-center">
    <v-card class="rounded-lg" elevation="2" width="600">
      <v-card-item class="bg-primary text-white py-4">
        <template #prepend>
          <AsyncAvatar 
             class="mr-4 border-2 border-white"
             color="white"
             :name="user?.nombre_usuario"
             size="64"
             :src="user?.foto_perfil_url"
             variant="flat"
          />
        </template>
        <v-card-title class="text-h5 font-weight-bold">
          Mi Perfil
        </v-card-title>
        <v-card-subtitle class="text-white opacity-80">
          {{ user?.rol_usuario }}
        </v-card-subtitle>
      </v-card-item>

      <v-list class="py-0">
        <v-list-item class="py-4">
          <template #prepend>
            <v-icon class="mr-4" color="secondary">mdi-account</v-icon>
          </template>
          <v-list-item-title class="text-caption text-medium-emphasis">Nombre Completo</v-list-item-title>
          <v-list-item-subtitle class="text-body-1 text-high-emphasis">
            {{ user?.nombre_usuario }}
          </v-list-item-subtitle>
        </v-list-item>

        <v-divider />

        <v-list-item class="py-4">
          <template #prepend>
            <v-icon class="mr-4" color="secondary">mdi-email</v-icon>
          </template>
          <v-list-item-title class="text-caption text-medium-emphasis">Correo Electrónico</v-list-item-title>
          <v-list-item-subtitle class="text-body-1 text-high-emphasis">
            {{ user?.correo_electronico }}
          </v-list-item-subtitle>
        </v-list-item>

        <v-divider />
                
        <v-list-item v-if="user?.empresa" class="py-4">
          <template #prepend>
            <v-icon class="mr-4" color="secondary">mdi-domain</v-icon>
          </template>
          <v-list-item-title class="text-caption text-medium-emphasis">Empresa</v-list-item-title>
          <v-list-item-subtitle class="text-body-1 text-high-emphasis">
            {{ user?.empresa?.nombre_empresa || 'N/A' }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>
