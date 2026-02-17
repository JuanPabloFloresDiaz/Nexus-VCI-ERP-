<template>
  <v-container>
    <div class="d-flex align-center mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" to="/main/almacenes" class="mr-2" />
      <h1 class="text-h4 font-weight-bold text-secondary">Editar Almacén</h1>
    </div>

    <div v-if="isLoading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>

    <v-card v-else class="pa-4">
      <v-form ref="form" v-model="valid" @submit.prevent="submit">
        <v-row>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="formData.nombre_almacen"
              label="Nombre del Almacén"
              :rules="[v => !!v || 'El nombre es obligatorio']"
              variant="outlined"
              required
            />
          </v-col>
          
          <v-col cols="12" md="4">
            <v-switch
              v-model="formData.es_principal"
              label="¿Es Almacén Principal?"
              color="primary"
              inset
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
          <v-btn color="grey-darken-1" variant="text" to="/main/almacenes" class="mr-2">Cancelar</v-btn>
          <v-btn color="primary" type="submit" :loading="isSaving" :disabled="!valid">
            Actualizar Almacén
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { getAlmacenById, updateAlmacen } from '@/services/almacenes.service';
import Swal from 'sweetalert2';
import { useHead } from '@unhead/vue';

useHead({
  title: 'Editar Almacén | Nexus ERP',
  link: [
    { rel: 'canonical', href: window.location.href }
  ]
});

const props = defineProps(['id']); // Receive ID from page wrapper if convenient, or use route.

const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();

const almacenId = computed(() => props.id || route.params.id);

const valid = ref(false);
const form = ref(null);

const formData = ref({
  nombre_almacen: '',
  ubicacion: '',
  es_principal: false,
  capacidad_maxima: null,
  responsable_nombre: ''
});

// Fetch Data
const { data, isLoading } = useQuery({
  queryKey: ['almacen', almacenId],
  queryFn: () => getAlmacenById(almacenId.value),
  enabled: computed(() => !!almacenId.value)
});

watch(data, (newVal) => {
  if (newVal?.data) {
    const d = newVal.data;
    formData.value = {
      nombre_almacen: d.nombre_almacen || '',
      ubicacion: d.ubicacion || '',
      es_principal: !!d.es_principal,
      capacidad_maxima: d.capacidad_maxima,
      responsable_nombre: d.responsable_nombre
    };
  }
}, { immediate: true });

// Mutation
const { mutate, isPending: isSaving } = useMutation({
  mutationFn: (payload) => updateAlmacen(almacenId.value, payload),
  onSuccess: () => {
    queryClient.invalidateQueries(['almacenes']);
    queryClient.invalidateQueries(['almacen', almacenId.value]);
    Swal.fire({
      title: '¡Actualizado!',
      text: 'Almacén actualizado correctamente',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
    router.push('/main/almacenes');
  },
  onError: (error) => {
    Swal.fire('Error', error.response?.data?.message || 'No se pudo actualizar el almacén', 'error');
  }
});

function submit() {
  if (valid.value) {
    mutate(formData.value);
  }
}
</script>
