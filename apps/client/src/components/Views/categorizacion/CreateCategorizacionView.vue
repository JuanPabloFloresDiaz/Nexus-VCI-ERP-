<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { createCategoria } from '@/services/categorizacion.service';
import { showSuccessToast, showErrorToast } from '@/plugins/sweetalert2';

const router = useRouter();
const queryClient = useQueryClient();

const form = reactive({
    nombre_categoria: '',
    descripcion_categoria: '',
    subcategorias: []
});

const isSubmitting = ref(false);

const addSubcategoria = () => {
    form.subcategorias.push({
        nombre_subcategoria: '',
        descripcion_subcategoria: '',
        filtros: []
    });
};

const removeSubcategoria = (index) => {
    form.subcategorias.splice(index, 1);
};

const addFiltro = (subIndex) => {
    form.subcategorias[subIndex].filtros.push({
        nombre_filtro: '',
        tipo_dato: 'Texto',
        opciones: []
    });
};

const removeFiltro = (subIndex, filtroIndex) => {
    form.subcategorias[subIndex].filtros.splice(filtroIndex, 1);
};

const addOpcion = (subIndex, filtroIndex) => {
    form.subcategorias[subIndex].filtros[filtroIndex].opciones.push({
        valor_opcion: ''
    });
};

const removeOpcion = (subIndex, filtroIndex, opcionIndex) => {
    form.subcategorias[subIndex].filtros[filtroIndex].opciones.splice(opcionIndex, 1);
};

const { mutate } = useMutation({
    mutationFn: createCategoria, // Use standard create
    onSuccess: () => {
        showSuccessToast('Categoría creada exitosamente con su estructura');
        queryClient.invalidateQueries({ queryKey: ['categorias'] });
        router.push('/main/categorizacion');
    },
    onError: (error) => {
        showErrorToast(error.message || 'Error al crear categoría');
        isSubmitting.value = false;
    }
});

const handleSubmit = async () => {
    const { valid } = await formRef.value.validate();
    if (!valid) return;

    isSubmitting.value = true;
    
    // Send form directly object
    mutate(form);
};

const formRef = ref(null);

const requiredRule = v => !!v || 'Campo requerido';

const filterTypes = [
    { title: 'Texto Libre', value: 'Texto' },
    { title: 'Numérico', value: 'Numérico' },
    { title: 'Lista de Opciones (Selección)', value: 'Lista' }
];
</script>

<template>
    <div class="h-100 d-flex flex-column bg-grey-lighten-5">
        <!-- Header -->
        <div class="d-flex align-center pa-4 bg-white border-b">
            <v-btn icon variant="text" to="/main/categorizacion" class="mr-2">
                <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <div>
                <h1 class="text-h6 font-weight-bold">Nueva Categoría</h1>
                <div class="text-caption text-medium-emphasis">
                    Define la estructura completa: Categoría > Subcategorías > Filtros
                </div>
            </div>
            <v-spacer></v-spacer>
            <v-btn
                color="primary"
                @click="handleSubmit"
                :loading="isSubmitting"
                prepend-icon="mdi-content-save"
            >
                Guardar Estructura
            </v-btn>
        </div>

        <div class="pa-4 flex-grow-1 overflow-y-auto">
            <v-form ref="formRef" @submit.prevent="handleSubmit">
                <v-row>
                    <!-- Category Details -->
                    <v-col cols="12">
                        <v-card title="Detalles de la Categoría" class="mb-4">
                            <v-card-text>
                                <v-row>
                                    <v-col cols="12" md="6">
                                        <v-text-field
                                            v-model="form.nombre_categoria"
                                            label="Nombre de la Categoría"
                                            :rules="[requiredRule]"
                                            variant="outlined"
                                            density="comfortable"
                                        ></v-text-field>
                                    </v-col>
                                    <v-col cols="12" md="6">
                                        <v-text-field
                                            v-model="form.descripcion_categoria"
                                            label="Descripción (Opcional)"
                                            variant="outlined"
                                            density="comfortable"
                                        ></v-text-field>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-card>
                    </v-col>

                    <!-- Subcategories -->
                    <v-col cols="12">
                        <div class="d-flex align-center mb-2">
                            <h2 class="text-h6">Subcategorías</h2>
                            <v-spacer></v-spacer>
                            <v-btn
                                size="small"
                                color="secondary"
                                variant="tonal"
                                prepend-icon="mdi-plus"
                                @click="addSubcategoria"
                            >
                                Agregar Subcategoría
                            </v-btn>
                        </div>

                        <v-fade-transition group>
                            <div
                                v-for="(sub, subIndex) in form.subcategorias"
                                :key="subIndex"
                                class="mb-4"
                            >
                                <v-card variant="outlined" class="border-primary">
                                    <v-toolbar density="compact" color="grey-lighten-4">
                                        <v-toolbar-title class="text-subtitle-2 font-weight-bold">
                                            Subcategoría #{{ subIndex + 1 }}
                                        </v-toolbar-title>
                                        <v-spacer></v-spacer>
                                        <v-btn icon size="small" color="error" variant="text" @click="removeSubcategoria(subIndex)">
                                            <v-icon>mdi-delete</v-icon>
                                        </v-btn>
                                    </v-toolbar>

                                    <v-card-text class="pt-4">
                                        <v-row>
                                            <v-col cols="12" md="6">
                                                <v-text-field
                                                    v-model="sub.nombre_subcategoria"
                                                    label="Nombre Subcategoría"
                                                    :rules="[requiredRule]"
                                                    variant="outlined"
                                                    density="compact"
                                                ></v-text-field>
                                            </v-col>
                                            
                                            <!-- Fitlers Section nested inside Subcategory -->
                                            <v-col cols="12">
                                                <v-expansion-panels variant="accordion">
                                                    <v-expansion-panel>
                                                        <v-expansion-panel-title>
                                                            Filtros ({{ sub.filtros.length }})
                                                        </v-expansion-panel-title>
                                                        <v-expansion-panel-text>
                                                            <div class="d-flex justify-end mb-2">
                                                                <v-btn size="x-small" color="info" variant="text" prepend-icon="mdi-plus" @click="addFiltro(subIndex)">
                                                                    Agregar Filtro
                                                                </v-btn>
                                                            </div>
                                                            
                                                            <v-card 
                                                                v-for="(filtro, fIndex) in sub.filtros" 
                                                                :key="fIndex"
                                                                class="mb-3 bg-grey-lighten-5"
                                                                variant="flat"
                                                            >
                                                                <v-card-text>
                                                                    <v-row dense>
                                                                        <v-col cols="12" md="5">
                                                                            <v-text-field
                                                                                v-model="filtro.nombre_filtro"
                                                                                label="Nombre Filtro"
                                                                                :rules="[requiredRule]"
                                                                                variant="outlined"
                                                                                density="compact"
                                                                                hide-details="auto"
                                                                            ></v-text-field>
                                                                        </v-col>
                                                                        <v-col cols="12" md="4">
                                                                            <v-select
                                                                                v-model="filtro.tipo_dato"
                                                                                :items="filterTypes"
                                                                                item-title="title"
                                                                                item-value="value"
                                                                                label="Tipo de Dato"
                                                                                variant="outlined"
                                                                                density="compact"
                                                                                hide-details="auto"
                                                                            ></v-select>
                                                                        </v-col>
                                                                        <v-col cols="12" md="3" class="d-flex align-center">
                                                                            <v-btn icon size="x-small" color="error" variant="text" @click="removeFiltro(subIndex, fIndex)">
                                                                                <v-icon>mdi-close</v-icon>
                                                                            </v-btn>
                                                                        </v-col>

                                                                        <!-- Options for List type -->
                                                                        <v-col cols="12" v-if="filtro.tipo_dato === 'Texto' || filtro.tipo_dato === 'Numérico'">
                                                                             <div class="text-caption text-medium-emphasis pl-4 mt-1">
                                                                                <v-icon size="x-small" class="mr-1">mdi-information-outline</v-icon>
                                                                                Selecciona "Lista de Opciones" si deseas definir valores predeterminados.
                                                                            </div>
                                                                        </v-col>

                                                                        <v-col cols="12" v-if="filtro.tipo_dato === 'Lista'">
                                                                            <div class="pl-4 border-s-md mt-2">
                                                                                <div class="text-caption mb-1">Opciones de Lista</div>
                                                                                <div v-for="(opcion, oIndex) in filtro.opciones" :key="oIndex" class="d-flex align-center mb-1 gap-2">
                                                                                    <v-text-field
                                                                                        v-model="opcion.valor_opcion"
                                                                                        placeholder="Valor opción"
                                                                                        density="compact"
                                                                                        variant="underlined"
                                                                                        hide-details
                                                                                    ></v-text-field>
                                                                                    <v-btn icon size="x-small" variant="text" color="grey" @click="removeOpcion(subIndex, fIndex, oIndex)">
                                                                                        <v-icon>mdi-close</v-icon>
                                                                                    </v-btn>
                                                                                </div>
                                                                                <v-btn size="x-small" variant="text" color="primary" prepend-icon="mdi-plus" @click="addOpcion(subIndex, fIndex)">
                                                                                    Agregar Opción
                                                                                </v-btn>
                                                                            </div>
                                                                        </v-col>
                                                                    </v-row>
                                                                </v-card-text>
                                                            </v-card>
                                                        </v-expansion-panel-text>
                                                    </v-expansion-panel>
                                                </v-expansion-panels>
                                            </v-col>
                                        </v-row>
                                    </v-card-text>
                                </v-card>
                            </div>
                        </v-fade-transition>
                        
                        <div v-if="form.subcategorias.length === 0" class="text-center pa-8 border dashed rounded text-medium-emphasis">
                            No hay subcategorías agregadas
                        </div>
                    </v-col>
                </v-row>
            </v-form>
        </div>
    </div>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.border-primary { border-color: rgba(var(--v-theme-primary), 0.5) !important; }
</style>
