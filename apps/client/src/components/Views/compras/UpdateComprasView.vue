<script setup>
  import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
  import Swal from 'sweetalert2';
  import { onMounted, ref } from 'vue';
  // Update refs when data loaded
  import { watch } from 'vue';
  import { useRouter } from 'vue-router';

  import { getCompraById, updateCompra } from '@/services/compras.service';

  const props = defineProps({
    id: {
      type: String,
      required: true
    }
  });

  const router = useRouter();
  const queryClient = useQueryClient();

  const valid = ref(false);
  const form = ref(null);
  const loading = ref(false);

  const estado = ref(null);
  const fechaEntrega = ref(null);
  const compraData = ref(null);

  // Get Compra Data
  const { data, isLoading } = useQuery({
    queryKey: ['compra-edit', props.id],
    queryFn: () => getCompraById(props.id)
  });
  watch(data, (newVal) => {
    if (newVal?.data) {
      compraData.value = newVal.data;
      estado.value = newVal.data.estado_compra;
      fechaEntrega.value = newVal.data.fecha_entrega_estimada;
    }
  });

  const { mutate } = useMutation({
    mutationFn: (payload) => updateCompra(props.id, payload),
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: 'Compra actualizada',
        text: 'Los cambios se han guardado correctamente',
        timer: 2000,
        showConfirmButton: false
      });
      queryClient.invalidateQueries(['compras']); // Update list
      router.push('/main/compras');
    },
    onError: (error) => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo actualizar la compra'
      });
    },
    onSettled: () => {
      loading.value = false;
    }
  });


  async function submit() {
    const { valid: isValid } = await form.value.validate();
    if (!isValid) return;

    loading.value = true;
    mutate({
      estado_compra: estado.value,
      fecha_entrega_estimada: fechaEntrega.value
    });
  }

  function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
</script>

<template>
  <v-container class="pa-6" fluid>
    <div class="mb-6 d-flex flex-wrap align-center justify-space-between">
      <div>
        <h1 class="text-h4 font-weight-bold text-primary">Editar Compra</h1>
        <p class="text-body-1 text-medium-emphasis">Actualizar estado o fecha de entrega</p>
      </div>
      <v-btn prepend-icon="mdi-arrow-left" variant="text" @click="router.back()">
        Volver
      </v-btn>
    </div>

    <v-skeleton-loader v-if="isLoading" type="card, article" />

    <v-form v-else ref="form" v-model="valid" @submit.prevent="submit">
      <!-- Read Only Info -->
      <v-card class="rounded-lg pa-4 mb-4" variant="outlined">
        <div class="text-h6 mb-4">Información General</div>
        <v-row>
          <v-col cols="12" md="6">
            <div class="test-body-1"><strong>ID:</strong> #{{ compraData?.id.substring(0,8) }}</div>
            <div class="test-body-1"><strong>Proveedor:</strong> {{ compraData?.proveedor?.nombre_proveedor }}</div>
            <div class="test-body-1"><strong>Comprador:</strong> {{ compraData?.usuario_comprador?.nombre_usuario || 'Yo' }}</div>
            <div class="test-body-1"><strong>Total:</strong> {{ formatCurrency(compraData?.total_compra) }}</div>
          </v-col>
        </v-row>
      </v-card>

      <!-- Update Fields -->
      <v-card class="rounded-lg pa-4 mb-4" variant="outlined">
        <div class="text-h6 mb-4">Actualizar Datos</div>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="estado"
              :items="['Pendiente', 'Recibido', 'Cancelado']"
              label="Estado"
              :rules="[v => !!v || 'Requerido']"
              variant="outlined"
            >
              <template #details>
                <div v-if="estado === 'Cancelado' && compraData.estado_compra === 'Recibido'" class="text-caption text-warning">
                  ¡Atención! Cancelar revertirá el stock de los productos.
                </div>
                <div v-if="estado === 'Recibido' && compraData.estado_compra !== 'Recibido'" class="text-caption text-success">
                  Al marcar como recibido, el stock aumentará.
                </div>
              </template>
            </v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="fechaEntrega"
              label="Fecha Entrega Estimada"
              type="date"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </v-card>

      <div class="d-flex justify-end gap-2">
        <v-btn size="large" variant="tonal" @click="router.back()">Cancelar</v-btn>
        <v-btn 
          color="primary" 
          :loading="loading" 
          prepend-icon="mdi-content-save" 
          size="large"
          type="submit"
        >
          Guardar Cambios
        </v-btn>
      </div>
    </v-form>
  </v-container>
</template>
