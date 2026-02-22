<script setup>
  import { useHead } from '@unhead/vue';
  import PosLayout from './PosLayout.vue';

  // --- SEO ---
  useHead({
    title: 'Nuevo Pedido (POS)',
    meta: [
      { name: 'description', content: 'Punto de venta para creación de nuevos pedidos.' }
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });
</script>

<template>
  <PosLayout />
</template>
