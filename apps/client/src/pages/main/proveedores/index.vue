<route lang="yaml">
path: /main/proveedores
meta:
  layout: MainLayout
  title: Gestión de Proveedores
</route>

<script setup>
import { computed } from 'vue';
import { useAuth } from '@/hooks/useAuth';

// Components
import ProveedoresView from '@/components/Views/proveedores/ProveedoresView.vue';
import ProveedoresEmpresa from '@/components/Views/proveedores/ProveedoresEmpresa.vue';

const { isVendor } = useAuth();
</script>

<template>
  <div>
    <ProveedoresEmpresa v-if="isVendor" />
    <ProveedoresView v-else />
  </div>
</template>
