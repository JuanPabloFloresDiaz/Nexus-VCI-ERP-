<script setup>
import { ref } from 'vue';

const dialog = ref(false);
const subcategory = ref(null);

const open = (item) => {
    subcategory.value = item;
    dialog.value = true;
};

defineExpose({ open });
</script>

<template>
    <v-dialog v-model="dialog" max-width="600">
        <v-card v-if="subcategory">
            <v-toolbar color="primary" density="compact">
                <v-toolbar-title class="text-subtitle-1">
                    Filtros de {{ subcategory.nombre_subcategoria }}
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="dialog = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar>
            
            <v-card-text class="pa-0">
                <v-list lines="two">
                    <template v-if="subcategory.filtros && subcategory.filtros.length > 0">
                        <v-list-item
                            v-for="filtro in subcategory.filtros"
                            :key="filtro.id"
                        >
                            <template v-slot:prepend>
                                <v-avatar color="grey-lighten-4" icon="mdi-filter-variant"></v-avatar>
                            </template>
                            
                            <v-list-item-title class="font-weight-medium">
                                {{ filtro.nombre_filtro }}
                            </v-list-item-title>
                            <v-list-item-subtitle>
                                Tipo: <v-chip size="x-small" label>{{ filtro.tipo_dato }}</v-chip>
                            </v-list-item-subtitle>
                            
                            <div v-if="filtro.opciones && filtro.opciones.length > 0" class="mt-2">
                                <div class="text-caption text-medium-emphasis mb-1">Opciones:</div>
                                <div class="d-flex flex-wrap gap-1">
                                    <v-chip 
                                        v-for="opcion in filtro.opciones" 
                                        :key="opcion.id"
                                        size="x-small"
                                        variant="outlined"
                                    >
                                        {{ opcion.valor_opcion }}
                                    </v-chip>
                                </div>
                            </div>
                        </v-list-item>
                    </template>
                    <v-list-item v-else>
                         <div class="text-center py-4 text-medium-emphasis">
                            No hay filtros definidos
                        </div>
                    </v-list-item>
                </v-list>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.gap-1 { gap: 4px; }
</style>
