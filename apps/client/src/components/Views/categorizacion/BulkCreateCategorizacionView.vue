<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import * as XLSX from 'xlsx';
import { bulkCreateCategorias } from '@/services/categorizacion.service';
import { showSuccessToast, showErrorToast } from '@/plugins/sweetalert2';

const router = useRouter();
const queryClient = useQueryClient();
const fileInput = ref(null);
const parsedData = ref([]);
const isProcessing = ref(false);
const isUploading = ref(false);

const headers = [
    { title: 'Categoría', key: 'nombre_categoria' },
    { title: 'Subcategoría', key: 'nombre_subcategoria' },
    { title: 'Filtro', key: 'nombre_filtro' },
    { title: 'Tipo Dato', key: 'tipo_dato' },
    { title: 'Opción', key: 'valor_opcion' },
];

const downloadTemplate = () => {
    const data = [
        {
            nombre_categoria: 'Ej: Ropa',
            descripcion_categoria: 'Categoría principal',
            nombre_subcategoria: 'Camisas',
            nombre_filtro: 'Talla',
            tipo_dato: 'Lista', 
            valor_opcion: 'S'
        },
        {
            nombre_categoria: 'Ej: Ropa',
            descripcion_categoria: 'Categoría principal',
            nombre_subcategoria: 'Camisas',
            nombre_filtro: 'Talla',
            tipo_dato: 'Lista', 
            valor_opcion: 'M'
        },
         {
            nombre_categoria: 'Ej: Ropa',
            descripcion_categoria: 'Categoría principal',
            nombre_subcategoria: 'Camisas',
            nombre_filtro: 'Color',
            tipo_dato: 'Lista', 
            valor_opcion: 'Azul'
        }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    
    // Auto-width for columns
    const wscols = Object.keys(data[0]).map(k => ({ wch: 20 }));
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, `Plantilla_Categorizacion_${new Date().toISOString().slice(0,10)}.xlsx`);
};

const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    isProcessing.value = true;
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); // Use defval to get keys even if empty

            // Transform Flat JSON to Nested JSON
            parsedData.value = transformToNestedStructure(json);
            
        } catch (error) {
            console.error(error);
            showErrorToast('Error al procesar el archivo Excel');
        } finally {
            isProcessing.value = false;
        }
    };

    reader.readAsArrayBuffer(file);
};

// Core logic: Transform Flat List -> Nested Tree
const transformToNestedStructure = (flatData) => {
    const categoriesMap = new Map();

    flatData.forEach(row => {
        const catName = row.nombre_categoria?.toString().trim();
        if (!catName) return; // Skip empty rows

        if (!categoriesMap.has(catName)) {
            categoriesMap.set(catName, {
                nombre_categoria: catName,
                descripcion_categoria: row.descripcion_categoria || '',
                subcategorias: []
            });
        }
        const category = categoriesMap.get(catName);

        const subName = row.nombre_subcategoria?.toString().trim();
        if (subName) {
            let subcategory = category.subcategorias.find(s => s.nombre_subcategoria === subName);
            if (!subcategory) {
                subcategory = {
                    nombre_subcategoria: subName,
                    id_categoria: null, // Temporary, backend handles ID
                    filtros: []
                };
                category.subcategorias.push(subcategory);
            }

            const filterName = row.nombre_filtro?.toString().trim();
            if (filterName) {
                let filtro = subcategory.filtros.find(f => f.nombre_filtro === filterName);
                if (!filtro) {
                    filtro = {
                        nombre_filtro: filterName,
                        tipo_dato: row.tipo_dato || 'Texto',
                        opciones: []
                    };
                    subcategory.filtros.push(filtro);
                }
                
                // If type is Lista, look for options
                const optionValue = row.valor_opcion?.toString().trim();
                if (optionValue) {
                     // Check for duplicates
                    if (!filtro.opciones.find(o => o.valor_opcion === optionValue)) {
                        filtro.opciones.push({ valor_opcion: optionValue });
                    }
                }
            }
        }
    });

    return Array.from(categoriesMap.values());
};

const { mutate } = useMutation({
    mutationFn: bulkCreateCategorias,
    onSuccess: (data) => {
        showSuccessToast(data.message || 'Carga masiva completada');
        queryClient.invalidateQueries({ queryKey: ['categorias'] });
        router.push('/main/categorizacion');
    },
    onError: (error) => {
        showErrorToast(error.message || 'Error en carga masiva');
        isUploading.value = false;
    }
});

const handleUpload = () => {
    if (parsedData.value.length === 0) {
        showErrorToast('No hay datos válidos para cargar');
        return;
    }

    isUploading.value = true;
    mutate(parsedData.value);
};
</script>

<template>
    <div class="h-100 d-flex flex-column bg-grey-lighten-5">
        <!-- Header -->
        <div class="d-flex align-center pa-4 bg-white border-b">
             <v-btn icon variant="text" to="/main/categorizacion" class="mr-2">
                <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <div>
                <h1 class="text-h6 font-weight-bold">Carga Masiva de Categorización</h1>
                <div class="text-caption text-medium-emphasis">
                    Sube un archivo Excel para crear categorías, subcategorías y filtros
                </div>
            </div>
             <v-spacer></v-spacer>
            <v-btn
                text="Descargar Plantilla"
                prepend-icon="mdi-download"
                variant="outlined"
                class="mr-2"
                @click="downloadTemplate"
            ></v-btn>
             <v-btn
                color="primary"
                @click="handleUpload"
                :loading="isUploading"
                :disabled="parsedData.length === 0"
                prepend-icon="mdi-cloud-upload"
            >
                Procesar Carga
            </v-btn>
        </div>

        <div class="pa-4 flex-grow-1 overflow-y-auto">
            <v-card class="mb-4">
                <v-card-text>
                    <v-file-input
                        v-model="fileInput"
                        label="Seleccionar archivo Excel"
                        accept=".xlsx, .xls"
                        prepend-icon="mdi-microsoft-excel"
                        variant="outlined"
                        @change="handleFileUpload"
                        :loading="isProcessing"
                        hide-details
                    ></v-file-input>
                    
                    <v-alert
                        v-if="parsedData.length > 0"
                        type="success"
                        variant="tonal"
                        density="compact"
                        class="mt-4"
                    >
                         Se han detectado <strong>{{ parsedData.length }}</strong> categorías principales listas para importar.
                    </v-alert>
                </v-card-text>
            </v-card>

            <!-- Preview Data -->
             <div v-if="parsedData.length > 0">
                <div class="text-subtitle-2 mb-2 ml-1">Vista Previa de Estructura Detectada</div>
                <v-expansion-panels variant="accordion" multiple>
                    <v-expansion-panel
                        v-for="(cat, i) in parsedData"
                        :key="i"
                    >
                        <v-expansion-panel-title>
                            <div class="d-flex align-center">
                                <strong class="mr-2">{{ cat.nombre_categoria }}</strong>
                                <v-chip size="x-small" class="mr-2">{{ cat.subcategorias.length }} Subcategorías</v-chip>
                            </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                             <v-list density="compact">
                                <v-list-item v-for="(sub, j) in cat.subcategorias" :key="j">
                                    <template v-slot:prepend>
                                        <v-icon size="small" icon="mdi-subdirectory-arrow-right"></v-icon>
                                    </template>
                                    <v-list-item-title class="font-weight-medium">
                                        {{ sub.nombre_subcategoria }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle v-if="sub.filtros.length > 0">
                                        {{ sub.filtros.map(f => `${f.nombre_filtro} (${f.opciones?.length || 0})`).join(', ') }}
                                    </v-list-item-subtitle>
                                </v-list-item>
                             </v-list>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
             </div>
        </div>
    </div>
</template>
