<script setup>
  import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
  import { useHead } from '@unhead/vue';
  import { computed, ref, watch } from 'vue';
  import { useAuth } from '@/hooks/useAuth';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { getConfiguracionGlobal, syncExchangeRates, updateConfiguracionGlobal } from '@/services/config.service';
  import { getDivisasList } from '@/services/divisas.service';

  // --- SEO ---
  useHead({
    title: 'Configuración Global',
    meta: [
      { name: 'description', content: 'Ajustes globales y preferencias para su empresa en Nexus VCI.' }
    ]
  });

  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAuth();

  // Queries
  const { data: configData, isLoading: isLoadingConfig, refetch: refetchConfig } = useQuery({
    queryKey: ['configuracion-global'],
    queryFn: getConfiguracionGlobal
  });

  const { data: divisasData, isLoading: isLoadingDivisas } = useQuery({
    queryKey: ['divisas', 'select'],
    queryFn: getDivisasList,
    staleTime: 5 * 60 * 1000
  });

  const config = computed(() => configData.value?.data || null);
  const divisas = computed(() => divisasData.value?.data || []);

  const selectedDivisaId = ref(null);

  watch(config, (val) => {
    if (val && val.id_divisa_base) {
      selectedDivisaId.value = val.id_divisa_base;
    }
  }, { immediate: true });

  // Mutations
  const { mutate: doUpdateConfig, isPending: isSavingConfig } = useMutation({
    mutationFn: updateConfiguracionGlobal,
    onSuccess: () => {
      showSuccessToast('Configuración actualizada');
      queryClient.invalidateQueries(['configuracion-global']);
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.error || 'Error al actualizar configuración');
    }
  });

  const { mutate: doSyncRates, isPending: isSyncing } = useMutation({
    mutationFn: syncExchangeRates,
    onSuccess: () => {
      showSuccessToast('Tasas de cambio sincronizadas automáticamente');
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.error || 'Error al sincronizar tasas');
    }
  });

  function handleSaveConfig() {
    if (!selectedDivisaId.value) return;
    doUpdateConfig({ id_divisa_base: selectedDivisaId.value });
  }

  function handleSyncRates() {
    doSyncRates();
  }

</script>

<template>
  <v-container class="h-100 bg-white rounded-lg pa-6 border align-start" fluid>
    <h1 class="text-h4 font-weight-bold text-secondary mb-2 d-flex align-center gap-3">
      <v-icon color="secondary">mdi-cog</v-icon>
      Configuración Global
    </h1>
    <p class="text-medium-emphasis mb-6">Administra los parámetros base del perfil de la empresa como la moneda de operación.</p>
    
    <v-divider class="mb-6" />

    <v-row>
      <!-- Card: Divisa Base -->
      <v-col cols="12" md="6">
        <v-card class="border rounded-lg" elevation="0">
          <v-card-item class="bg-grey-lighten-4 border-b py-3">
            <template #title>
              <span class="text-subtitle-1 font-weight-bold">
                <v-icon class="mr-2">mdi-cash-register</v-icon>
                Moneda de Operación (Base)
              </span>
            </template>
          </v-card-item>
                
          <v-card-text class="pa-4">
            <p class="text-caption text-medium-emphasis mb-4">
              Selecciona la moneda que se utilizará por defecto en facturación, reportes y métricas de tu empresa.
            </p>
                    
            <v-autocomplete
              v-model="selectedDivisaId"
              density="comfortable"
              hide-details="auto"
              item-title="nombre_divisa"
              item-value="id"
              :items="divisas"
              label="Divisa Base"
              :loading="isLoadingConfig || isLoadingDivisas"
              prepend-inner-icon="mdi-currency-usd"
              variant="outlined"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props" :subtitle="item.raw.codigo_iso" :title="item.raw.nombre_divisa">
                  <template #prepend>
                    <v-avatar color="primary" size="32" variant="tonal">
                      {{ item.raw.simbolo }}
                    </v-avatar>
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>

            <div class="mt-5 d-flex justify-end">
              <v-btn 
                color="primary" 
                :disabled="!selectedDivisaId || selectedDivisaId === config?.id_divisa_base" 
                :loading="isSavingConfig"
                prepend-icon="mdi-content-save"
                @click="handleSaveConfig"
              >
                Guardar Cambios
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Card: Acciones de SuperAdmin -->
      <v-col v-if="isSuperAdmin" cols="12" md="6">
        <v-card class="border-error border opacity-90 rounded-lg" elevation="0">
          <v-card-item class="bg-error text-white py-3">
            <template #title>
              <span class="text-subtitle-1 font-weight-bold">
                <v-icon class="mr-2">mdi-shield-crown</v-icon>
                Zona de Administración Global
              </span>
            </template>
          </v-card-item>
                
          <v-card-text class="pa-4">
            <p class="text-caption text-medium-emphasis mb-4">
              Acciones reservadas para el Super Administrador de Nexus VCI.
            </p>

            <v-banner class="rounded" color="warning" icon="mdi-refresh-auto" lines="two">
              <template #text>
                Forzar la sincronización de todas las tasas de cambio de las divisas registradas consumiendo la API de ExchangeRates. (Esta tarea también se ejecuta automáticamente cada madrugada).
              </template>
              <template #actions>
                <v-btn
                  color="warning"
                  :loading="isSyncing"
                  prepend-icon="mdi-sync"
                  variant="flat"
                  @click="handleSyncRates"
                >
                  Sincronizar Ahora
                </v-btn>
              </template>
            </v-banner>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.gap-3 { gap: 12px; }
</style>
