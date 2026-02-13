<script setup>
  import { useMutation, useQueryClient } from '@tanstack/vue-query';
  import Swal from 'sweetalert2';
  import { onMounted, reactive, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { showErrorToast, showSuccessToast } from '@/plugins/sweetalert2';
  import { getCategoriaById, updateCategoria } from '@/services/categorizacion.service';

  const route = useRoute();
  const router = useRouter();
  const queryClient = useQueryClient();
  const categoryId = route.params.id;

  const form = reactive({
    nombre_categoria: '',
    descripcion_categoria: '',
    subcategorias: []
  });

  const isLoadingData = ref(true);
  const isSubmitting = ref(false);
  const formRef = ref(null);

  const requiredRule = v => !!v || 'Campo requerido';

  const filterTypes = [
    { title: 'Texto Libre', value: 'Texto' },
    { title: 'Numérico', value: 'Numérico' },
    { title: 'Lista de Opciones (Selección)', value: 'Lista' }
  ];

  // Helper functions for dynamic structure (Same as Create View)
  function addSubcategoria () {
    form.subcategorias.push({
      nombre_subcategoria: '',
      descripcion_subcategoria: '', // Kept in form structure although not in DB, can remain for UI consistency or removed if strictly guided by DB model. Removed from template previously, will keep out of template.
      filtros: []
    });
  }

  function removeSubcategoria (index) {
    // If it has an ID, it will be deleted on save (Backend sync)
    // We can add a visual indicator or just remove from array.
    // Sync logic in backend handles "missing IDs = delete".
    form.subcategorias.splice(index, 1);
  }

  function addFiltro (subIndex) {
    form.subcategorias[subIndex].filtros = form.subcategorias[subIndex].filtros || [];
    form.subcategorias[subIndex].filtros.push({
      nombre_filtro: '',
      tipo_dato: 'Texto',
      opciones: []
    });
  }

  function removeFiltro (subIndex, filtroIndex) {
    form.subcategorias[subIndex].filtros.splice(filtroIndex, 1);
  }

  function addOpcion (subIndex, filtroIndex) {
    form.subcategorias[subIndex].filtros[filtroIndex].opciones = form.subcategorias[subIndex].filtros[filtroIndex].opciones || [];
    form.subcategorias[subIndex].filtros[filtroIndex].opciones.push({
      valor_opcion: ''
    });
  }

  function removeOpcion (subIndex, filtroIndex, opcionIndex) {
    form.subcategorias[subIndex].filtros[filtroIndex].opciones.splice(opcionIndex, 1);
  }

  async function fetchCategory () {
    try {
      const response = await getCategoriaById(categoryId);
      const data = response.data;
      form.nombre_categoria = data.nombre_categoria;
      form.descripcion_categoria = data.descripcion_categoria;
        
      // Map subcategories to ensure structure
      form.subcategorias = (data.subcategorias || []).map(sub => ({
        id: sub.id,
        nombre_subcategoria: sub.nombre_subcategoria,
        filtros: (sub.filtros || []).map(filtro => ({
          id: filtro.id,
          nombre_filtro: filtro.nombre_filtro,
          tipo_dato: filtro.tipo_dato,
          opciones: (filtro.opciones || []).map(op => ({
            id: op.id,
            valor_opcion: op.valor_opcion
          }))
        }))
      }));
    } catch {
      showErrorToast('Error al cargar categoría');
      router.push('/main/categorizacion');
    } finally {
      isLoadingData.value = false;
    }
  }

  const { mutate } = useMutation({
    mutationFn: (data) => updateCategoria(categoryId, data),
    onSuccess: () => {
      showSuccessToast('Categoría actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      router.push('/main/categorizacion');
    },
    onError: (error) => {
      showErrorToast(error.message || 'Error al actualizar categoría');
      isSubmitting.value = false;
    }
  });

  async function handleSubmit () {
    const { valid } = await formRef.value.validate();
    if (!valid) return;

    isSubmitting.value = true;
    mutate(form);
  }

  onMounted(() => {
    if (categoryId) {
      fetchCategory();
    }
  });
</script>

<template>
  <div class="h-100 d-flex flex-column bg-grey-lighten-5">
    <!-- Header -->
    <div class="d-flex align-center pa-4 bg-white border-b">
      <v-btn class="mr-2" icon to="/main/categorizacion" variant="text">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div>
        <h1 class="text-h6 font-weight-bold">Editar Categoría</h1>
        <div class="text-caption text-medium-emphasis">
          Actualiza la estructura: Categoría > Subcategorías > Filtros
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
      <div v-if="isLoadingData" class="d-flex justify-center py-8">
        <v-progress-circular color="primary" indeterminate />
      </div>

      <v-form v-else ref="formRef" @submit.prevent="handleSubmit">
        <v-row>
          <!-- Category Details -->
          <v-col cols="12">
            <v-card class="mb-4" title="Detalles de la Categoría">
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="form.nombre_categoria"
                      density="comfortable"
                      label="Nombre de la Categoría"
                      :rules="[requiredRule]"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="form.descripcion_categoria"
                      density="comfortable"
                      label="Descripción (Opcional)"
                      variant="outlined"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Subcategories -->
          <v-col cols="12">
            <div class="d-flex align-center mb-2">
              <h2 class="text-h6">Subcategorías</h2>
              <v-spacer />
              <v-btn
                color="secondary"
                prepend-icon="mdi-plus"
                size="small"
                variant="tonal"
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
                <v-card class="border-primary" variant="outlined">
                  <v-toolbar color="grey-lighten-4" density="compact">
                    <v-toolbar-title class="text-subtitle-2 font-weight-bold">
                      Subcategoría #{{ subIndex + 1 }} <span v-if="sub.id" class="text-caption text-medium-emphasis">(ID: ...{{ sub.id.slice(-4) }})</span>
                    </v-toolbar-title>
                    <v-spacer />
                    <v-btn
                      color="error"
                      icon
                      size="small"
                      variant="text"
                      @click="removeSubcategoria(subIndex)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </v-toolbar>

                  <v-card-text class="pt-4">
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="sub.nombre_subcategoria"
                          density="compact"
                          label="Nombre Subcategoría"
                          :rules="[requiredRule]"
                          variant="outlined"
                        />
                      </v-col>
                                            
                      <!-- Fitlers Section nested inside Subcategory -->
                      <v-col cols="12">
                        <v-expansion-panels variant="accordion">
                          <v-expansion-panel>
                            <v-expansion-panel-title>
                              Filtros ({{ sub.filtros?.length || 0 }})
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                              <div class="d-flex justify-end mb-2">
                                <v-btn
                                  color="info"
                                  prepend-icon="mdi-plus"
                                  size="x-small"
                                  variant="text"
                                  @click="addFiltro(subIndex)"
                                >
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
                                        density="compact"
                                        hide-details="auto"
                                        label="Nombre Filtro"
                                        :rules="[requiredRule]"
                                        variant="outlined"
                                      />
                                    </v-col>
                                    <v-col cols="12" md="4">
                                      <v-select
                                        v-model="filtro.tipo_dato"
                                        density="compact"
                                        hide-details="auto"
                                        item-title="title"
                                        item-value="value"
                                        :items="filterTypes"
                                        label="Tipo de Dato"
                                        variant="outlined"
                                      />
                                    </v-col>
                                    <v-col class="d-flex align-center" cols="12" md="3">
                                      <v-btn
                                        color="error"
                                        icon
                                        size="x-small"
                                        variant="text"
                                        @click="removeFiltro(subIndex, fIndex)"
                                      >
                                        <v-icon>mdi-close</v-icon>
                                      </v-btn>
                                    </v-col>

                                    <!-- Options for List type -->
                                    <v-col v-if="filtro.tipo_dato === 'Texto' || filtro.tipo_dato === 'Numérico'" cols="12">
                                      <div class="text-caption text-medium-emphasis pl-4 mt-1">
                                        <v-icon class="mr-1" size="x-small">mdi-information-outline</v-icon>
                                        Selecciona "Lista de Opciones" si deseas definir valores predeterminados.
                                      </div>
                                    </v-col>

                                    <v-col v-if="filtro.tipo_dato === 'Lista'" cols="12">
                                      <div class="pl-4 border-s-md mt-2">
                                        <div class="text-caption mb-1">Opciones de Lista</div>
                                        <div v-for="(opcion, oIndex) in filtro.opciones" :key="oIndex" class="d-flex align-center mb-1 gap-2">
                                          <v-text-field
                                            v-model="opcion.valor_opcion"
                                            density="compact"
                                            hide-details
                                            placeholder="Valor opción"
                                            variant="underlined"
                                          />
                                          <v-btn
                                            color="grey"
                                            icon
                                            size="x-small"
                                            variant="text"
                                            @click="removeOpcion(subIndex, fIndex, oIndex)"
                                          >
                                            <v-icon>mdi-close</v-icon>
                                          </v-btn>
                                        </div>
                                        <v-btn
                                          color="primary"
                                          prepend-icon="mdi-plus"
                                          size="x-small"
                                          variant="text"
                                          @click="addOpcion(subIndex, fIndex)"
                                        >
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
