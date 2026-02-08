<script setup>
import { ref, reactive, computed } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { createClientesBulk } from '@/services/clientes.service';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';
import { showSuccessToast, showErrorToast } from '@/plugins/sweetalert2';
import { vMaska } from 'maska/vue';

const props = defineProps({
    modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'success']);

const { isSuperAdmin, user } = useAuth();
const queryClient = useQueryClient();

// State
const step = ref(1);
const loading = ref(false);
const file = ref(null);
const parsedItems = ref([]);
const validationErrors = ref([]);
const processing = ref(false);

const headers = computed(() => {
    const defaultHeaders = [
        { title: 'Nombre', key: 'nombre_cliente', sortable: true },
        { title: 'Apellido', key: 'apellido_cliente', sortable: true },
        { title: 'Correo', key: 'correo_cliente', sortable: true },
        { title: 'Teléfono', key: 'telefono_cliente', sortable: true },
        { title: 'DUI', key: 'dui_cliente', sortable: true },
        { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
    ];
    if (isSuperAdmin.value) {
        defaultHeaders.splice(5, 0, { title: 'ID Empresa', key: 'id_empresa', sortable: true });
    }
    return defaultHeaders;
});

// Form for editing/adding in Step 3
const editForm = reactive({
    index: -1, // -1 means new item
    nombre_cliente: '',
    apellido_cliente: '',
    correo_cliente: '',
    telefono_cliente: '',
    dui_cliente: '',
    id_empresa: ''
});

// Mutation
const { mutateAsync: bulkCreate } = useMutation({
    mutationFn: createClientesBulk,
    onSuccess: (data) => {
        showSuccessToast('Clientes cargados exitosamente');
        emit('success');
        resetModal();
    },
    onError: (error) => {
        const errorMsg = error.response?.data?.error || 'Error al cargar clientes';
        showErrorToast(errorMsg);
        // If specific errors are returned, we could map them here
        // For now, we assume transaction rolls back everything
        validationErrors.value = [errorMsg];
    }
});

// Methods

const downloadTemplate = () => {
    const headersConfig = ['nombre_cliente', 'apellido_cliente', 'correo_cliente', 'telefono_cliente', 'dui_cliente'];
    if (isSuperAdmin.value) {
        headersConfig.push('id_empresa');
    }
    
    // Create a sample row
    const sampleRow = {
        nombre_cliente: 'Juan',
        apellido_cliente: 'Perez',
        correo_cliente: 'juan@ejemplo.com',
        telefono_cliente: '7777-7777',
        dui_cliente: '00000000-0'
    };
    if (isSuperAdmin.value) {
        sampleRow.id_empresa = 'UUID-EMPRESA';
    }

    const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headersConfig });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Clientes");
    XLSX.writeFile(wb, "plantilla_clientes.xlsx");
    
    step.value = 2; // Auto advance to upload step
};

const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files?.[0] || file.value;
    if (!uploadedFile) return;

    loading.value = true;
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Basic Mapping and Cleanup
            parsedItems.value = jsonData.map(item => ({
                nombre_cliente: item.nombre_cliente?.toString().trim() || '',
                apellido_cliente: item.apellido_cliente?.toString().trim() || '',
                correo_cliente: item.correo_cliente?.toString().trim() || '',
                telefono_cliente: item.telefono_cliente?.toString().trim() || '',
                dui_cliente: item.dui_cliente?.toString().trim() || '',
                id_empresa: item.id_empresa?.toString().trim() || (isSuperAdmin.value ? '' : user.value.id_empresa)
            }));

            step.value = 3;
        } catch (error) {
            console.error(error);
            showErrorToast('Error al procesar el archivo Excel');
        } finally {
            loading.value = false;
        }
    };

    reader.readAsArrayBuffer(uploadedFile);
};

const editItem = (item, index) => {
    editForm.index = index;
    editForm.nombre_cliente = item.nombre_cliente;
    editForm.apellido_cliente = item.apellido_cliente;
    editForm.correo_cliente = item.correo_cliente;
    editForm.telefono_cliente = item.telefono_cliente;
    editForm.dui_cliente = item.dui_cliente;
    editForm.id_empresa = item.id_empresa;
};

const saveItem = () => {
    const newItem = {
        nombre_cliente: editForm.nombre_cliente,
        apellido_cliente: editForm.apellido_cliente,
        correo_cliente: editForm.correo_cliente,
        telefono_cliente: editForm.telefono_cliente,
        dui_cliente: editForm.dui_cliente,
        id_empresa: editForm.id_empresa
    };

    if (editForm.index > -1) {
        parsedItems.value[editForm.index] = newItem;
    } else {
        parsedItems.value.unshift(newItem);
    }
    
    // Reset form
    editForm.index = -1;
    editForm.nombre_cliente = '';
    editForm.apellido_cliente = '';
    editForm.correo_cliente = '';
    editForm.telefono_cliente = '';
    editForm.dui_cliente = '';
    editForm.id_empresa = '';
};

const deleteItem = (index) => {
    parsedItems.value.splice(index, 1);
};

const submitBulk = async () => {
    if (parsedItems.value.length === 0) return;
    
    loading.value = true;
    validationErrors.value = [];
    
    try {
        await bulkCreate(parsedItems.value);
    } catch (error) {
        // Error handling is in onError of mutation
    } finally {
        loading.value = false;
    }
};

const resetModal = () => {
    step.value = 1;
    file.value = null;
    parsedItems.value = [];
    validationErrors.value = [];
    emit('update:modelValue', false);
};

</script>

<template>
    <v-dialog
        :model-value="modelValue"
        @update:model-value="emit('update:modelValue', $event)"
        max-width="900px"
        persistent
    >
        <v-card>
            <v-card-title class="bg-primary text-white d-flex align-center justify-space-between">
                Carga Masiva de Clientes
                <v-btn icon variant="text" @click="emit('update:modelValue', false)">
                    <v-icon color="white">mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-card-text class="pa-4">
                <v-stepper v-model="step" flat>
                    <v-stepper-header>
                        <v-stepper-item :value="1" :complete="step > 1">Descargar Formato</v-stepper-item>
                        <v-divider></v-divider>
                        <v-stepper-item :value="2" :complete="step > 2">Cargar Archivo</v-stepper-item>
                        <v-divider></v-divider>
                        <v-stepper-item :value="3">Verificar y Guardar</v-stepper-item>
                    </v-stepper-header>

                    <v-window v-model="step" class="mt-4">
                        <!-- Step 1: Download -->
                        <v-window-item :value="1">
                            <div class="text-center py-8">
                                <v-icon size="64" color="primary" class="mb-4">mdi-file-excel-outline</v-icon>
                                <h3 class="text-h6 mb-2">Descarga la plantilla</h3>
                                <p class="text-body-2 text-medium-emphasis mb-6">
                                    Descarga el archivo Excel base, llénalo con los datos de tus clientes y guárdalo.<br>
                                    No cambies los encabezados de las columnas.
                                </p>
                                <v-btn color="primary" @click="downloadTemplate" prepend-icon="mdi-download">
                                    Descargar Plantilla
                                </v-btn>
                                <div class="mt-4">
                                     <v-btn variant="text" color="primary" @click="step = 2">
                                        Saltar si ya tienes el archivo
                                    </v-btn>
                                </div>
                            </div>
                        </v-window-item>

                        <!-- Step 2: Upload -->
                        <v-window-item :value="2">
                             <div class="text-center py-8">
                                <template v-if="loading">
                                     <v-progress-circular indeterminate color="primary" size="64" class="mb-4"></v-progress-circular>
                                     <h3 class="text-h6">Procesando archivo...</h3>
                                </template>
                                <template v-else>
                                    <v-file-input
                                        v-model="file"
                                        accept=".xlsx, .xls"
                                        label="Selecciona tu archivo Excel"
                                        variant="outlined"
                                        prepend-icon="mdi-microsoft-excel"
                                        show-size
                                        @change="handleFileUpload"
                                    ></v-file-input>
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
                                    type="error"
                                    variant="tonal"
                                    title="Errores de Validación"
                                    closable
                                >
                                    No se pudo guardar la carga masiva. Por favor corrige los errores:
                                    <ul class="ml-4 mt-2">
                                        <li v-for="(err, i) in validationErrors" :key="i">{{ err }}</li>
                                    </ul>
                                </v-alert>

                                <!-- Editor Form -->
                                <v-card variant="outlined" class="pa-3 bg-grey-lighten-5">
                                    <span class="text-subtitle-2 font-weight-bold mb-2 d-block">
                                        {{ editForm.index > -1 ? 'Editar Fila Seleccionada' : 'Agregar Manualmente' }}
                                    </span>
                                    <v-row dense>
                                        <v-col cols="12" md="4" v-if="isSuperAdmin">
                                            <v-text-field
                                                v-model="editForm.id_empresa"
                                                label="ID Empresa"
                                                density="compact"
                                                variant="outlined"
                                                bg-color="white"
                                            ></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="4">
                                            <v-text-field
                                                v-model="editForm.nombre_cliente"
                                                label="Nombre *"
                                                density="compact"
                                                variant="outlined"
                                                bg-color="white"
                                            ></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="4">
                                            <v-text-field
                                                v-model="editForm.apellido_cliente"
                                                label="Apellido *"
                                                density="compact"
                                                variant="outlined"
                                                bg-color="white"
                                            ></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="4">
                                            <v-text-field
                                                v-model="editForm.correo_cliente"
                                                label="Correo *"
                                                density="compact"
                                                variant="outlined"
                                                bg-color="white"
                                            ></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="4">
                                            <v-text-field
                                                v-model="editForm.telefono_cliente"
                                                label="Teléfono"
                                                density="compact"
                                                variant="outlined"
                                                bg-color="white"
                                                v-maska="'####-####'"
                                            ></v-text-field>
                                        </v-col>
                                        <v-col cols="12" md="4">
                                            <v-text-field
                                                v-model="editForm.dui_cliente"
                                                label="DUI"
                                                density="compact"
                                                variant="outlined"
                                                bg-color="white"
                                                v-maska="'########-#'"
                                            ></v-text-field>
                                        </v-col>
                                        <v-col cols="12" class="d-flex justify-end">
                                            <v-btn 
                                                size="small" 
                                                color="secondary" 
                                                variant="tonal" 
                                                class="mr-2"
                                                @click="editForm.index = -1"
                                                v-if="editForm.index > -1"
                                            >Cancelar</v-btn>
                                            <v-btn size="small" color="primary" @click="saveItem">
                                                {{ editForm.index > -1 ? 'Actualizar Fila' : 'Agregar a Lista' }}
                                            </v-btn>
                                        </v-col>
                                    </v-row>
                                </v-card>

                                <!-- Table -->
                                <v-data-table
                                    :headers="headers"
                                    :items="parsedItems"
                                    items-per-page="5"
                                    class="border rounded"
                                >
                                    <template v-slot:item.actions="{ item, index }">
                                        <div class="d-flex justify-end">
                                            <v-btn icon size="small" variant="text" color="primary" @click="editItem(item, index)">
                                                <v-icon>mdi-pencil</v-icon>
                                            </v-btn>
                                            <v-btn icon size="small" variant="text" color="error" @click="deleteItem(index)">
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
                <v-spacer></v-spacer>
                <v-btn
                    variant="text"
                    @click="step === 1 ? emit('update:modelValue', false) : step--"
                >
                    {{ step === 1 ? 'Cancelar' : 'Atrás' }}
                </v-btn>
                <v-btn
                    v-if="step === 3"
                    color="primary"
                    variant="elevated"
                    :loading="loading"
                    @click="submitBulk"
                    :disabled="parsedItems.length === 0"
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
