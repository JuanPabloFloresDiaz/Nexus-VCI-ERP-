<template>
  <v-dialog v-model="internalDialog" max-width="600px">
    <v-card class="rounded-lg">
      <v-card-title class="pa-4 d-flex justify-space-between align-center border-b">
        <span class="text-h6 font-weight-bold">Detalle de Empresa</span>
        <v-btn icon variant="text" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-6">
        <div class="d-flex flex-column align-center mb-6">
          <v-avatar class="elevation-2 border mb-3" size="100">
            <v-img 
              v-if="empresa?.logo_url" 
              cover 
              :src="empresa.logo_url"
            />
            <v-icon v-else color="primary" size="50">mdi-domain</v-icon>
          </v-avatar>
          <div class="text-h5 font-weight-bold">{{ empresa?.nombre_empresa }}</div>
          <div class="text-subtitle-1 text-medium-emphasis">{{ empresa?.nit_empresa || 'Sin NIT' }}</div>
        </div>

        <v-divider class="mb-4" />

        <v-row>
          <v-col cols="12" sm="6">
            <div class="text-caption text-medium-emphasis">Correo Electrónico</div>
            <div class="text-body-1">{{ empresa?.correo_empresa || 'No registrado' }}</div>
          </v-col>
                    
          <v-col cols="12" sm="6">
            <div class="text-caption text-medium-emphasis">Teléfono</div>
            <div class="text-body-1">{{ empresa?.telefono_empresa || 'No registrado' }}</div>
          </v-col>

          <v-col cols="12">
            <div class="text-caption text-medium-emphasis">Dirección</div>
            <div class="text-body-1">{{ empresa?.direccion_empresa || 'No registrada' }}</div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="pa-4 bg-grey-lighten-5">
        <v-spacer />
        <v-btn
          color="primary"
          variant="tonal"
          @click="close"
        >
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { computed } from 'vue';

  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false
    },
    empresa: {
      type: Object,
      default: () => null
    }
  });

  const emit = defineEmits(['update:modelValue']);

  const internalDialog = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  });

  function close () {
    internalDialog.value = false;
  }
</script>
