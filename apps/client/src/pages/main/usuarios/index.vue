<route lang="yaml">
path: /main/usuarios
meta:
  layout: MainLayout
  title: Gestión de Usuarios
</route>

<script setup>
import { computed } from 'vue';
import { useAuth } from '@/hooks/useAuth';
import UsuariosView from '@/components/Views/usuarios/UsuariosView.vue';
import PerfilUsuario from '@/components/Views/usuarios/PerfilUsuario.vue';

const { user } = useAuth();

const isVendor = computed(() => user.value?.rol_usuario === 'Vendedor');
</script>

<template>
  <div class="fill-height">
    <PerfilUsuario v-if="isVendor" />
    <UsuariosView v-else />
  </div>
</template>
