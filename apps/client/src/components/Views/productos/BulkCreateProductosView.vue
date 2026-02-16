<script setup>
  import { useMutation, useQueryClient } from '@tanstack/vue-query';
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import * as XLSX from 'xlsx';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { getAllCategorias, getCategoriaById, getSubcategorias } from '@/services/categorizacion.service';
  import { bulkCreateProductos } from '@/services/productos.service';
  import { useHead } from '@unhead/vue';

  // --- SEO ---
  useHead({
    title: 'Carga Masiva de Productos',
    meta: [
      { name: 'description', content: 'Importación masiva de productos y variantes desde Excel.' }
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
  const processingStatus = ref('');

  function downloadTemplate () {
    const data = [
      {
        nombre_producto: 'Camisa Polo',
        descripcion_producto: 'Camisa de algodón piqué',
        nombre_categoria: 'Uniformes',
        nombre_subcategoria: 'Camisas', 
        sku: 'CPL-001',
        precio_unitario: 150,
        costo_unitario: 100,
        stock_actual: 50,
        stock_minimo: 5,
        filtro: 'Talla',
        opcion: 'M'
      },
      {
        nombre_producto: 'Camisa Polo',
        descripcion_producto: 'Camisa de algodón piqué',
        nombre_categoria: 'Uniformes',
        nombre_subcategoria: 'Camisas',
        sku: 'CPL-002',
        precio_unitario: 150,
        costo_unitario: 100,
        stock_actual: 30,
        stock_minimo: 5,
        filtro: 'Talla',
        opcion: 'S'
      },
      {
        nombre_producto: 'Cuaderno Espiral',
        descripcion_producto: '100 hojas',
        nombre_categoria: 'Útiles',
        nombre_subcategoria: 'Cuadernos',
        sku: 'CUA-001',
        precio_unitario: 25,
        costo_unitario: 15,
        stock_actual: 100,
        stock_minimo: 10,
        filtro: '',
        opcion: ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Productos");
    
    const wscols = Object.keys(data[0]).map(k => ({ wch: 20 }));
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, `Plantilla_Productos_Variantes_${new Date().toISOString().slice(0,10)}.xlsx`);
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
    // 1. Fetch Categories
    let allCats = [];
    try {
      const catsResponse = await getAllCategorias();
      allCats = catsResponse.data || [];
    } catch (error) {
      console.error("Error fetching categories", error);
      return [];
    }
    
    const catNameMap = new Map();
    for (const c of allCats) catNameMap.set(c.nombre_categoria.toLowerCase().trim(), c.id);

    const fileCatNames = [...new Set(flatData.map(r => r.nombre_categoria?.toString().trim()).filter(Boolean))];
    const catDetailsMap = new Map();

    for (const name of fileCatNames) {
      const catId = catNameMap.get(name.toLowerCase());
      if (catId && !catDetailsMap.has(catId)) {
        try {
          const details = await getCategoriaById(catId);
          if (details.data) catDetailsMap.set(catId, details.data);
        } catch (error) { console.error(error); }
      }
    }

    // 2. Process Rows -> Variants
    // We treat each row as a VARIANT of a Product.
    // The Backend now groups them by 'nombre_producto'.
    // Here we resolve Subcategory and Attributes per row.

    const processedRows = [];

    for (const row of flatData) {
      const prodName = row.nombre_producto?.toString().trim();
      if (!prodName) continue;

      const catName = row.nombre_categoria?.toString().trim();
      const subName = row.nombre_subcategoria?.toString().trim();
      
      let subId = null;
      let subDetails = null;

      if (catName && subName) {
        const catId = catNameMap.get(catName.toLowerCase());
        if (catId) {
          const fullCat = catDetailsMap.get(catId);
          if (fullCat && fullCat.subcategorias) {
            subDetails = fullCat.subcategorias.find(s => s.nombre_subcategoria.toLowerCase() === subName.toLowerCase());
            if (subDetails) subId = subDetails.id;
          }
        }
      }

      // Resolve Attribute
      const detalles = [];
      if (subDetails) {
        const filtroName = row.filtro?.toString().trim();
        const opcionValue = row.opcion?.toString().trim();
         
        if (filtroName && opcionValue) {
          // Find Filter
          const subFilters = subDetails.filtros || [];
          const filtro = subFilters.find(f => f.nombre_filtro.toLowerCase() === filtroName.toLowerCase());
           
          if (filtro && filtro.opciones) {
            const opcion = filtro.opciones.find(o => 
              o.valor_opcion.toString().trim().toLowerCase() === opcionValue.toLowerCase()
            );
             
            if (opcion) {
              detalles.push({
                id_opcion_filtro: opcion.id,
                nombre_filtro: filtro.nombre_filtro,
                valor_opcion: opcion.valor_opcion
              });
            }
          }
        }
      }

      processedRows.push({
        nombre_producto: prodName,
        descripcion_producto: row.descripcion_producto,
        // Common info might be repeated, backend takes first one or groups them
        id_subcategoria: subId,
        sku: row.sku?.toString(),
        precio_unitario: Number(row.precio_unitario) || 0,
        costo_unitario: Number(row.costo_unitario) || 0,
        stock_actual: Number(row.stock_actual) || 0,
        stock_minimo: Number(row.stock_minimo) || 5,
        detalles: detalles,
        // UI Helpers
        catNameRaw: catName,
        subNameRaw: subName,
        isValid: !!subId
      });
    }

    return processedRows;
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
    const validItems = parsedData.value.filter(p => p.isValid);
    
    if (validItems.length === 0) {
      showErrorToast('No hay productos válidos para cargar');
      return;
    }

    // Backend expects flattened array, it will group them.
    const payload = validItems.map(item => ({
      nombre_producto: item.nombre_producto,
      descripcion_producto: item.descripcion_producto,
      id_subcategoria: item.id_subcategoria,
      sku: item.sku,
      precio_unitario: item.precio_unitario,
      costo_unitario: item.costo_unitario,
      stock_actual: item.stock_actual,
      stock_minimo: item.stock_minimo,
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
          Sube un archivo Excel con variantes de productos
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
            Se han detectado <strong>{{ parsedData.length }}</strong> registros (variantes). 
            <span v-if="parsedData.some(p => !p.isValid)" class="text-error font-weight-bold">
              Advertencia: Algunos registros tienen errores de categoría/subcategoría.
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
            :disabled="!prod.isValid"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center w-100">
                <v-icon 
                  class="mr-2" 
                  :color="prod.isValid ? 'success' : 'error'" 
                  size="small"
                >
                  {{ prod.isValid ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                </v-icon>
                <div class="d-flex flex-column mr-2">
                  <strong class="text-body-2">{{ prod.nombre_producto }}</strong>
                  <div class="text-caption text-medium-emphasis">SKU: {{ prod.sku || 'N/A' }}</div>
                </div>
                <v-spacer />
                <div class="text-caption mr-2">
                  {{ prod.catNameRaw }} > {{ prod.subNameRaw }}
                </div>
                <v-chip class="mr-1" color="primary" size="x-small" variant="flat">
                  ${{ prod.precio_unitario }}
                </v-chip>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div><strong>Descripción:</strong> {{ prod.descripcion_producto }}</div>
              <div><strong>Inventario:</strong> Stock: {{ prod.stock_actual }} (Min: {{ prod.stock_minimo }}) Costo: ${{ prod.costo_unitario }}</div>
              <div class="mt-2">
                <strong>Especificaciones:</strong>
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
                <div v-else class="text-caption font-italic">Sin especificaciones</div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </div>
  </div>
</template>
