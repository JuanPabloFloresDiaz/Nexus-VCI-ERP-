<template>
  <v-container>
    <div class="d-flex align-center mb-4">
      <v-btn class="mr-2" icon="mdi-arrow-left" to="/main/almacenes" variant="text" />
      <h1 class="text-h4 font-weight-bold text-secondary">Crear Nuevo Almacén</h1>
    </div>

    <v-card class="pa-4">
      <v-form ref="form" v-model="valid" @submit.prevent="submit">
        <v-row>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="formData.nombre_almacen"
              label="Nombre del Almacén"
              required
              :rules="[v => !!v || 'El nombre es obligatorio']"
              variant="outlined"
            />
          </v-col>
          
          <v-col cols="12" md="4">
            <v-switch
              v-model="formData.es_principal"
              color="primary"
              inset
              label="¿Es Almacén Principal?"
            />
          </v-col>

          <v-col cols="12">
            <v-textarea
              v-model="formData.ubicacion"
              label="Ubicación / Dirección"
              rows="3"
              variant="outlined"
            />
          </v-col>


        </v-row>

        <div class="d-flex justify-end mt-4">
          <v-btn class="mr-2" color="grey-darken-1" to="/main/almacenes" variant="text">Cancelar</v-btn>
          <v-btn color="primary" :disabled="!valid" :loading="isPending" type="submit">
            Guardar Almacén
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup>
  import { useMutation, useQueryClient } from '@tanstack/vue-query';
  import { useHead } from '@unhead/vue';
  import Swal from 'sweetalert2';
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { createAlmacen } from '@/services/almacenes.service';

  useHead({
    title: 'Crear Almacén | Nexus ERP',
    link: [
      { rel: 'canonical', href: window.location.href }
    ] 
  });

  const router = useRouter();
  const queryClient = useQueryClient();

  const valid = ref(false);
  const form = ref(null);

  const formData = ref({
    nombre_almacen: '',
    ubicacion: '',
    es_principal: false,
    capacidad_maxima: null,
    responsable_nombre: ''
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createAlmacen,
    onSuccess: () => {
      queryClient.invalidateQueries(['almacenes']);
      Swal.fire({
        title: '¡Éxito!',
        text: 'Almacén creado correctamente',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      router.push('/main/almacenes'); // Corrected path
    },
    onError: (error) => {
      Swal.fire('Error', error.response?.data?.message || 'No se pudo crear el almacén', 'error');
    }
  });

  function submit() {
    if (valid.value) {
      mutate(formData.value);
    }
  }
</script>
