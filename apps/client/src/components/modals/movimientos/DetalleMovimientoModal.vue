<template>
  <v-dialog v-model="dialog" max-width="700px">
    <v-card>
      <v-toolbar color="primary" dark density="compact">
        <v-toolbar-title>Detalle de Movimiento</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon dark @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-4" v-if="movimiento">
        <v-row>
           <!-- Header Info -->
           <v-col cols="12">
               <div class="d-flex align-center justify-space-between">
                   <h3 class="text-h6 text-primary">ID: {{ movimiento.id.slice(0, 8) }}...</h3>
                   <v-chip :color="getTypeColor(movimiento.tipo_movimiento)" class="font-weight-bold">
                       {{ movimiento.tipo_movimiento }}
                   </v-chip>
               </div>
           </v-col>

           <v-col cols="12"><v-divider></v-divider></v-col>

           <!-- Product Info -->
           <v-col cols="12" md="6">
               <div class="text-caption text-medium-emphasis">Producto</div>
               <div class="text-body-1 font-weight-medium">{{ movimiento.variante?.producto?.nombre_producto || 'N/A' }}</div>
           </v-col>
           <v-col cols="12" md="6">
               <div class="text-caption text-medium-emphasis">SKU / Variante</div>
               <div class="text-body-1">{{ movimiento.variante?.sku || 'N/A' }}</div>
           </v-col>

           <!-- Warehouse Info -->
           <v-col cols="12" md="6">
               <div class="text-caption text-medium-emphasis">Almacén</div>
               <div class="text-body-1">{{ movimiento.almacen?.nombre_almacen || 'N/A' }}</div>
           </v-col>

           <!-- Transaction Info -->
           <v-col cols="6" md="3">
               <div class="text-caption text-medium-emphasis">Cantidad</div>
               <div class="text-h6 font-weight-bold" :class="movimiento.cantidad < 0 ? 'text-error' : 'text-success'">
                   {{ movimiento.cantidad }}
               </div>
           </v-col>
           <v-col cols="6" md="3">
               <div class="text-caption text-medium-emphasis">Costo Unitario</div>
               <div class="text-body-1">{{ formatCurrency(movimiento.costo_unitario) }}</div>
           </v-col>
           
           <!-- Date & Reference -->
           <v-col cols="12" md="6">
               <div class="text-caption text-medium-emphasis">Fecha de Movimiento</div>
               <div class="text-body-1">{{ formatDate(movimiento.fecha_movimiento) }}</div>
           </v-col>
           <v-col cols="12" md="6">
               <div class="text-caption text-medium-emphasis">Referencia</div>
               <div class="text-body-1">{{ movimiento.id_referencia || 'Sin referencia' }}</div>
           </v-col>

           <!-- Notes -->
           <v-col cols="12" v-if="movimiento.notas">
               <v-alert density="compact" variant="tonal" color="info" icon="mdi-note-text">
                   <div class="text-caption font-weight-bold">Notas:</div>
                   {{ movimiento.notas }}
               </v-alert>
           </v-col>

        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';
import dayjs from 'dayjs';

const props = defineProps({
  modelValue: Boolean,
  movimiento: Object
});

const emit = defineEmits(['update:modelValue']);

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

function getTypeColor(type) {
    switch (type) {
        case 'Compra': return 'success';
        case 'Venta': return 'info';
        case 'Ajuste': return 'warning';
        case 'Transferencia': return 'purple';
        default: return 'default';
    }
}

function formatDate(date) {
    if (!date) return '-';
    return dayjs(date).format('DD/MM/YYYY HH:mm:ss');
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}
</script>
