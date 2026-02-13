<script setup>
  import { useMutation } from '@tanstack/vue-query';
  import { vMaska } from 'maska/vue';
  import { computed, reactive, ref } from 'vue';
  import * as XLSX from 'xlsx';
  import { useAuth } from '@/hooks/useAuth';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { createBulkProveedores } from '@/services/proveedores.service';

  const props = defineProps({
    modelValue: Boolean
  });

  const emit = defineEmits(['update:modelValue', 'success']);

  const { isSuperAdmin, user } = useAuth();

  // State
  const step = ref(1);
  const loading = ref(false);
  const file = ref(null);
  const parsedItems = ref([]);
  const validationErrors = ref([]);

  const headers = computed(() => {
    const defaultHeaders = [
      { title: 'Nombre', key: 'nombre_proveedor', sortable: true },
      { title: 'Contacto', key: 'contacto_nombre', sortable: true },
      { title: 'Correo', key: 'correo_proveedor', sortable: true },
      { title: 'Teléfono', key: 'telefono_proveedor', sortable: true },
      { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
    ];
    if (isSuperAdmin.value) {
      defaultHeaders.splice(4, 0, { title: 'ID Empresa', key: 'id_empresa', sortable: true });
    }
    return defaultHeaders;
  });

  // Form for editing/adding in Step 3
  const editForm = reactive({
    index: -1, // -1 means new item
    nombre_proveedor: '',
    contacto_nombre: '',
    correo_proveedor: '',
    telefono_proveedor: '',
    id_empresa: ''
  });

  // Mutation
  const { mutateAsync: bulkCreate } = useMutation({
    mutationFn: createBulkProveedores,
    onSuccess: (data) => {
      showSuccessToast('Proveedores cargados exitosamente');
      emit('success');
      resetModal();
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || 'Error al cargar proveedores';
      showErrorToast(errorMsg);
      validationErrors.value = [errorMsg];
    }
  });

  // Methods

  function downloadTemplate () {
    const headersConfig = ['nombre_proveedor', 'contacto_nombre', 'correo_proveedor', 'telefono_proveedor'];
    if (isSuperAdmin.value) {
      headersConfig.push('id_empresa');
    }
    
    // Create a sample row
    const sampleRow = {
      nombre_proveedor: 'Distribuidora Ejemplo S.A.',
      contacto_nombre: 'Juan Perez',
      correo_proveedor: 'ventas@ejemplo.com',
      telefono_proveedor: '7777-7777'
    };
    if (isSuperAdmin.value) {
      sampleRow.id_empresa = 'UUID-EMPRESA';
    }

    const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headersConfig });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Proveedores");
    
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 19).replace(/T|:/g, '-');
    XLSX.writeFile(wb, `Plantilla_Proveedores_${formattedDate}.xlsx`);
    
    step.value = 2;
  }

  async function handleFileUpload (event) {
    const uploadedFile = event.target.files?.[0] || file.value;
    if (!uploadedFile) return;

    loading.value = true;
    const reader = new FileReader();

    reader.addEventListener('load', (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Basic Mapping and Cleanup
        parsedItems.value = jsonData.map(item => ({
          nombre_proveedor: item.nombre_proveedor?.toString().trim() || '',
          contacto_nombre: item.contacto_nombre?.toString().trim() || '',
          correo_proveedor: item.correo_proveedor?.toString().trim() || '',
          telefono_proveedor: item.telefono_proveedor?.toString().trim() || '',
          id_empresa: item.id_empresa?.toString().trim() || (isSuperAdmin.value ? '' : user.value.id_empresa)
        }));

        step.value = 3;
      } catch (error) {
        console.error(error);
        showErrorToast('Error al procesar el archivo Excel');
      } finally {
        loading.value = false;
      }
    });

    reader.readAsArrayBuffer(uploadedFile);
  }

  function editItem (item, index) {
    editForm.index = index;
    editForm.nombre_proveedor = item.nombre_proveedor;
    editForm.contacto_nombre = item.contacto_nombre;
    editForm.correo_proveedor = item.correo_proveedor;
    editForm.telefono_proveedor = item.telefono_proveedor;
    editForm.id_empresa = item.id_empresa;
  }

  function saveItem () {
    const newItem = {
      nombre_proveedor: editForm.nombre_proveedor,
      contacto_nombre: editForm.contacto_nombre,
      correo_proveedor: editForm.correo_proveedor,
      telefono_proveedor: editForm.telefono_proveedor,
      id_empresa: editForm.id_empresa
    };

    if (editForm.index > -1) {
      parsedItems.value[editForm.index] = newItem;
    } else {
      parsedItems.value.unshift(newItem);
    }
    
    // Reset form
    editForm.index = -1;
    editForm.nombre_proveedor = '';
    editForm.contacto_nombre = '';
    editForm.correo_proveedor = '';
    editForm.telefono_proveedor = '';
    editForm.id_empresa = '';
  }

  function deleteItem (index) {
    parsedItems.value.splice(index, 1);
  }

  async function submitBulk () {
    if (parsedItems.value.length === 0) return;
    
    loading.value = true;
    validationErrors.value = [];
    
    try {
      await bulkCreate(parsedItems.value);
    } catch {
      // Error handling is in onError of mutation
    } finally {
      loading.value = false;
    }
  }

  function resetModal () {
    step.value = 1;
    file.value = null;
    parsedItems.value = [];
    validationErrors.value = [];
    emit('update:modelValue', false);
  }

</script>

<template>
  <v-dialog
    max-width="900px"
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="bg-primary text-white d-flex align-center justify-space-between">
        Carga Masiva de Proveedores
        <v-btn icon variant="text" @click="emit('update:modelValue', false)">
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <v-stepper v-model="step" flat>
          <v-stepper-header>
            <v-stepper-item :complete="step > 1" :value="1">Descargar Formato</v-stepper-item>
            <v-divider />
            <v-stepper-item :complete="step > 2" :value="2">Cargar Archivo</v-stepper-item>
            <v-divider />
            <v-stepper-item :value="3">Verificar y Guardar</v-stepper-item>
          </v-stepper-header>

          <v-window v-model="step" class="mt-4">
            <!-- Step 1: Download -->
            <v-window-item :value="1">
              <div class="text-center py-8">
                <v-icon class="mb-4" color="primary" size="64">mdi-file-excel-outline</v-icon>
                <h3 class="text-h6 mb-2">Descarga la plantilla</h3>
                <p class="text-body-2 text-medium-emphasis mb-6">
                  Descarga el archivo Excel base, llénalo con los datos de tus proveedores y guárdalo.<br>
                  El nombre del archivo incluirá la fecha y hora de descarga.
                </p>
                <v-btn color="primary" prepend-icon="mdi-download" @click="downloadTemplate">
                  Descargar Plantilla
                </v-btn>
                <div class="mt-4">
                  <v-btn color="primary" variant="text" @click="step = 2">
                    Saltar si ya tienes el archivo
                  </v-btn>
                </div>
              </div>
            </v-window-item>

            <!-- Step 2: Upload -->
            <v-window-item :value="2">
              <div class="text-center py-8">
                <template v-if="loading">
                  <v-progress-circular class="mb-4" color="primary" indeterminate size="64" />
                  <h3 class="text-h6">Procesando archivo...</h3>
                </template>
                <template v-else>
                  <v-file-input
                    v-model="file"
                    accept=".xlsx, .xls"
                    label="Selecciona tu archivo Excel"
                    prepend-icon="mdi-microsoft-excel"
                    show-size
                    variant="outlined"
                    @change="handleFileUpload"
                  />
                  <p class="text-caption text-medium-emphasis mt-2">
                    Solo archivos .xlsx o .xls
                  </p>
                </template>
              </div>
            </v-window-item>

            <!-- Step 3: Review -->
            <v-window-item :value="3">
              <div class="d-flex flex-column gap-4">
                <!-- Validation Errors Alert -->
                <v-alert
                  v-if="validationErrors.length > 0"
                  closable
                  title="Errores de Validación"
                  type="error"
                  variant="tonal"
                >
                  No se pudo guardar la carga masiva. Por favor corrige los errores:
                  <ul class="ml-4 mt-2">
                    <li v-for="(err, i) in validationErrors" :key="i">{{ err }}</li>
                  </ul>
                </v-alert>

                <!-- Editor Form -->
                <v-card class="pa-3 bg-grey-lighten-5" variant="outlined">
                  <span class="text-subtitle-2 font-weight-bold mb-2 d-block">
                    {{ editForm.index > -1 ? 'Editar Fila Seleccionada' : 'Agregar Manualmente' }}
                  </span>
                  <v-row dense>
                    <v-col v-if="isSuperAdmin" cols="12" md="4">
                      <v-text-field
                        v-model="editForm.id_empresa"
                        bg-color="white"
                        density="compact"
                        label="ID Empresa"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="editForm.nombre_proveedor"
                        bg-color="white"
                        density="compact"
                        label="Nombre *"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="editForm.contacto_nombre"
                        bg-color="white"
                        density="compact"
                        label="Contacto"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="editForm.correo_proveedor"
                        bg-color="white"
                        density="compact"
                        label="Correo"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="editForm.telefono_proveedor"
                        v-maska="'####-####'"
                        bg-color="white"
                        density="compact"
                        label="Teléfono"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col class="d-flex justify-end" cols="12">
                      <v-btn 
                        v-if="editForm.index > -1" 
                        class="mr-2" 
                        color="secondary" 
                        size="small"
                        variant="tonal"
                        @click="editForm.index = -1"
                      >Cancelar</v-btn>
                      <v-btn color="primary" size="small" @click="saveItem">
                        {{ editForm.index > -1 ? 'Actualizar Fila' : 'Agregar a Lista' }}
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card>

                <!-- Table -->
                <v-data-table
                  class="border rounded"
                  :headers="headers"
                  :items="parsedItems"
                  items-per-page="5"
                >
                  <template #item.actions="{ item, index }">
                    <div class="d-flex justify-end">
                      <v-btn
                        color="primary"
                        icon
                        size="small"
                        variant="text"
                        @click="editItem(item, index)"
                      >
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                      <v-btn
                        color="error"
                        icon
                        size="small"
                        variant="text"
                        @click="deleteItem(index)"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </div>
                  </template>
                </v-data-table>
              </div>
            </v-window-item>
          </v-window>
        </v-stepper>
      </v-card-text>

      <v-card-actions class="px-6 pb-6">
        <v-spacer />
        <v-btn
          variant="text"
          @click="step === 1 ? emit('update:modelValue', false) : step--"
        >
          {{ step === 1 ? 'Cancelar' : 'Atrás' }}
        </v-btn>
        <v-btn
          v-if="step === 3"
          color="primary"
          :disabled="parsedItems.length === 0"
          :loading="loading"
          variant="elevated"
          @click="submitBulk"
        >
          Finalizar Carga
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.gap-4 {
    gap: 16px;
}
</style>
