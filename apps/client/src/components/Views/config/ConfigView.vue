<script setup>
  import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
  import { useHead } from '@unhead/vue';
  import { computed, ref, watch } from 'vue';
  import { useAuth } from '@/hooks/useAuth';
  import { useAuthStore } from '@/stores/auth';
  import ThemeCard from '@/components/cards/ThemeCard.vue';
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
  const selectedTema = ref('nexusTheme'); // Default theme

  const availableThemes = [
    { title: 'Clásico', value: 'nexusTheme', colors: { primary: '#2563EB', secondary: '#1E40AF', background: '#F8FAFC', surface: '#FFFFFF' } },
    { title: 'Nocturno', value: 'darkTheme', colors: { primary: '#38BDF8', secondary: '#1E293B', background: '#0F172A', surface: '#1E293B' } },
    { title: 'Océano', value: 'oceanTheme', colors: { primary: '#0EA5E9', secondary: '#0284C7', background: '#F0F9FF', surface: '#FFFFFF' } },
    { title: 'Industrial', value: 'industrialTheme', colors: { primary: '#1A1A1A', secondary: '#B91C1C', background: '#F4F4F5', surface: '#FFFFFF' } },
    { title: 'Naturaleza', value: 'natureTheme', colors: { primary: '#166534', secondary: '#22C55E', background: '#F0FDF4', surface: '#FFFFFF' } },
    { title: 'Carmesí', value: 'crimsonTheme', colors: { primary: '#991B1B', secondary: '#EF4444', background: '#FEF2F2', surface: '#FFFFFF' } },
    { title: 'Tierra', value: 'earthTheme', colors: { primary: '#451A03', secondary: '#92400E', background: '#FFFBEB', surface: '#FFFFFF' } },
    { title: 'Majestad', value: 'royalTheme', colors: { primary: '#581C87', secondary: '#A855F7', background: '#FAF5FF', surface: '#FFFFFF' } },
    { title: 'Carbono', value: 'carbonTheme', colors: { primary: '#334155', secondary: '#64748B', background: '#F1F5F9', surface: '#FFFFFF' } }
  ];

  watch(config, (val) => {
    if (val) {
      if (val.id_divisa_base) selectedDivisaId.value = val.id_divisa_base;
      if (val.tema_interfaz) selectedTema.value = val.tema_interfaz;
    }
  }, { immediate: true });

  // Mutations
  const { mutate: doUpdateConfig, isPending: isSavingConfig } = useMutation({
    mutationFn: updateConfiguracionGlobal,
    onSuccess: (response) => {
      showSuccessToast('Configuración actualizada');
      queryClient.invalidateQueries(['configuracion-global']);
      
      // Update local storage and app state for theme instantly using Pinia
      const updatedConfig = response.data?.data || response.data;
      if (updatedConfig) {
        useAuthStore().updateConfig(updatedConfig);
        // Force reload a bit later to guarantee sync of elements outside standard reactivity cycle if needed
        setTimeout(() => {
          window.location.reload();
        }, 300)
      }
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
    
    // Send both divisa and theme
    doUpdateConfig({ 
      id_divisa_base: selectedDivisaId.value,
      tema_interfaz: selectedTema.value
    });
  }

  function handleSyncRates() {
    doSyncRates();
  }

</script>

<template>
  <v-container class="h-100 bg-surface rounded-lg pa-6 border align-start" fluid>
    <h1 class="text-h4 font-weight-bold text-secondary mb-2 d-flex align-center gap-3">
      <v-icon color="secondary">mdi-cog</v-icon>
      Configuración Global
    </h1>
    <p class="text-medium-emphasis mb-6">Administra los parámetros base del perfil de la empresa como la moneda de operación y la apariencia gráfica.</p>
    
    <v-divider class="mb-6" />

    <v-row>
      <!-- Card: Divisa Base & Tema -->
      <v-col cols="12" md="6">
        <v-card class="border rounded-lg bg-surface" elevation="0">
          <v-card-item class="bg-surface-variant border-b py-3">
            <template #title>
              <span class="text-subtitle-1 font-weight-bold">
                <v-icon class="mr-2">mdi-cash-register</v-icon>
                Preferencias Globales
              </span>
            </template>
          </v-card-item>
                
          <v-card-text class="pa-4">
            <p class="text-caption text-medium-emphasis mb-4">
              Selecciona la moneda que se utilizará por defecto en facturación, reportes y métricas de tu empresa.
            </p>
                    
            <v-autocomplete
              v-model="selectedDivisaId"
              class="mb-6"
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

            <p class="text-caption text-medium-emphasis mb-4">
              Selecciona el tema visual para todos los usuarios de la empresa.
            </p>

            <v-row class="mb-4">
              <v-col
                v-for="theme in availableThemes"
                :key="theme.value"
                cols="6"
                lg="4"
                md="6"
                sm="4"
              >
                <ThemeCard
                  :colors="theme.colors"
                  :selected="selectedTema === theme.value"
                  :theme-value="theme.value"
                  :title="theme.title"
                  @select="selectedTema = $event"
                />
              </v-col>
            </v-row>

            <div class="mt-5 d-flex justify-end">
              <v-btn 
                color="primary" 
                :disabled="(!selectedDivisaId || selectedDivisaId === config?.id_divisa_base) && selectedTema === config?.tema_interfaz" 
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
        <v-card class="border-error border opacity-90 rounded-lg bg-surface" elevation="0">
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
