<script setup>
  import { useMutation } from '@tanstack/vue-query';
  import { ref, watch } from 'vue';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { updateDivisa } from '@/services/divisas.service';

  const props = defineProps({
    modelValue: Boolean,
    divisa: {
      type: Object,
      default: null
    }
  });

  const emit = defineEmits(['update:modelValue', 'success']);

  const form = ref(null);
  const valid = ref(false);

  const formData = ref({
    nombre_divisa: '',
    codigo_iso: '',
    simbolo: ''
  });

  watch(() => props.divisa, (newVal) => {
    if (newVal) {
      formData.value = {
        nombre_divisa: newVal.nombre_divisa,
        codigo_iso: newVal.codigo_iso,
        simbolo: newVal.simbolo
      };
    }
  }, { immediate: true });

  const { mutate, isPending } = useMutation({
    mutationFn: updateDivisa,
    onSuccess: () => {
      showSuccessToast('Divisa actualizada correctamente');
      emit('success');
      close();
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.error || 'Error al actualizar la divisa');
    }
  });

  async function handleSubmit () {
    const { valid: isValid } = await form.value.validate();
    if (!isValid || !props.divisa?.id) return;

    mutate({
      id: props.divisa.id,
      nombre_divisa: formData.value.nombre_divisa.trim(),
      codigo_iso: formData.value.codigo_iso.toUpperCase().trim(),
      simbolo: formData.value.simbolo.trim()
    });
  }

  function close () {
    emit('update:modelValue', false);
    if (form.value) form.value.resetValidation();
  }

  // Rules
  const nameRules = [
    v => !!v || 'El nombre es obligatorio',
    v => v.length <= 50 || 'Máximo 50 caracteres'
  ];

  const isoRules = [
    v => !!v || 'El código ISO es obligatorio',
    v => v.length === 3 || 'Debe ser exactamente 3 caracteres (ej. USD)'
  ];

  const symbolRules = [
    v => !!v || 'El símbolo es obligatorio',
    v => v.length <= 5 || 'Máximo 5 caracteres'
  ];

</script>

<template>
  <v-dialog 
    max-width="500px" 
    :model-value="modelValue" 
    persistent
    @update:model-value="close"
  >
    <v-card v-if="divisa">
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-h6 font-weight-bold">
          Editar Divisa
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-4">
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="formData.nombre_divisa"
                density="compact"
                label="Nombre de la Divisa *"
                prepend-inner-icon="mdi-currency-usd"
                :rules="nameRules"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.codigo_iso"
                class="text-uppercase"
                density="compact"
                label="Código ISO *"
                prepend-inner-icon="mdi-earth"
                :rules="isoRules"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.simbolo"
                density="compact"
                label="Símbolo *"
                prepend-inner-icon="mdi-cash"
                :rules="symbolRules"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn color="error" variant="text" @click="close">
          Cancelar
        </v-btn>
        <v-btn 
          color="primary" 
          :disabled="!valid" 
          :loading="isPending" 
          variant="flat"
          @click="handleSubmit"
        >
          Guardar Cambios
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
