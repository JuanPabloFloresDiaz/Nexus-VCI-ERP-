<route lang="yaml">
path: /main/reportes
meta:
  layout: MainLayout
  title: Reportes
</route>

<script setup>
  import ReportesView from '@/components/Views/reportes/ReportesView.vue';
</script>

<template>
  <ReportesView />
</template>
