<script setup>
  import { useMutation, useQueryClient } from '@tanstack/vue-query';
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import * as XLSX from 'xlsx';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { getCategoriaById, getSubcategorias, getAllCategorias } from '@/services/categorizacion.service';
  import { bulkCreateProductos } from '@/services/productos.service';

  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInput = ref(null);
  const parsedData = ref([]);
  const isProcessing = ref(false);
  const isUploading = ref(false);
  const processingStatus = ref('');

  function downloadTemplate () {
    const data = [
      {
        nombre_producto: 'Camisa Polo Azul',
        descripcion_producto: 'Camisa de algodón',
        precio_unitario: 150,
        costo_unitario: 100,
        stock_actual: 50,
        stock_minimo: 5,
        nombre_categoria: 'Uniformes', // Added category
        nombre_subcategoria: 'Camisas', 
        filtro: 'Talla',
        opcion: 'M'
      },
      {
        nombre_producto: 'Camisa Polo Azul',
        descripcion_producto: 'Camisa de algodón',
        precio_unitario: 150,
        costo_unitario: 100,
        stock_actual: 50,
        stock_minimo: 5,
        nombre_categoria: 'Uniformes',
        nombre_subcategoria: 'Camisas',
        filtro: 'Color',
        opcion: 'Azul'
      },
      {
        nombre_producto: 'Cuaderno Espiral',
        descripcion_producto: '100 hojas',
        precio_unitario: 25,
        costo_unitario: 15,
        stock_actual: 100,
        stock_minimo: 10,
        nombre_categoria: 'Útiles escolares',
        nombre_subcategoria: 'Útiles',
        filtro: '',
        opcion: ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Productos");
    
    // Auto-width
    const wscols = Object.keys(data[0]).map(k => ({ wch: 20 }));
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, `Plantilla_Productos_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  function handleFileUpload (event) {
    const file = event.target.files[0];
    if (!file) return;

    isProcessing.value = true;
    processingStatus.value = 'Leyendo archivo...';
    parsedData.value = [];
    
    const reader = new FileReader();

    reader.addEventListener('load', async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        processingStatus.value = 'Procesando datos y resolviendo referencias...';
        parsedData.value = await transformAndResolveReferences(json);
            
      } catch (error) {
        console.error(error);
        showErrorToast('Error al procesar el archivo');
      } finally {
        isProcessing.value = false;
        processingStatus.value = '';
      }
    });

    reader.readAsArrayBuffer(file);
  }

  // Helper: Resolve IDs
  async function transformAndResolveReferences (flatData) {
    // 1. Fetch all Categories to resolve Category Name -> ID
    // We need to match category name first to ensure correct subcategory logic
    // (e.g. "Camisas" in "Uniformes" vs "Camisas" in "Ropa Alternativa")
    let allCats = [];
    try {
      const catsResponse = await getAllCategorias();
      allCats = catsResponse.data || [];
    } catch (e) {
      console.error("Error fetching categories", e);
      return [];
    }
    
    const catNameMap = new Map();
    allCats.forEach(c => catNameMap.set(c.nombre_categoria.toLowerCase().trim(), c.id));

    // 2. Identify which Categories we need to fetch details for (Subcategories + Filters)
    const fileCatNames = [...new Set(flatData.map(r => r.nombre_categoria?.toString().trim()).filter(Boolean))];
    
    // Map: CategoryID -> FullCategoryDetails
    const catDetailsMap = new Map();

    for (const name of fileCatNames) {
      const catId = catNameMap.get(name.toLowerCase());
      if (catId && !catDetailsMap.has(catId)) {
        try {
          const detailsPos = await getCategoriaById(catId);
          if (detailsPos.data) {
            catDetailsMap.set(catId, detailsPos.data);
          }
        } catch (e) {
          console.error(`Error fetching category details for ${name}`, e);
        }
      }
    }

    // 3. Group and Process Products
    const productsMap = new Map();

    for (const row of flatData) {
      const prodName = row.nombre_producto?.toString().trim();
      const catName = row.nombre_categoria?.toString().trim();
      const subName = row.nombre_subcategoria?.toString().trim();
      
      if (!prodName) continue;

      // Initialize Product in Map if new
      if (!productsMap.has(prodName)) {
        let subId = null;
        let subDetails = null;

        // Resolve Subcategory
        if (catName && subName) {
           const catId = catNameMap.get(catName.toLowerCase());
           if (catId) {
             const fullCat = catDetailsMap.get(catId);
             if (fullCat && fullCat.subcategorias) {
               // Find subcategory case-insensitive
               subDetails = fullCat.subcategorias.find(s => s.nombre_subcategoria.toLowerCase() === subName.toLowerCase());
               if (subDetails) {
                 subId = subDetails.id;
               }
             }
           }
        }

        productsMap.set(prodName, {
          nombre_producto: prodName,
          descripcion_producto: row.descripcion_producto,
          precio_unitario: Number(row.precio_unitario) || 0,
          costo_unitario: Number(row.costo_unitario) || 0,
          stock_actual: Number(row.stock_actual) || 0,
          stock_minimo: Number(row.stock_minimo) || 5,
          id_subcategoria: subId,
          subCategoryObject: subDetails, // Store for filter resolution
          catNameRaw: catName, // UI
          subNameRaw: subName, // UI
          detalles: []
        });
      }

      const product = productsMap.get(prodName);
      
      // Resolve Attributes (Filters/Options)
      if (product.subCategoryObject) {
         const filtroName = row.filtro?.toString().trim();
         const opcionValue = row.opcion?.toString().trim();
         
         if (filtroName && opcionValue) {
           // Find Filter in Subcategory matches
           const subFilters = product.subCategoryObject.filtros || [];
           const filtro = subFilters.find(f => f.nombre_filtro.toLowerCase() === filtroName.toLowerCase());
           
           if (filtro && filtro.opciones) {
             const opcion = filtro.opciones.find(o => 
                o.valor_opcion.toString().trim().toLowerCase() === opcionValue.toLowerCase()
             );
             
             if (opcion && !product.detalles.some(d => d.id_opcion_filtro === opcion.id)) {
               product.detalles.push({
                 id_opcion_filtro: opcion.id,
                 nombre_filtro: filtro.nombre_filtro,
                 valor_opcion: opcion.valor_opcion
               });
             }
           }
         }
      }
    }

    return Array.from(productsMap.values());
  }

  const { mutate } = useMutation({
    mutationFn: bulkCreateProductos,
    onSuccess: (data) => {
      showSuccessToast(data.message || 'Carga masiva completada');
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      router.push('/main/productos');
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error en carga masiva');
      isUploading.value = false;
    }
  });

  function handleUpload () {
    // Filter out invalid items (missing subcategory)
    const validItems = parsedData.value.filter(p => p.id_subcategoria);
    
    if (validItems.length === 0) {
      showErrorToast('No hay productos válidos (con subcategoría reconocida) para cargar');
      return;
    }

    // Sanitize payload: remove UI-only fields from detalles
    // item spread includes costo_unitario and excludes imagen_url if not in parsedData
    const payload = validItems.map(item => ({
      ...item,
      detalles: item.detalles.map(d => ({ id_opcion_filtro: d.id_opcion_filtro }))
    }));

    isUploading.value = true;
    mutate(payload);
  }
</script>

<template>
  <div class="h-100 d-flex flex-column bg-grey-lighten-5">
    <!-- Header -->
    <div class="d-flex align-center pa-4 bg-white border-b">
      <v-btn class="mr-2" icon to="/main/productos" variant="text">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div>
        <h1 class="text-h6 font-weight-bold">Carga Masiva de Productos</h1>
        <div class="text-caption text-medium-emphasis">
          Sube un archivo Excel con el inventario
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
                    
          <div v-if="processingStatus" class="mt-2 text-caption text-info">
            {{ processingStatus }}
          </div>

          <v-alert
            v-if="parsedData.length > 0"
            class="mt-4"
            density="compact"
            type="success"
            variant="tonal"
          >
            Se han detectado <strong>{{ parsedData.length }}</strong> productos. 
            <span v-if="parsedData.some(p => !p.id_subcategoria)" class="text-error font-weight-bold">
              Advertencia: Algunos productos tienen subcategorías no reconocidas y se omitirán.
            </span>
          </v-alert>
        </v-card-text>
      </v-card>

      <!-- Preview Data -->
      <div v-if="parsedData.length > 0">
        <div class="text-subtitle-2 mb-2 ml-1">Vista Previa</div>
        <v-expansion-panels multiple variant="accordion">
          <v-expansion-panel
            v-for="(prod, i) in parsedData"
            :key="i"
            :disabled="!prod.id_subcategoria"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-icon 
                  class="mr-2" 
                  :color="prod.id_subcategoria ? 'success' : 'error'" 
                  size="small"
                >
                  {{ prod.id_subcategoria ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                </v-icon>
                <div class="d-flex flex-column mr-2">
                    <strong class="text-body-2">{{ prod.nombre_producto }}</strong>
                    <div class="text-caption text-medium-emphasis">
                        {{ prod.catNameRaw }} > {{ prod.subNameRaw }}
                    </div>
                </div>
                <v-spacer />
                <v-chip class="mr-1" color="primary" size="x-small" variant="flat">
                  Precio: ${{ prod.precio_unitario }}
                </v-chip>
                <v-chip color="secondary" size="x-small" variant="flat">
                  Costo: ${{ prod.costo_unitario }}
                </v-chip>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div><strong>Descripción:</strong> {{ prod.descripcion_producto }}</div>
              <div><strong>Stock:</strong> {{ prod.stock_actual }} (Min: {{ prod.stock_minimo }})</div>
              <div class="mt-2">
                <strong>Atributos Detectados:</strong>
                <div v-if="prod.detalles.length > 0" class="d-flex flex-wrap gap-1 mt-1">
                  <v-chip 
                    v-for="(det, k) in prod.detalles" 
                    :key="k"
                    size="x-small"
                    variant="outlined"
                  >
                    {{ det.nombre_filtro }}: {{ det.valor_opcion }}
                  </v-chip>
                </div>
                <div v-else class="text-caption font-italic">Sin atributos o no identificados</div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </div>
  </div>
</template>
