<route lang="yaml">
meta:
  layout: MainLayout
  title: Categorización
</route>

<script setup>
  import { computed } from 'vue';
  import CategorizacionEmpresaView from '@/components/Views/categorizacion/CategorizacionEmpresaView.vue';
  import CategorizacionView from '@/components/Views/categorizacion/CategorizacionView.vue';
  import { useAuth } from '@/hooks/useAuth';

  const { isSuperAdmin, isAdmin } = useAuth();
  const isManager = computed(() => isSuperAdmin.value || isAdmin.value);
</script>

<template>
  <CategorizacionView v-if="isManager" />
  <CategorizacionEmpresaView v-else />
</template>
