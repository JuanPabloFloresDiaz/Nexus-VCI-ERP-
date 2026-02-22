<script setup>
  import { useMutation, useQueryClient } from '@tanstack/vue-query';
  import { useHead } from '@unhead/vue';
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import * as XLSX from 'xlsx';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { bulkCreateCategorias } from '@/services/categorizacion.service';

  // --- SEO ---
  useHead({
    title: 'Carga Masiva Categorías',
    meta: [
      { name: 'description', content: 'Importación masiva de estructura de categorías desde Excel.' }
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });

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

  function downloadTemplate () {
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
  }

  function handleFileUpload (event) {
    const file = event.target.files[0];
    if (!file) return;

    isProcessing.value = true;
    const reader = new FileReader();

    reader.addEventListener('load', (e) => {
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
    });

    reader.readAsArrayBuffer(file);
  }

  // Core logic: Transform Flat List -> Nested Tree
  function transformToNestedStructure (flatData) {
    const categoriesMap = new Map();

    for (const row of flatData) {
      const catName = row.nombre_categoria?.toString().trim();
      if (!catName) continue; // Skip empty rows

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
          if (optionValue && // Check for duplicates
            !filtro.opciones.find(o => o.valor_opcion === optionValue)) {
            filtro.opciones.push({ valor_opcion: optionValue });
          }
        }
      }
    }

    return Array.from(categoriesMap.values());
  }

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

  function handleUpload () {
    if (parsedData.value.length === 0) {
      showErrorToast('No hay datos válidos para cargar');
      return;
    }

    isUploading.value = true;
    mutate(parsedData.value);
  }
</script>

<template>
  <div class="h-100 d-flex flex-column bg-grey-lighten-5">
    <!-- Header -->
    <div class="d-flex align-center pa-4 bg-white border-b">
      <v-btn class="mr-2" icon to="/main/categorizacion" variant="text">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div>
        <h1 class="text-h6 font-weight-bold text-secondary">Carga Masiva de Categorización</h1>
        <div class="text-caption text-medium-emphasis">
          Sube un archivo Excel para crear categorías, subcategorías y filtros
        </div>
      </div>
      <v-spacer />
      <v-btn
        class="mr-2"
        prepend-icon="mdi-download"
        text="Descargar Plantilla"
        variant="outlined"
        @click="downloadTemplate"
      />
      <v-btn
        color="primary"
        :disabled="parsedData.length === 0"
        :loading="isUploading"
        prepend-icon="mdi-cloud-upload"
        @click="handleUpload"
      >
        Procesar Carga
      </v-btn>
    </div>

    <div class="pa-4 flex-grow-1 overflow-y-auto">
      <v-card class="mb-4">
        <v-card-text>
          <v-file-input
            v-model="fileInput"
            accept=".xlsx, .xls"
            hide-details
            label="Seleccionar archivo Excel"
            :loading="isProcessing"
            prepend-icon="mdi-microsoft-excel"
            variant="outlined"
            @change="handleFileUpload"
          />
                    
          <v-alert
            v-if="parsedData.length > 0"
            class="mt-4"
            density="compact"
            type="success"
            variant="tonal"
          >
            Se han detectado <strong>{{ parsedData.length }}</strong> categorías principales listas para importar.
          </v-alert>
        </v-card-text>
      </v-card>

      <!-- Preview Data -->
      <div v-if="parsedData.length > 0">
        <div class="text-subtitle-2 mb-2 ml-1">Vista Previa de Estructura Detectada</div>
        <v-expansion-panels multiple variant="accordion">
          <v-expansion-panel
            v-for="(cat, i) in parsedData"
            :key="i"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <strong class="mr-2">{{ cat.nombre_categoria }}</strong>
                <v-chip class="mr-2" size="x-small">{{ cat.subcategorias.length }} Subcategorías</v-chip>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list density="compact">
                <v-list-item v-for="(sub, j) in cat.subcategorias" :key="j">
                  <template #prepend>
                    <v-icon icon="mdi-subdirectory-arrow-right" size="small" />
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
