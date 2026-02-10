<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMutation, useQuery } from '@tanstack/vue-query';
import { getProductoById, updateProducto } from '@/services/productos.service';
import { getCategorias, getCategoriaById } from '@/services/categorizacion.service';
import { showSuccessToast, showErrorToast } from '@/plugins/sweetalert2';

import { uploadFile } from '@/services/storage.service';
import { getImage } from '@/utils/getImage';

const route = useRoute();
const router = useRouter();
const productId = route.params.id;
const formRef = ref(null);
const isSubmitting = ref(false);
const isLoadingProduct = ref(true);

// Local State
const selectedCategoryId = ref(null);
const categoryDetails = ref(null);
const isLoadingCategory = ref(false);

const form = reactive({
    nombre_producto: '',
    descripcion_producto: '',
    precio_unitario: null,
    costo_unitario: 0,
    stock_actual: 0,
    stock_minimo: 5,
    imagen_url: '',
    id_subcategoria: null,
    detalles: [] 
});

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
    } catch (error) {
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

// Load Product Data
const loadProduct = async () => {
    try {
        const response = await getProductoById(productId);
        const prod = response.data;
        
        form.nombre_producto = prod.nombre_producto;
        form.descripcion_producto = prod.descripcion_producto;
        form.precio_unitario = parseFloat(prod.precio_unitario);
        form.costo_unitario = parseFloat(prod.costo_unitario || 0);
        form.stock_actual = prod.stock_actual;
        form.stock_minimo = prod.stock_minimo;
        form.imagen_url = prod.imagen_url;
        form.id_subcategoria = prod.id_subcategoria;

        // Set Category ID to trigger load
        if (prod.subcategoria && prod.subcategoria.id_categoria) {
            selectedCategoryId.value = prod.subcategoria.id_categoria;
        }

        // Load preview if exists
        if (form.imagen_url) {
            try {
                previewImage.value = await getImage(form.imagen_url);
            } catch (e) {
                console.error('Error loading existing image', e);
            }
        }

        // Map existing attributes to form.detalles
        form.detalles = [];
        if (prod.detalles_filtros) {
            prod.detalles_filtros.forEach(det => {
                if (det.opcion_filtro && det.opcion_filtro.id_filtro) {
                    form.detalles.push({
                        id_filtro: det.opcion_filtro.id_filtro,
                        id_opcion_filtro: det.id_opcion_filtro
                    });
                }
            });
        }

    } catch (error) {
        showErrorToast('Error al cargar producto');
        router.push('/main/productos');
    } finally {
        isLoadingProduct.value = false;
    }
};

// Mutation
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

const handleSubmit = async () => {
    const { valid } = await formRef.value.validate();
    if (!valid) return;

    isSubmitting.value = true;

    const detallesArray = form.detalles
        .filter(d => d.id_opcion_filtro)
        .map(d => ({
            id_opcion_filtro: d.id_opcion_filtro
        }));

    const payload = {
        ...form,
        detalles: detallesArray
    };

    mutate(payload);
};


// Image State
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
            const newUrl = response.data.url;
            form.imagen_url = newUrl;
            
            // Auto-save product with new image without redirect
            try {
                await updateProducto(productId, { imagen_url: newUrl });
                showSuccessToast('Imagen actualizada y guardada');
            } catch (error) {
                console.error(error);
                showErrorToast('Imagen subida pero no se pudo asociar al producto automáticamente');
            }

            try {
                previewImage.value = await getImage(newUrl);
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
    uploadMutation.mutate({ image: file });
};



onMounted(() => {
    if (productId) {
        loadProduct();
    }
});
</script>

<template>
    <div class="h-100 d-flex flex-column bg-grey-lighten-5">
        <!-- Header -->
        <div class="d-flex align-center pa-4 bg-white border-b">
            <v-btn icon variant="text" to="/main/productos" class="mr-2">
                <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <div>
                <h1 class="text-h6 font-weight-bold">Editar Producto</h1>
                <div class="text-caption text-medium-emphasis">
                    Actualiza la información del producto
                </div>
            </div>
            <v-spacer></v-spacer>
            <v-btn
                color="primary"
                @click="handleSubmit"
                :loading="isSubmitting"
                prepend-icon="mdi-content-save"
            >
                Guardar Cambios
            </v-btn>
        </div>

        <div class="pa-4 flex-grow-1 overflow-y-auto">
             <div v-if="isLoadingProduct" class="d-flex justify-center py-8">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>

            <v-form v-else ref="formRef" @submit.prevent="handleSubmit">
                <v-row>
                    <!-- Basic Info -->
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
                                            label="Stock Actual"
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
                                        {{ imageLoading ? 'Subiendo imagen...' : 'Click para cambiar imagen' }}
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

                    <!-- Categorization -->
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
                                ></v-autocomplete>
                            </v-card-text>
                        </v-card>

                        <!-- Attributes -->
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
