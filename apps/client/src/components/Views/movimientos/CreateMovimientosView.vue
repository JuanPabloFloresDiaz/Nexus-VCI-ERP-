<template>
  <v-container>
    <div class="d-flex align-center mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" to="/main/movimientos" class="mr-2" />
      <h1 class="text-h4 font-weight-bold text-secondary">Registrar Movimiento</h1>
    </div>

    <v-card>
      <v-tabs v-model="tab" bg-color="primary">
        <v-tab value="ajuste">Ajuste Manual</v-tab>
        <v-tab value="transferencia">Transferencia entre Almacenes</v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="tab">
          <!-- ADJUSTMENT TAB -->
          <v-window-item value="ajuste">
             <v-form ref="formAjuste" v-model="validAjuste" @submit.prevent="submitAjuste">
                <v-row>
                   <v-col cols="12" md="6">
                      <v-select
                        v-model="ajusteData.id_almacen"
                        label="Almacén"
                        :items="almacenes"
                        item-title="nombre_almacen"
                        item-value="id"
                        :rules="[v => !!v || 'Requerido']"
                        variant="outlined"
                      />
                   </v-col>
                   <v-col cols="12" md="6">
                      <!-- Product Select -->
                      <v-autocomplete
                        v-model="ajusteData.producto_id"
                        v-model:search="searchProducto"
                        label="Buscar Producto"
                        item-title="title"
                        item-value="value"
                        :items="productosList"
                        :loading="isLoadingProductos"
                        :rules="[v => !!v || 'Requerido']"
                        variant="outlined"
                        @update:model-value="onProductoChange(ajusteData)"
                      />
                      <!-- Variant Select -->
                      <v-select
                        v-if="ajusteData.requiresVariantSelection"
                        v-model="ajusteData.variant_id"
                        label="Seleccionar Variante"
                        item-title="title"
                        item-value="value"
                        :items="ajusteData.variantsList"
                        :rules="[v => !!v || 'Variante requerida']"
                        variant="outlined"
                        class="mt-2"
                        @update:model-value="onVariantChange(ajusteData)"
                      />
                      
                      <!-- Stock Info Display -->
                       <div v-if="ajusteData.stockInfo" class="mt-2 d-flex align-center gap-2">
                           <v-progress-circular v-if="ajusteData.stockInfo.loading" indeterminate size="20" width="2" color="primary"></v-progress-circular>
                           <div v-else>
                               <v-chip size="small" color="primary" variant="flat">
                                   Stock Actual: <strong>{{ ajusteData.stockInfo.origen }}</strong>
                               </v-chip>
                           </div>
                       </div>
                       
                      <div v-if="ajusteData.sku" class="text-caption text-medium-emphasis mt-1">
                        SKU: {{ ajusteData.sku }}
                      </div>
                   </v-col>
                   <v-col cols="12" md="4">
                      <v-select
                        v-model="ajusteData.tipo_ajuste"
                        label="Tipo"
                        :items="['Entrada', 'Salida']"
                        variant="outlined"
                      />
                   </v-col>
                   <v-col cols="12" md="4">
                      <v-text-field
                        v-model.number="ajusteData.cantidad"
                        label="Cantidad"
                        type="number"
                        :rules="[v => v > 0 || 'Debe ser mayor a 0']"
                        variant="outlined"
                      />
                   </v-col>

                </v-row>
                <div class="d-flex justify-end mt-4">
                  <v-btn color="primary" type="submit" :loading="isPendingAjuste" :disabled="!validAjuste">
                    Registrar Ajuste
                  </v-btn>
                </div>
             </v-form>
          </v-window-item>

          <!-- TRANSFER TAB -->
          <v-window-item value="transferencia">
             <v-form ref="formTransfer" v-model="validTransfer" @submit.prevent="submitTransfer">
                <v-row>
                   <v-col cols="12" md="6">
                      <v-select
                        v-model="transferData.id_almacen_origen"
                        label="Almacén Origen"
                        :items="almacenes"
                        item-title="nombre_almacen"
                        item-value="id"
                        :rules="[v => !!v || 'Requerido']"
                        variant="outlined"
                      />
                   </v-col>
                   <v-col cols="12" md="6">
                      <v-select
                        v-model="transferData.id_almacen_destino"
                        label="Almacén Destino"
                        :items="almacenes"
                        item-title="nombre_almacen"
                        item-value="id"
                        :rules="[
                          v => !!v || 'Requerido',
                          v => v !== transferData.id_almacen_origen || 'El destino debe ser diferente al origen'
                        ]"
                        variant="outlined"
                      />
                   </v-col>
                   
                   <v-col cols="12">
                      <h3 class="text-subtitle-1 mb-2">Productos a Transferir</h3>
                      <!-- Simple Product Entry for MVP -->
                      <v-row align="end" v-for="(item, index) in transferItems" :key="index">
                          <v-col cols="12" md="5">
                             <v-autocomplete
                                v-model="item.producto_id"
                                v-model:search="searchProducto"
                                density="compact"
                                label="Producto"
                                item-title="title"
                                item-value="value"
                                :items="productosList"
                                :loading="isLoadingProductos"
                                :rules="[v => !!v || 'Requerido']"
                                variant="outlined"
                                @update:model-value="onProductoChange(item)"
                             />
                             <v-select
                                v-if="item.requiresVariantSelection"
                                v-model="item.variant_id"
                                density="compact"
                                label="Variante"
                                item-title="title"
                                item-value="value"
                                :items="item.variantsList"
                                :rules="[v => !!v || 'Requerido']"
                                variant="outlined"
                                class="mt-2"
                                @update:model-value="onVariantChange(item)"
                             />
                             
                             <!-- Transfer Stock Info -->
                             <div v-if="item.stockInfo" class="mt-1 d-flex align-center flex-wrap">
                                 <v-progress-circular v-if="item.stockInfo.loading" indeterminate size="16" width="2" color="primary" class="mr-2"></v-progress-circular>
                                 <template v-else>
                                     <v-chip class="mr-2 mb-1" size="x-small" color="blue-grey-lighten-4">
                                         Origen: <strong>{{ item.stockInfo.origen }}</strong>
                                     </v-chip>
                                      <v-chip class="mb-1" size="x-small" color="blue-grey-lighten-4">
                                         Destino: <strong>{{ item.stockInfo.destino }}</strong>
                                     </v-chip>
                                 </template>
                             </div>
                          </v-col>
                          <v-col cols="12" md="3">
                             <v-text-field
                               v-model.number="item.cantidad"
                               label="Cantidad"
                               type="number"
                               variant="outlined"
                               density="compact"
                               :rules="[v => v > 0 || '> 0']"
                             />
                          </v-col>
                          <v-col cols="12" md="2">
                             <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="removeTransferItem(index)" v-if="transferItems.length > 1" />
                          </v-col>
                      </v-row>
                      <v-btn size="small" prepend-icon="mdi-plus" variant="text" @click="addTransferItem">Agregar Item</v-btn>
                   </v-col>



                </v-row>
                <div class="d-flex justify-end mt-4">
                   <v-btn color="purple" type="submit" :loading="isPendingTransfer" :disabled="!validTransfer">
                     Realizar Transferencia
                   </v-btn>
                </div>
             </v-form>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMutation, useQueryClient, useQuery } from '@tanstack/vue-query';
import { createMovimiento, transferir } from '@/services/movimientos.service';
import { getAlmacenes, getStock } from '@/services/almacenes.service';
import { getProductos } from '@/services/productos.service';
import Swal from 'sweetalert2';
import { useHead } from '@unhead/vue';

useHead({
  title: 'Registrar Movimiento | Nexus ERP',
  link: [
    { rel: 'canonical', href: window.location.href }
  ] 
});

const router = useRouter();
const queryClient = useQueryClient();
const tab = ref('ajuste');

const almacenes = ref([]);

// Product Search State
const searchProducto = ref('');
const { data: productosData, isLoading: isLoadingProductos } = useQuery({
  queryKey: ['productos-movimientos', searchProducto],
  queryFn: () => getProductos({ search: searchProducto.value, limit: 20 }),
  keepPreviousData: true
});

const productosList = computed(() => {
  return productosData.value?.data?.map(p => ({
    title: p.nombre_producto,
    value: p.id,
    raw: p
  })) || [];
});

function onProductoChange(item) {
  if (!item.producto_id) {
    item.variant_id = null;
    item.sku = '';
    item.variantsList = [];
    item.requiresVariantSelection = false;
    item.stockInfo = null; // Reset stock info
    return;
  }
  
  const selectedProd = productosData.value?.data?.find(p => p.id === item.producto_id);
  
  if (selectedProd) {
    if (selectedProd.variantes && selectedProd.variantes.length > 1) {
      item.variantsList = selectedProd.variantes.map(v => {
        let name = v.sku || 'Sin SKU';
        if (v.detalles_filtros && v.detalles_filtros.length > 0) {
          const attrs = v.detalles_filtros.map(df => `${df.opcion_filtro?.filtro?.nombre_filtro}: ${df.opcion_filtro?.valor_opcion}`).join(', ');
          name += ` - ${attrs}`;
        }
        return {
          title: name,
          value: v.id,
          raw: v
        };
      });
      item.requiresVariantSelection = true;
      item.variant_id = null;
      item.sku = '';
    } else if (selectedProd.variantes && selectedProd.variantes.length === 1) {
      const v = selectedProd.variantes[0];
      item.variantsList = [];
      item.requiresVariantSelection = false;
      item.variant_id = v.id;
      item.sku = v.sku;
      // Auto-fetch stock if single variant
      fetchItemStock(item);
    } else {
      item.producto_id = null; // Reset if invalid
    }
  }
}

function onVariantChange(item) {
  const variant = item.variantsList.find(v => v.value === item.variant_id)?.raw;
  if (variant) {
    item.sku = variant.sku;
    fetchItemStock(item);
  }
}




// Ajuste State
const validAjuste = ref(false);
const ajusteData = ref({
  id_almacen: null,
  producto_id: null, 
  variant_id: null,
  sku: '',
  variantsList: [],
  requiresVariantSelection: false,
  tipo_ajuste: 'Entrada', 
  cantidad: null,
  notas: '',
  stockInfo: null
});

// Transfer State
const validTransfer = ref(false);
const transferData = ref({
  id_almacen_origen: null,
  id_almacen_destino: null
});

const transferItems = ref([{ 
    producto_id: null, 
    variant_id: null, 
    sku: '', 
    cantidad: null,
    variantsList: [],
    requiresVariantSelection: false,
    stockInfo: null
}]);

async function fetchItemStock(item) {
    if (!item.variant_id) return;
    
    // Determine context based on structure
    // If it has id_almacen_origen logic (it's a transfer item, but transferItems don't have the parent context directly, 
    // unless we pass it. But wait, `item` IS the object in transferItems array.
    // However, for Ajuste, `item` is `ajusteData`.
    
    item.stockInfo = { loading: true, origen: null, destino: null };

    try {
        // AJUSTE CONTEXT
        if ('id_almacen' in item) { 
            if (item.id_almacen) {
                const res = await getStock(item.id_almacen, { search: item.sku });
                // Filter exact match if multiple returned (search is LIKE)
                const exact = res.data?.find(s => s.variante?.sku === item.sku);
                item.stockInfo.origen = exact ? exact.stock_actual : 0;
            }
        } 
        // TRANSFER CONTEXT (Item is inside array, need access to parent data)
        // We can check if `transferData` is available in scope or pass it.
        // `item` is independent row. We need to access global `transferData` ref.
        else {
             if (transferData.value.id_almacen_origen) {
                 const res = await getStock(transferData.value.id_almacen_origen, { search: item.sku });
                 const exact = res.data?.find(s => s.variante?.sku === item.sku);
                 item.stockInfo.origen = exact ? exact.stock_actual : 0;
             }
             if (transferData.value.id_almacen_destino) {
                 const res = await getStock(transferData.value.id_almacen_destino, { search: item.sku });
                 const exact = res.data?.find(s => s.variante?.sku === item.sku);
                 item.stockInfo.destino = exact ? exact.stock_actual : 0;
             }
        }
    } catch (e) {
        console.error("Error fetching stock", e);
    } finally {
        item.stockInfo.loading = false;
    }
}

// Watch for warehouse changes to re-fetch stock if product selected
import { watch } from 'vue';
watch(() => transferData.value.id_almacen_origen, () => {
    transferItems.value.forEach(item => { if(item.variant_id) fetchItemStock(item); });
});
watch(() => transferData.value.id_almacen_destino, () => {
    transferItems.value.forEach(item => { if(item.variant_id) fetchItemStock(item); });
});
watch(() => ajusteData.value.id_almacen, () => {
    if(ajusteData.value.variant_id) fetchItemStock(ajusteData.value);
});

onMounted(async () => {
    try {
        const res = await getAlmacenes({ limit: 100 });
        if (res.data) almacenes.value = res.data;
    } catch (e) {
        console.error("Error cargando almacenes", e);
    }
});

// Mutation Ajuste
const { mutate: mutateAjuste, isPending: isPendingAjuste } = useMutation({
    mutationFn: async (data) => {
        if (!ajusteData.value.variant_id) throw new Error("Debe seleccionar una variante");
        return createMovimiento({
            id_almacen: data.id_almacen,
            id_variante: data.variant_id, 
            sku: data.sku,
            tipo_movimiento: data.tipo_ajuste === 'Entrada' ? 'Entrada' : 'Salida', 
            cantidad: Number(data.cantidad),
        });
    },
    onSuccess: () => {
         queryClient.invalidateQueries(['movimientos']);
         Swal.fire('Éxito', 'Ajuste realizado', 'success');
         // Reset form
         ajusteData.value = {
            id_almacen: ajusteData.value.id_almacen, 
            producto_id: null,
            variant_id: null,
            sku: '',
            variantsList: [],
            requiresVariantSelection: false,
            tipo_ajuste: 'Entrada',
            cantidad: null,
            notas: '',
            stockInfo: null
         };
         router.push('/main/movimientos'); 
    },
    onError: (err) => Swal.fire('Error', err.response?.data?.message || err.message, 'error')
});

function submitAjuste() {
    if (validAjuste.value) {
        mutateAjuste(ajusteData.value);
    }
}

// Mutation Transfer
const { mutate: mutateTransfer, isPending: isPendingTransfer } = useMutation({
    mutationFn: (payload) => transferir(payload),
    onSuccess: () => {
        queryClient.invalidateQueries(['movimientos']);
        Swal.fire('Éxito', 'Transferencia realizada', 'success');
        router.push('/main/movimientos');
    },
    onError: (err) => Swal.fire('Error', err.response?.data?.message || 'Error en transferencia', 'error')
});

function submitTransfer() {
   if (validTransfer.value) {
        mutateTransfer({
            id_almacen_origen: transferData.value.id_almacen_origen,
            id_almacen_destino: transferData.value.id_almacen_destino,
            items: transferItems.value.map(i => ({
                id_variante: i.variant_id, 
                sku: i.sku,
                cantidad: Number(i.cantidad)
            })), 

        });
   }
}

function addTransferItem() {
    transferItems.value.push({ 
        producto_id: null, 
        variant_id: null, 
        sku: '', 
        cantidad: null,
        variantsList: [],
        requiresVariantSelection: false,
        stockInfo: null
    });
}

function removeTransferItem(index) {
    transferItems.value.splice(index, 1);
}
</script>
