<script setup>
  import { useMutation, useQueryClient } from '@tanstack/vue-query';
  import { ref } from 'vue';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { createDivisa } from '@/services/divisas.service';

  const props = defineProps({
    modelValue: Boolean
  });

  const emit = defineEmits(['update:modelValue', 'success']);
  const queryClient = useQueryClient();

  const form = ref(null);
  const valid = ref(false);

  const formData = ref({
    nombre_divisa: '',
    codigo_iso: '',
    simbolo: ''
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createDivisa,
    onSuccess: () => {
      showSuccessToast('Divisa creada correctamente');
      emit('success');
      close();
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.error || 'Error al crear la divisa');
    }
  });

  async function handleSubmit () {
    const { valid: isValid } = await form.value.validate();
    if (!isValid) return;

    mutate({
      nombre_divisa: formData.value.nombre_divisa.trim(),
      codigo_iso: formData.value.codigo_iso.toUpperCase().trim(),
      simbolo: formData.value.simbolo.trim()
    });
  }

  function resetForm () {
    formData.value = {
      nombre_divisa: '',
      codigo_iso: '',
      simbolo: ''
    };
    if (form.value) form.value.resetValidation();
  }

  function close () {
    emit('update:modelValue', false);
    resetForm();
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
    <v-card>
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-h6 font-weight-bold">
          Nueva Divisa
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
                placeholder="USD"
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
                placeholder="$"
                prepend-inner-icon="mdi-cash"
                :rules="symbolRules"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-form>
        <small class="text-caption text-medium-emphasis">* Campos requeridos</small>
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
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
