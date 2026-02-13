<script setup>
  import { useQuery } from '@tanstack/vue-query';
  import { computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { getPedidoById } from '@/services/pedidos.service';
  import PosLayout from './PosLayout.vue';

  const route = useRoute();
  const router = useRouter();
  const pedidoId = route.params.id;

  const { data: pedido, isLoading, isError } = useQuery({
    queryKey: ['pedido', pedidoId],
    queryFn: () => getPedidoById(pedidoId),
    enabled: !!pedidoId,
    retry: false
  });

  // Extract actual order object from the API response envelope
  // Assuming API returns { data: { ...order }, ... }
  const orderData = computed(() => pedido.value?.data || null);

  const canEdit = computed(() => {
    if (!orderData.value) return false;
    // User said: "recuerda que solo se pueden editar los pedidos que no esten completados"
    // We already filter/hide the button, but good to have a check here or in layout.
    return orderData.value.estado_pedido !== 'Completado' && orderData.value.estado_pedido !== 'Cancelado'; 
  });

</script>

<template>
  <div v-if="isLoading" class="d-flex justify-center align-center h-100">
    <v-progress-circular color="primary" indeterminate />
  </div>
  <div v-else-if="isError || !orderData" class="pa-4 text-center">
    <v-icon color="error" size="64">mdi-alert-circle</v-icon>
    <div class="text-h6 mt-2">Error cargando pedido</div>
    <div class="text-caption text-medium-emphasis mt-1" v-if="isError">
      No se pudo recuperar la información del pedido.
    </div>
    <v-btn class="mt-4" color="primary" @click="router.back()">Regresar</v-btn>
  </div>
  <PosLayout 
    v-else 
    :initial-order="orderData" 
    :is-edit="true" 
  />
</template>
