<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMutation, useQuery } from '@tanstack/vue-query';
import { createProducto } from '@/services/productos.service';
import { getCategorias, getCategoriaById } from '@/services/categorizacion.service';
import { showSuccessToast, showErrorToast } from '@/plugins/sweetalert2';

// Image Upload Logic
import { uploadFile } from '@/services/storage.service';
import { getImage } from '@/utils/getImage';

const router = useRouter();
const formRef = ref(null);
const isSubmitting = ref(false);

// Local State
const step = ref(1); // 1: Basic Info, 2: Categorization & Attributes
const selectedCategoryId = ref(null);
const categoryDetails = ref(null);
const isLoadingCategory = ref(false);

const form = reactive({
    nombre_producto: '',
    descripcion_producto: '',
    precio_unitario: 0,
    costo_unitario: 0,
    stock_actual: 0,
    stock_minimo: 5,
    imagen_url: '',
    id_subcategoria: null,
    detalles: [] // Array of { id_filtro, id_opcion_filtro }
});

// Rules
const requiredRule = v => !!v || 'Campo requerido';
const numberRule = v => (v !== null && v !== '' && !isNaN(v) && v >= 0) || 'Debe ser un número válido';

// Fetch Categories List (for dropdown)
const { data: categoriesData } = useQuery({
    queryKey: ['categorias-list'],
    queryFn: () => getCategorias({ limit: 100 }) // Fetch enough
});
const categories = computed(() => categoriesData.value?.data || []);

// Fetch selected category details (to get subcategories -> filters)
watch(selectedCategoryId, async (newId) => {
    form.id_subcategoria = null;
    form.detalles = [];
    categoryDetails.value = null;

    if (newId) {
        isLoadingCategory.value = true;
        try {
            const response = await getCategoriaById(newId);
            categoryDetails.value = response.data;
        } catch (error) {
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

const getFilterOptions = (filtroId) => {
    if (!filtroId) return [];
    const filtro = availableFilters.value.find(f => f.id === filtroId);
    return filtro?.opciones || [];
};

const addDetalle = () => {
    form.detalles.push({ id_filtro: null, id_opcion_filtro: null });
};

const removeDetalle = (index) => {
    form.detalles.splice(index, 1);
};


const fileInput = ref(null);
const imageLoading = ref(false);
const previewImage = ref(null);

const triggerFileInput = () => {
    fileInput.value.click();
};

const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: async (response) => {
        if (response.success && response.data?.url) {
            form.imagen_url = response.data.url;
            // Load preview
            try {
                previewImage.value = await getImage(response.data.url);
                showSuccessToast('Imagen subida correctamente');
            } catch (e) {
                console.error('Error loading preview', e);
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

const handleFileUpload = (event) => {
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
    // The server expects 'image' field as per storage.routes.js: upload.single('image')
    uploadMutation.mutate({ image: file }); 
};

// Mutation
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

const handleSubmit = async () => {
    const { valid } = await formRef.value.validate();
    if (!valid) return;

    isSubmitting.value = true;

    // Transform detalles array to payload format
    const detallesArray = form.detalles
        .filter(d => d.id_opcion_filtro) // Ensure option is selected
        .map(d => ({
            id_opcion_filtro: d.id_opcion_filtro
        }));

    const payload = {
        ...form,
        detalles: detallesArray
    };

    mutate(payload);
};
</script>

<template>
    <div class="h-100 d-flex flex-column bg-grey-lighten-5">
        <!-- Header -->
        <div class="d-flex align-center pa-4 bg-white border-b">
            <v-btn icon variant="text" to="/main/productos" class="mr-2">
                <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <div>
                <h1 class="text-h6 font-weight-bold">Nuevo Producto</h1>
                <div class="text-caption text-medium-emphasis">
                    Registra un nuevo producto en el catálogo
                </div>
            </div>
            <v-spacer></v-spacer>
            <v-btn
                color="primary"
                @click="handleSubmit"
                :loading="isSubmitting"
                prepend-icon="mdi-content-save"
            >
                Guardar Producto
            </v-btn>
        </div>

        <div class="pa-4 flex-grow-1 overflow-y-auto">
            <v-form ref="formRef" @submit.prevent="handleSubmit">
                <v-row>
                    <!-- Basic Info Column -->
                    <v-col cols="12" md="8">
                        <v-card title="Información Básica" class="mb-4">
                            <v-card-text>
                                <v-text-field
                                    v-model="form.nombre_producto"
                                    label="Nombre del Producto"
                                    :rules="[requiredRule]"
                                    variant="outlined"
                                    density="comfortable"
                                    class="mb-2"
                                ></v-text-field>

                                <v-textarea
                                    v-model="form.descripcion_producto"
                                    label="Descripción"
                                    variant="outlined"
                                    density="comfortable"
                                    rows="3"
                                    class="mb-2"
                                ></v-textarea>

                                <v-row>
                                    <v-col cols="12" md="4">
                                        <v-text-field
                                            v-model.number="form.costo_unitario"
                                            label="Costo Unitario"
                                            prefix="$"
                                            type="number"
                                            :rules="[numberRule]"
                                            variant="outlined"
                                            density="comfortable"
                                        ></v-text-field>
                                    </v-col>
                                    <v-col cols="12" md="4">
                                        <v-text-field
                                            v-model.number="form.precio_unitario"
                                            label="Precio Unitario"
                                            prefix="$"
                                            type="number"
                                            :rules="[requiredRule, numberRule]"
                                            variant="outlined"
                                            density="comfortable"
                                        ></v-text-field>
                                    </v-col>
                                    <v-col cols="12" md="4">
                                        <v-text-field
                                            v-model.number="form.stock_actual"
                                            label="Stock Inicial"
                                            type="number"
                                            :rules="[requiredRule, numberRule]"
                                            variant="outlined"
                                            density="comfortable"
                                        ></v-text-field>
                                    </v-col>
                                    <v-col cols="12" md="4">
                                        <v-text-field
                                            v-model.number="form.stock_minimo"
                                            label="Stock Mínimo"
                                            type="number"
                                            :rules="[requiredRule, numberRule]"
                                            variant="outlined"
                                            density="comfortable"
                                        ></v-text-field>
                                    </v-col>
                                </v-row>

                                <!-- Image Upload Section -->
                                <v-card-text class="d-flex flex-column align-center">
                                    <div class="position-relative mb-4">
                                        <v-avatar
                                            size="120"
                                            color="surface-variant"
                                            class="border cursor-pointer elevation-2"
                                            @click="triggerFileInput"
                                        >
                                            <v-img
                                                v-if="previewImage"
                                                :src="previewImage"
                                                alt="Producto"
                                                cover
                                            >
                                                <template v-slot:placeholder>
                                                    <div class="d-flex align-center justify-center fill-height">
                                                        <v-progress-circular indeterminate color="primary"></v-progress-circular>
                                                    </div>
                                                </template>
                                            </v-img>
                                            <span v-else class="text-h3 font-weight-bold text-uppercase">
                                                {{ form.nombre_producto?.charAt(0) || 'P' }}
                                            </span>
                                            
                                            <v-overlay
                                                activator="parent"
                                                location-strategy="connected"
                                                scroll-strategy="block"
                                                contained
                                                class="align-center justify-center"
                                                scrim="#000"
                                                theme="dark"
                                            >
                                                <v-icon icon="mdi-camera" size="large"></v-icon>
                                            </v-overlay>
                                        </v-avatar>
                                        <v-btn
                                            icon="mdi-pencil"
                                            size="small"
                                            color="primary"
                                            class="position-absolute"
                                            style="bottom: 0; right: 0; z-index: 2;"
                                            @click="triggerFileInput"
                                        ></v-btn>
                                    </div>
                                    <div class="text-caption text-medium-emphasis mb-2">
                                        {{ imageLoading ? 'Subiendo imagen...' : 'Click para subir imagen' }}
                                    </div>
                                    
                                    <input
                                        type="file"
                                        ref="fileInput"
                                        class="d-none"
                                        accept="image/*"
                                        @change="handleFileUpload"
                                    />
                                </v-card-text>
                            </v-card-text>
                        </v-card>
                    </v-col>

                    <!-- Categorization Column -->
                    <v-col cols="12" md="4">
                        <v-card title="Categorización" class="mb-4">
                            <v-card-text>
                                <v-autocomplete
                                    v-model="selectedCategoryId"
                                    :items="categories"
                                    item-title="nombre_categoria"
                                    item-value="id"
                                    label="Categoría"
                                    variant="outlined"
                                    density="comfortable"
                                    :rules="[requiredRule]"
                                ></v-autocomplete>

                                <div v-if="isLoadingCategory" class="d-flex justify-center py-4">
                                    <v-progress-circular indeterminate size="24" color="primary"></v-progress-circular>
                                </div>

                                <v-autocomplete
                                    v-if="selectedCategoryId && !isLoadingCategory"
                                    v-model="form.id_subcategoria"
                                    :items="subcategories"
                                    item-title="nombre_subcategoria"
                                    item-value="id"
                                    label="Subcategoría"
                                    variant="outlined"
                                    density="comfortable"
                                    :rules="[requiredRule]"
                                    no-data-text="No hay subcategorías disponibles"
                                ></v-autocomplete>
                            </v-card-text>
                        </v-card>

                        <!-- Attributes / Filters -->
                        <v-card v-if="form.id_subcategoria" title="Especificaciones" class="mb-4">
                            <v-card-text>
                                <div v-if="availableFilters.length === 0" class="text-caption text-medium-emphasis text-center">
                                    No hay filtros configurados para esta subcategoría.
                                </div>

                                <div v-else>
                                    <div v-for="(detalle, index) in form.detalles" :key="index" class="d-flex align-center mb-3">
                                        <v-row dense class="flex-grow-1">
                                            <v-col cols="12" md="6">
                                                <v-select
                                                    v-model="detalle.id_filtro"
                                                    :items="availableFilters"
                                                    item-title="nombre_filtro"
                                                    item-value="id"
                                                    label="Filtro"
                                                    variant="outlined"
                                                    density="compact"
                                                    hide-details="auto"
                                                    :rules="[requiredRule]"
                                                ></v-select>
                                            </v-col>
                                            <v-col cols="12" md="6">
                                                <v-select
                                                    v-if="getFilterOptions(detalle.id_filtro)"
                                                    v-model="detalle.id_opcion_filtro"
                                                    :items="getFilterOptions(detalle.id_filtro)"
                                                    item-title="valor_opcion"
                                                    item-value="id"
                                                    label="Opción"
                                                    variant="outlined"
                                                    density="compact"
                                                    hide-details="auto"
                                                    :rules="[requiredRule]"
                                                ></v-select>
                                                <div v-else-if="detalle.id_filtro" class="text-caption text-medium-emphasis mt-2">
                                                    Sin opciones o tipo de dato no soportado.
                                                </div>
                                            </v-col>
                                        </v-row>
                                        <v-btn icon size="small" color="error" variant="text" class="ml-2" @click="removeDetalle(index)">
                                            <v-icon>mdi-delete</v-icon>
                                        </v-btn>
                                    </div>

                                    <v-btn
                                        variant="tonal"
                                        color="primary"
                                        prepend-icon="mdi-plus"
                                        size="small"
                                        class="mt-2"
                                        @click="addDetalle"
                                        :disabled="form.detalles.length >= availableFilters.length"
                                    >
                                        Agregar Especificación
                                    </v-btn>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-form>
        </div>
    </div>
</template>
