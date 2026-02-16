<script setup>
  import { useMutation, useQuery } from '@tanstack/vue-query';
  import { computed, onMounted, reactive, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { getCategoriaById, getCategorias } from '@/services/categorizacion.service';
  import { getProductoById, updateProducto } from '@/services/productos.service';

  import { uploadFile } from '@/services/storage.service';
  import { getImage } from '@/utils/getImage';

  const route = useRoute();
  const router = useRouter();
  const productId = route.params.id;
  const formRef = ref(null);
  const variantFormRef = ref(null);
  const isSubmitting = ref(false);
  const isLoadingProduct = ref(true);

  // Local State
  const selectedCategoryId = ref(null);
  const categoryDetails = ref(null);
  const isLoadingCategory = ref(false);

  // Main Form
  const form = reactive({
    nombre_producto: '',
    descripcion_producto: '',
    imagen_url: '',
    id_subcategoria: null,
    variantes: [] 
  });

  // Variant Form
  const newVariant = reactive({
    id: null, // Track ID for updates
    sku: '',
    precio_unitario: 0,
    costo_unitario: 0,
    stock_actual: 0,
    stock_minimo: 5,
    detalles: []
  });
  
  const isEditingVariant = ref(false); // Mode toggle

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
    if (!newId) {
      categoryDetails.value = null;
      return;
    }

    isLoadingCategory.value = true;
    try {
      const response = await getCategoriaById(newId);
      categoryDetails.value = response.data;
    } catch {
      showErrorToast('Error al cargar detalles de la categoría');
    } finally {
      isLoadingCategory.value = false;
    }
  });

  const subcategories = computed(() => categoryDetails.value?.subcategorias || []);

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
    newVariant.id = null;
    newVariant.sku = '';
    newVariant.precio_unitario = 0;
    newVariant.costo_unitario = 0;
    newVariant.stock_actual = 0;
    newVariant.stock_minimo = 5;
    
    // Init structure
    newVariant.detalles = availableFilters.value.map(f => ({
      id_filtro: f.id,
      nombre_filtro: f.nombre_filtro,
      id_opcion_filtro: null
    }));
    isEditingVariant.value = false;
  }
  
  // Watch subcategory ONLY if not loading initial data to prevent reset
  // We handle initial load separately.
  watch(() => form.id_subcategoria, (newVal, oldVal) => {
    if (oldVal && newVal !== oldVal && !isLoadingProduct.value) {
      // If user *changes* subcategory manually, reset variants
      form.variantes = [];
      resetVariantForm();
    } else if (newVal && availableFilters.value.length > 0 && newVariant.detalles.length === 0) {
      // Init form if empty
      resetVariantForm();
    }
  });

  async function addVariant() {
    const { valid } = await variantFormRef.value.validate();
    if (!valid) return;

    // Check missing attributes
    const missingFilter = newVariant.detalles.find(d => !d.id_opcion_filtro);
    if (missingFilter) {
      showErrorToast(`Seleccione una opción para ${missingFilter.nombre_filtro}`);
      return;
    }

    // Check duplicate SKU (exclude self if editing)
    if (newVariant.sku && form.variantes.some(v => v.sku === newVariant.sku && v !== editingVariantRef.value)) {
      showErrorToast('El SKU ya existe en otras variantes');
      return;
    }

    // Check duplicate Combination
    const isDuplicate = form.variantes.some(v => {
      if (v === editingVariantRef.value) return false; // Ignore self
      return v.detalles.every(vd => {
        const newVal = newVariant.detalles.find(nd => nd.id_filtro === vd.id_filtro);
        return newVal && newVal.id_opcion_filtro === vd.id_opcion_filtro;
      });
    });

    if (isDuplicate) {
      showErrorToast('Ya existe una variante con esta combinación');
      return;
    }

    if (isEditingVariant.value && editingVariantRef.value) {
      // Update existing item in array
      Object.assign(editingVariantRef.value, JSON.parse(JSON.stringify(newVariant)));
      showSuccessToast('Variante actualizada');
    } else {
      // Add new
      form.variantes.push(JSON.parse(JSON.stringify(newVariant)));
      showSuccessToast('Variante agregada');
    }
    
    resetVariantForm();
    editingVariantRef.value = null;
  }

  const editingVariantRef = ref(null);

  function editVariant(index) {
    const variant = form.variantes[index];
    editingVariantRef.value = variant; // Keep Ref to update in place
      
    // Copy to form
    newVariant.id = variant.id;
    newVariant.sku = variant.sku;
    newVariant.precio_unitario = variant.precio_unitario;
    newVariant.costo_unitario = variant.costo_unitario;
    newVariant.stock_actual = variant.stock_actual;
    newVariant.stock_minimo = variant.stock_minimo;
      
    // Map details. 
    // Note: variant.detalles might have extra fields from DB or just ids.
    // We need to match current available filters.
    newVariant.detalles = availableFilters.value.map(f => {
      const existing = variant.detalles.find(d => d.id_filtro === f.id || (d.opcion_filtro && d.opcion_filtro.id_filtro === f.id));
      return {
        id_filtro: f.id,
        nombre_filtro: f.nombre_filtro,
        id_opcion_filtro: existing ? (existing.id_opcion_filtro || existing.opcion_filtro?.id) : null
      };
    });

    isEditingVariant.value = true;
  }

  function removeVariant(index) {
    if (confirm('¿Eliminar esta variante? Si guarda los cambios, esta acción será permanente.')) {
      form.variantes.splice(index, 1);
    }
  }

  function cancelEdit() {
    resetVariantForm();
    editingVariantRef.value = null;
  }

  function getOptionName(detalle) {
    if (!detalle.id_opcion_filtro) return '';
    const opts = getFilterOptions(detalle.id_filtro);
    const opt = opts.find(o => o.id === detalle.id_opcion_filtro);
    return opt ? opt.valor_opcion : (detalle.opcion_filtro?.valor_opcion || '');
  }

  // Load Product
  async function loadProduct () {
    try {
      const response = await getProductoById(productId);
      const prod = response.data;
        
      form.nombre_producto = prod.nombre_producto;
      form.descripcion_producto = prod.descripcion_producto;
      form.imagen_url = prod.imagen_url;
      form.id_subcategoria = prod.id_subcategoria;

      // Set Category ID
      if (prod.subcategoria && prod.subcategoria.id_categoria) {
        selectedCategoryId.value = prod.subcategoria.id_categoria;
        // Wait for subcategories and filters to load?
        // We need them to map variants correctly.
        // We can manually call getCategoriaById or wait for Watcher?
        // Watcher is async. We might have race condition mapping variants if filters aren't ready.
        // Let's await details manually.
        try {
          const catResp = await getCategoriaById(prod.subcategoria.id_categoria);
          categoryDetails.value = catResp.data;
        } catch(error) { console.error(error); }
      }

      // Map Variants
      if (prod.variantes) {
        form.variantes = prod.variantes.map(v => ({
          id: v.id,
          sku: v.sku,
          stock_actual: v.stock_actual,
          precio_unitario: Number(v.precio_unitario),
          costo_unitario: Number(v.costo_unitario),
          stock_minimo: v.stock_minimo || 5, // Default if missing
          imagen_url: v.imagen_url,
          // Map details flatten
          detalles: v.detalles_filtros.map(df => ({
            id_filtro: df.opcion_filtro?.id_filtro,
            nombre_filtro: df.opcion_filtro?.filtro?.nombre_filtro, // Optional, UI might need re-lookup
            id_opcion_filtro: df.id_opcion_filtro,
            opcion_filtro: df.opcion_filtro // Keep object for display reference
          }))
        }));
      }

      if (form.imagen_url) {
        try {
          previewImage.value = await getImage(form.imagen_url);
        } catch (error) {
          console.error(error);
        }
      }
      
      resetVariantForm(); // Init new variant form with loaded filters

    } catch (error) {
      console.error(error);
      showErrorToast('Error al cargar producto');
      router.push('/main/productos');
    } finally {
      isLoadingProduct.value = false;
    }
  }

  // Submit
  const { mutate } = useMutation({
    mutationFn: (data) => updateProducto(productId, data),
    onSuccess: () => {
      showSuccessToast('Producto actualizado exitosamente');
      router.push('/main/productos');
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al actualizar producto');
      isSubmitting.value = false;
    }
  });

  async function handleSubmit () {
    const { valid } = await formRef.value.validate();
    if (!valid) return;

    if (form.variantes.length === 0) {
      showErrorToast('Debe existir al menos una variante');
      return;
    }

    isSubmitting.value = true;

    // Clean payload
    const cleanedVariants = form.variantes.map(v => ({
      id: v.id, // Include ID for update/delete logic
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

  // Image Upload same as Create
  const fileInput = ref(null);
  const imageLoading = ref(false);
  const previewImage = ref(null);

  function triggerFileInput () { fileInput.value.click(); }

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: async (response) => {
      if (response.success && response.data?.url) {
        const newUrl = response.data.url;
        form.imagen_url = newUrl;
        try {
          await updateProducto(productId, { imagen_url: newUrl }); // Quick save image
          showSuccessToast('Imagen actualizada');
          previewImage.value = await getImage(newUrl);
        } catch (error) { console.error(error); }
      }
    },
    onError: () => showErrorToast('Error al subir imagen'),
    onSettled: () => imageLoading.value = false
  });

  function handleFileUpload (event) {
    const file = event.target.files[0];
    if (!file) return;
    imageLoading.value = true;
    uploadMutation.mutate({ image: file });
  }

  onMounted(() => {
    if (productId) loadProduct();
  });
</script>

<template>
  <div class="h-100 d-flex flex-column bg-grey-lighten-5">
    <!-- Header -->
    <div class="d-flex align-center pa-4 bg-white border-b">
      <v-btn class="mr-2" icon to="/main/productos" variant="text">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div>
        <h1 class="text-h6 font-weight-bold">Editar Producto</h1>
        <div class="text-caption text-medium-emphasis">
          Actualiza información y variantes
        </div>
      </div>
      <v-spacer />
      <v-btn
        color="primary"
        :loading="isSubmitting"
        prepend-icon="mdi-content-save"
        @click="handleSubmit"
      >
        Guardar Cambios
      </v-btn>
    </div>

    <div class="pa-4 flex-grow-1 overflow-y-auto">
      <div v-if="isLoadingProduct" class="d-flex justify-center py-8">
        <v-progress-circular color="primary" indeterminate />
      </div>

      <v-form v-else ref="formRef" @submit.prevent="handleSubmit">
        <v-row>
          <!-- Same layout as Create -->
          <v-col cols="12" md="4">
            <v-card class="mb-4" title="Información General">
              <v-card-text>
                <div class="d-flex flex-column align-center mb-6">
                  <div class="position-relative mb-2">
                    <v-avatar
                      class="border cursor-pointer elevation-2"
                      color="surface-variant"
                      size="120"
                      @click="triggerFileInput"
                    >
                      <v-img v-if="previewImage" alt="Producto" cover :src="previewImage">
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
                  label="Nombre"
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

          <v-col cols="12" md="8">
            <v-card v-if="form.id_subcategoria" title="Gestionar Variantes">
              <template #append>
                <v-chip color="info" size="small" variant="tonal">{{ form.variantes.length }} variantes</v-chip>
              </template>
              <v-card-text>
                <!-- Variant Form -->
                <v-sheet class="bg-grey-lighten-4 pa-4 rounded border mb-4">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <div class="text-subtitle-2 font-weight-bold">{{ isEditingVariant ? 'Editar Variante' : 'Nueva Variante' }}</div>
                    <v-btn
                      v-if="isEditingVariant"
                      color="grey"
                      size="x-small"
                      variant="text"
                      @click="cancelEdit"
                    >Cancelar Edición</v-btn>
                  </div>
                    
                  <v-form ref="variantFormRef" @submit.prevent>
                    <v-row dense>
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
                      <v-col cols="12" md="4">
                        <v-text-field 
                          v-model="newVariant.sku" 
                          v-maska="'***-###'"
                          bg-color="white" 
                          density="compact" 
                          label="SKU" 
                          placeholder="AAA-123"
                          variant="outlined" 
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model.number="newVariant.precio_unitario"
                          bg-color="white"
                          density="compact"
                          label="Precio"
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
                          label="Costo"
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
                          label="Stock"
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
                          label="Minimo"
                          :rules="[requiredRule, numberRule]"
                          type="number"
                          variant="outlined"
                        />
                      </v-col>
                    </v-row>
                    <div class="d-flex justify-end mt-2">
                      <v-btn :color="isEditingVariant ? 'warning' : 'secondary'" prepend-icon="mdi-check" size="small" @click="addVariant">
                        {{ isEditingVariant ? 'Actualizar' : 'Agregar' }}
                      </v-btn>
                    </div>
                  </v-form>
                </v-sheet>

                <v-table v-if="form.variantes.length > 0" density="compact" hover>
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
                    <tr v-for="(variant, idx) in form.variantes" :key="idx" :class="{'bg-yellow-lighten-5': editingVariantRef === variant}">
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
                          class="mr-1"
                          color="primary"
                          icon="mdi-pencil"
                          size="x-small"
                          variant="text"
                          @click="editVariant(idx)"
                        />
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
                <div v-else class="text-center text-medium-emphasis py-4">Sin variantes.</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-form>
    </div>
  </div>
</template>
