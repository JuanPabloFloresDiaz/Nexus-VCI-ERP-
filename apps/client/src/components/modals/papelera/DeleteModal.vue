<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-card class="rounded-lg">
      <v-card-title class="text-h5 font-weight-bold pa-4 text-error">
        <v-icon start color="error">mdi-alert-circle-outline</v-icon>
        Eliminar Definitivamente
      </v-card-title>
      <v-card-text class="px-4 py-2">
        <div class="mb-4">
          ¿Estás seguro de que deseas eliminar <strong>{{ itemName }}</strong> de forma permanente?
        </div>
        <div class="text-caption text-medium-emphasis bg-grey-lighten-4 pa-3 rounded border">
          <v-icon size="small" start>mdi-information-outline</v-icon>
          Esta acción no se puede deshacer. Todos los datos relacionados se perderán.
        </div>
      </v-card-text>
      <v-card-actions class="pa-4 bg-grey-lighten-5">
        <v-spacer></v-spacer>
        <v-btn
          color="grey-darken-1"
          variant="text"
          @click="dialog = false"
          :disabled="loading"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          @click="onConfirm"
          :loading="loading"
        >
          Eliminar para siempre
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  itemName: {
    type: String,
    default: 'este elemento'
  },
  loading: Boolean
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const onConfirm = () => {
  emit('confirm');
};
</script>
