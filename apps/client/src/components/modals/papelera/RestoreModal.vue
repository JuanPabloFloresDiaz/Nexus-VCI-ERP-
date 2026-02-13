<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-card class="rounded-lg">
      <v-card-title class="text-h5 font-weight-bold pa-4 text-success">
        <v-icon color="success" start>mdi-restore</v-icon>
        Restaurar Elemento
      </v-card-title>
      <v-card-text class="px-4 py-2">
        <div class="mb-2">
          ¿Deseas restaurar <strong>{{ itemName }}</strong>?
        </div>
        <div class="text-body-2 text-medium-emphasis">
          El elemento volverá a estar activo y visible en su módulo correspondiente.
        </div>
      </v-card-text>
      <v-card-actions class="pa-4 bg-grey-lighten-5">
        <v-spacer />
        <v-btn
          color="grey-darken-1"
          :disabled="loading"
          variant="text"
          @click="dialog = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="success"
          :loading="loading"
          variant="flat"
          @click="onConfirm"
        >
          Restaurar
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

  function onConfirm () {
    emit('confirm');
  }
</script>
