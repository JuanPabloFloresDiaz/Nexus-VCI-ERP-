<route lang="yaml">
path: /main/compras
meta:
  layout: MainLayout
  title: Gestión de Compras
</route>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { computed } from 'vue';
import ComprasView from '@/components/Views/compras/ComprasView.vue';
import ComprasEmpresaView from '@/components/Views/compras/ComprasEmpresaView.vue';

const authStore = useAuthStore();
const userRole = computed(() => authStore.user?.rol);

const isVendor = computed(() => userRole.value === 'Vendedor');
</script>

<template>
    <ComprasEmpresaView v-if="isVendor" />
    <ComprasView v-else />
</template>
