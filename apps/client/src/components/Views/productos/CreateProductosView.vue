<script setup>
  import { useMutation, useQuery } from '@tanstack/vue-query';
  import { computed, reactive, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { getCategoriaById, getCategorias } from '@/services/categorizacion.service';
  import { createProducto } from '@/services/productos.service';
  import { useHead } from '@unhead/vue';

  // --- SEO ---
  useHead({
    title: 'Nuevo Producto',
    meta: [
      { name: 'description', content: 'Registro de nuevo producto y configuración de variantes.' }
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });

  // Image Upload Logic
  import { uploadFile } from '@/services/storage.service';
  import { getImage } from '@/utils/getImage';

  const router = useRouter();
  const formRef = ref(null);
  const variantFormRef = ref(null); // Validation for new variant
  const isSubmitting = ref(false);

  // Local State
  const selectedCategoryId = ref(null);
  const categoryDetails = ref(null);
  const isLoadingCategory = ref(false);

  // Main Product Form
  const form = reactive({
    nombre_producto: '',
    descripcion_producto: '',
    imagen_url: '',
    id_subcategoria: null,
    variantes: [] 
  });

  // New Variant Form State
  const newVariant = reactive({
    sku: '',
    precio_unitario: 0,
    costo_unitario: 0,
    stock_actual: 0,
    stock_minimo: 5,
    detalles: [] // Array of { id_filtro, id_opcion_filtro }
  });
  
  const isAddingVariant = ref(false);

  // Rules
  const requiredRule = v => !!v || 'Campo requerido';
  const numberRule = v => (v !== null && v !== '' && !isNaN(v) && v >= 0) || 'Debe ser un número válido';

  // Fetch Categories List
  const { data: categoriesData } = useQuery({
    queryKey: ['categorias-list'],
    queryFn: () => getCategorias({ limit: 100 })
  });
  const categories = computed(() => categoriesData.value?.data || []);

  // Fetch selected category details
  watch(selectedCategoryId, async (newId) => {
    form.id_subcategoria = null;
    form.variantes = []; // Reset variants if category changes (filters change)
    resetVariantForm();
    categoryDetails.value = null;

    if (newId) {
      isLoadingCategory.value = true;
      try {
        const response = await getCategoriaById(newId);
        categoryDetails.value = response.data;
      } catch {
        showErrorToast('Error al cargar detalles de la categoría');
      } finally {
        isLoadingCategory.value = false;
      }
    }
  });

  const subcategories = computed(() => categoryDetails.value?.subcategorias || []);

  // Available Filters for Selected Subcategory
  const availableFilters = computed(() => {
    if (!form.id_subcategoria) return [];
    
    const sub = subcategories.value.find(s => s.id === form.id_subcategoria);
    if (!sub) return [];
    
    return sub.filtros || [];
  });

  function getFilterOptions (filtroId) {
    if (!filtroId) return [];
    const filtro = availableFilters.value.find(f => f.id === filtroId);
    return filtro?.opciones || [];
  }

  // --- Variant Management ---

  function resetVariantForm() {
    newVariant.sku = '';
    newVariant.precio_unitario = 0;
    newVariant.costo_unitario = 0;
    newVariant.stock_actual = 0;
    newVariant.stock_minimo = 5;
    
    // Initialize details based on available filters
    // One entry per filter to force user to select option? Or dynamic?
    // User requested "single type and single size" per variant.
    // So we should pre-fill the structure.
    newVariant.detalles = availableFilters.value.map(f => ({
      id_filtro: f.id,
      nombre_filtro: f.nombre_filtro, // For UI display
      id_opcion_filtro: null
    }));
  }

  // Watch for subcategory change to init variant form structure
  watch(() => form.id_subcategoria, () => {
    form.variantes = [];
    resetVariantForm();
  });

  async function addVariant() {
    // Only validate variant form if visible or effectively used
    const { valid } = await variantFormRef.value.validate();
    if (!valid) return;

    // Validate attributes: ensure all required filters have an option selected? 
    // Or at least one? Let's strict: all available filters in subcategory should be defined for the variant
    // to avoid ambiguity, OR allow partials. 
    // Given the user prompt "si hay dos especificaciones... añadirle un solo tipo y una sola talla",
    // implies we define the specific combination.
    
    // Check if any filter is missing selection
    const missingFilter = newVariant.detalles.find(d => !d.id_opcion_filtro);
    if (missingFilter) {
      showErrorToast(`Seleccione una opción para ${missingFilter.nombre_filtro}`);
      return;
    }

    // Check duplicate SKU in local list
    if (newVariant.sku && form.variantes.some(v => v.sku === newVariant.sku)) {
      showErrorToast('El SKU ya existe en la lista de variantes');
      return;
    }

    // Check duplicate Combination
    // Two variants shouldn't have exact same options?
    // Unless they differentiate by something else? Usually combination must be unique.
    const isDuplicate = form.variantes.some(v => {
      // Check if all options match
      return v.detalles.every(vd => {
        const newVal = newVariant.detalles.find(nd => nd.id_filtro === vd.id_filtro);
        return newVal && newVal.id_opcion_filtro === vd.id_opcion_filtro;
      });
    });

    if (isDuplicate) {
      showErrorToast('Ya existe una variante con esta combinación de especificaciones');
      return;
    }

    form.variantes.push(JSON.parse(JSON.stringify(newVariant)));
    
    // Clear only SKU usually, keeping price/cost/stock might be useful for batch entry?
    // User convention: typically cleared or kept. Let's clear to be safe.
    // But keep structure.
    newVariant.sku = '';
    // newVariant.stock_actual = 0; 
    // Keep price/cost as they likely remain same for same product different size
    
    isAddingVariant.value = false; // Close expanded form if we want toggle behavior
    showSuccessToast('Variante agregada');
  }

  function removeVariant(index) {
    form.variantes.splice(index, 1);
  }

  function getOptionName(detalle) {
    if (!detalle.id_opcion_filtro) return '';
    const opts = getFilterOptions(detalle.id_filtro);
    const opt = opts.find(o => o.id === detalle.id_opcion_filtro);
    return opt ? opt.valor_opcion : '';
  }

  // --- Image Upload ---
  const fileInput = ref(null);
  const imageLoading = ref(false);
  const previewImage = ref(null);

  function triggerFileInput () {
    fileInput.value.click();
  }

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: async (response) => {
      if (response.success && response.data?.url) {
        form.imagen_url = response.data.url;
        try {
          previewImage.value = await getImage(response.data.url);
          showSuccessToast('Imagen subida correctamente');
        } catch (error) {
          console.error('Error loading preview', error);
        }
      }
    },
    onError: () => {
      showErrorToast('Error al subir la imagen');
    },
    onSettled: () => {
      imageLoading.value = false;
    }
  });

  function handleFileUpload (event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showErrorToast('La imagen no debe superar los 2MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showErrorToast('Solo se permiten archivos de imagen');
      return;
    }
    imageLoading.value = true;
    uploadMutation.mutate({ image: file }); 
  }

  // --- Main Submission ---
  const { mutate } = useMutation({
    mutationFn: (data) => createProducto(data),
    onSuccess: () => {
      showSuccessToast('Producto creado exitosamente');
      router.push('/main/productos');
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al crear producto');
      isSubmitting.value = false;
    }
  });

  async function handleSubmit () {
    const { valid } = await formRef.value.validate();
    if (!valid) return;

    if (form.variantes.length === 0) {
      showErrorToast('Debe agregar al menos una variante (especificación) al producto');
      return;
    }

    isSubmitting.value = true;

    // Prepare Payload
    // Clean details to only send { id_opcion_filtro }
    const cleanedVariants = form.variantes.map(v => ({
      sku: v.sku,
      precio_unitario: v.precio_unitario,
      costo_unitario: v.costo_unitario,
      stock_actual: v.stock_actual,
      stock_minimo: v.stock_minimo,
      detalles: v.detalles.map(d => ({
        id_opcion_filtro: d.id_opcion_filtro
      }))
    }));

    const payload = {
      nombre_producto: form.nombre_producto,
      descripcion_producto: form.descripcion_producto,
      imagen_url: form.imagen_url,
      id_subcategoria: form.id_subcategoria,
      variantes: cleanedVariants
    };

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
        <h1 class="text-h6 font-weight-bold">Nuevo Producto</h1>
        <div class="text-caption text-medium-emphasis">
          Registra un nuevo producto y sus variantes
        </div>
      </div>
      <v-spacer />
      <v-btn
        color="primary"
        :loading="isSubmitting"
        prepend-icon="mdi-content-save"
        @click="handleSubmit"
      >
        Guardar Producto
      </v-btn>
    </div>

    <div class="pa-4 flex-grow-1 overflow-y-auto">
      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-row>
          <!-- Left Column: Basic Info & Image -->
          <v-col cols="12" md="4">
            <v-card class="mb-4" title="Información General">
              <v-card-text>
                <!-- Image Upload -->
                <div class="d-flex flex-column align-center mb-6">
                  <div class="position-relative mb-2">
                    <v-avatar
                      class="border cursor-pointer elevation-2"
                      color="surface-variant"
                      size="120"
                      @click="triggerFileInput"
                    >
                      <v-img
                        v-if="previewImage"
                        alt="Producto"
                        cover
                        :src="previewImage"
                      >
                        <template #placeholder>
                          <v-progress-circular color="primary" indeterminate />
                        </template>
                      </v-img>
                      <span v-else class="text-h3 font-weight-bold text-uppercase">
                        {{ form.nombre_producto?.charAt(0) || 'P' }}
                      </span>
                      <v-overlay activator="parent" class="align-center justify-center" scrim="#000" theme="dark">
                        <v-icon icon="mdi-camera" size="large" />
                      </v-overlay>
                    </v-avatar>
                    <v-btn
                      class="position-absolute"
                      color="primary"
                      icon="mdi-pencil"
                      size="small"
                      style="bottom: 0; right: 0; z-index: 2;"
                      @click="triggerFileInput"
                    />
                  </div>
                  <input
                    ref="fileInput"
                    accept="image/*"
                    class="d-none"
                    type="file"
                    @change="handleFileUpload"
                  >
                </div>

                <v-text-field
                  v-model="form.nombre_producto"
                  class="mb-2"
                  density="comfortable"
                  label="Nombre del Producto"
                  :rules="[requiredRule]"
                  variant="outlined"
                />

                <v-textarea
                  v-model="form.descripcion_producto"
                  class="mb-2"
                  density="comfortable"
                  label="Descripción"
                  rows="3"
                  variant="outlined"
                />

                <v-autocomplete
                  v-model="selectedCategoryId"
                  density="comfortable"
                  item-title="nombre_categoria"
                  item-value="id"
                  :items="categories"
                  label="Categoría"
                  :rules="[requiredRule]"
                  variant="outlined"
                />

                <v-autocomplete
                  v-if="selectedCategoryId && !isLoadingCategory"
                  v-model="form.id_subcategoria"
                  density="comfortable"
                  item-title="nombre_subcategoria"
                  item-value="id"
                  :items="subcategories"
                  label="Subcategoría"
                  :rules="[requiredRule]"
                  variant="outlined"
                />
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Right Column: Variants -->
          <v-col cols="12" md="8">
            <v-card v-if="form.id_subcategoria" title="Variantes y Especificaciones">
              <template #append>
                <v-chip color="info" size="small" variant="tonal">
                  {{ form.variantes.length }} variantes agregadas
                </v-chip>
              </template>
               
              <v-card-text>
                <v-alert v-if="availableFilters.length === 0" class="mb-4" type="warning" variant="tonal">
                  Esta subcategoría no tiene filtros configurados. Se creará una variante predeterminada.
                </v-alert>

                <!-- Add Variant Form -->
                <v-sheet class="bg-grey-lighten-4 pa-4 rounded border mb-4">
                  <div class="text-subtitle-2 font-weight-bold mb-2">Nueva Variante</div>
                  <v-form ref="variantFormRef" @submit.prevent>
                    <v-row dense>
                      <!-- Dynamic Attributes -->
                      <v-col v-for="(detalle, i) in newVariant.detalles" :key="i" cols="12" md="4">
                        <v-select
                          v-model="detalle.id_opcion_filtro"
                          bg-color="white"
                          density="compact"
                          item-title="valor_opcion"
                          item-value="id"
                          :items="getFilterOptions(detalle.id_filtro)"
                          :label="detalle.nombre_filtro"
                          :rules="[requiredRule]"
                          variant="outlined"
                        />
                      </v-col>
                            
                      <!-- Variant Details -->
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model="newVariant.sku"
                          v-maska="'***-###'"
                          bg-color="white"
                          density="compact"
                          label="SKU (Opcional)"
                          placeholder="AAA-123"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model.number="newVariant.precio_unitario"
                          bg-color="white"
                          density="compact"
                          label="Precio Unitario"
                          prefix="$"
                          :rules="[requiredRule, numberRule]"
                          type="number"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model.number="newVariant.costo_unitario"
                          bg-color="white"
                          density="compact"
                          label="Costo Unitario"
                          prefix="$"
                          :rules="[numberRule]"
                          type="number"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model.number="newVariant.stock_actual"
                          bg-color="white"
                          density="compact"
                          label="Stock Inicial"
                          :rules="[requiredRule, numberRule]"
                          type="number"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model.number="newVariant.stock_minimo"
                          bg-color="white"
                          density="compact"
                          label="Stock Mínimo"
                          :rules="[requiredRule, numberRule]"
                          type="number"
                          variant="outlined"
                        />
                      </v-col>
                    </v-row>
                    <div class="d-flex justify-end mt-2">
                      <v-btn color="secondary" prepend-icon="mdi-plus" size="small" @click="addVariant">
                        Agregar Variante
                      </v-btn>
                    </div>
                  </v-form>
                </v-sheet>

                <!-- Variants List Table -->
                <v-table v-if="form.variantes.length > 0" density="compact">
                  <thead>
                    <tr>
                      <th class="text-left">Especificaciones</th>
                      <th class="text-left">SKU</th>
                      <th class="text-right">Precio</th>
                      <th class="text-right">Stock</th>
                      <th class="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(variant, idx) in form.variantes" :key="idx">
                      <td>
                        <v-chip v-for="(det, k) in variant.detalles" :key="k" class="mr-1 mb-1" size="x-small">
                          {{ det.nombre_filtro }}: {{ getOptionName(det) }}
                        </v-chip>
                      </td>
                      <td>{{ variant.sku || '-' }}</td>
                      <td class="text-right">${{ variant.precio_unitario }}</td>
                      <td class="text-right">{{ variant.stock_actual }}</td>
                      <td class="text-center">
                        <v-btn
                          color="error"
                          icon="mdi-delete"
                          size="x-small"
                          variant="text"
                          @click="removeVariant(idx)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </v-table>
                <div v-else class="text-center text-medium-emphasis py-4">
                  No has agregado variantes aún. Use el formulario de arriba.
                </div>

              </v-card-text>
            </v-card>

            <v-alert
              v-else
              class="mt-4"
              icon="mdi-arrow-left"
              title="Seleccione Categoría"
              type="info"
              variant="text"
            >
              Seleccione una categoría y subcategoría para configurar las variantes.
            </v-alert>
          </v-col>
        </v-row>
      </v-form>
    </div>
  </div>
</template>
