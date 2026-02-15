<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery, useMutation } from '@tanstack/vue-query';
import { getProveedores } from '@/services/proveedores.service';
import { getProductos } from '@/services/productos.service';
import { createCompra } from '@/services/compras.service';
import Swal from 'sweetalert2';

const router = useRouter();

// --- State ---
const valid = ref(false);
const form = ref(null);
const loading = ref(false);

const proveedor = ref(null);
const fechaEntrega = ref(null);
const estado = ref('Recibido'); 
const detalles = ref([]); // Array of { producto_obj, variant_obj, cantidad: 1, costo: 0 }

// --- Data Fetching ---

// Proveedores
const { data: proveedoresData, isLoading: isLoadingProveedores } = useQuery({
    queryKey: ['proveedores-list-create'],
    queryFn: () => getProveedores('limit=1000')
});

const proveedoresList = computed(() => {
    return proveedoresData.value?.data?.map(p => ({
        title: p.nombre_proveedor,
        value: p.id,
        raw: p
    })) || [];
});

// Productos (For Autocomplete)
const searchProducto = ref('');
const { data: productosData, isLoading: isLoadingProductos } = useQuery({
    queryKey: ['productos-list-create', searchProducto],
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

// --- Computed ---
const totalCompra = computed(() => {
    return detalles.value.reduce((acc, item) => {
        return acc + (Number(item.cantidad || 0) * Number(item.costo || 0));
    }, 0);
});

// --- Methods ---

function addDetalle() {
    detalles.value.push({
        producto_id: null,
        variant_id: null,
        cantidad: 1,
        costo: 0,
        subtotal: 0,
        variantsList: [], // Store valid variants for this row
        requiresVariantSelection: false
    });
}

function removeDetalle(index) {
    detalles.value.splice(index, 1);
}

function onProductoChange(item) {
    if (!item.producto_id) {
        item.variant_id = null;
        item.variantsList = [];
        item.requiresVariantSelection = false;
        return;
    }
    
    const selectedProd = productosData.value?.data?.find(p => p.id === item.producto_id);
    
    if (selectedProd) {
        // Validation: Variants
        if (selectedProd.variantes && selectedProd.variantes.length > 1) {
            // Setup Inline Selector
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
            item.variant_id = null; // Reset selection
            item.costo = 0;
        } else if (selectedProd.variantes && selectedProd.variantes.length === 1) {
            // Auto Select Single Variant
            const v = selectedProd.variantes[0];
            item.variantsList = [];
            item.requiresVariantSelection = false;
            selectVariant(item, v);
        } else {
            // Error or Legacy
             Swal.fire('Error', 'El producto seleccionado no tiene variantes configuradas', 'warning');
             // Reset
             item.producto_id = null;
        }
    }
}

function onVariantChange(item) {
    const variant = item.variantsList.find(v => v.value === item.variant_id)?.raw;
    if (variant) {
        selectVariant(item, variant);
    }
}

function selectVariant(item, variant) {
    item.variant_id = variant.id;
    item.costo = variant.costo_unitario || 0;
}

// Mutation
const { mutate } = useMutation({
    mutationFn: createCompra,
    onSuccess: () => {
        Swal.fire({
            icon: 'success',
            title: 'Compra registrada',
            text: 'La compra se ha guardado correctamente',
            timer: 2000,
            showConfirmButton: false
        });
        router.push('/main/compras');
    },
    onError: (error) => {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.response?.data?.message || 'No se pudo crear la compra'
        });
    },
    onSettled: () => {
        loading.value = false;
    }
});

async function submit() {
    const { valid: isValid } = await form.value.validate();
    if (!isValid) return;

    if (detalles.value.length === 0) {
         Swal.fire('Error', 'Debes agregar al menos un producto', 'warning');
         return;
    }

    // Check complete selections
    if (detalles.value.some(d => !d.variant_id)) {
        Swal.fire('Error', 'Complete la selección de variantes para todos los productos', 'warning');
        return; 
    }

    loading.value = true;

    const payload = {
        id_proveedor: proveedor.value,
        fecha_entrega_estimada: fechaEntrega.value, 
        estado_compra: estado.value,
        detalles: detalles.value.map(d => ({
            id_variante: d.variant_id, // Send ID Variante
            cantidad: Number(d.cantidad),
            precio_costo_historico: Number(d.costo)
        }))
    };

    mutate(payload);
}
</script>

<template>
    <v-container class="pa-6" fluid>
         <div class="mb-6 d-flex flex-wrap align-center justify-space-between">
            <div>
                <h1 class="text-h4 font-weight-bold text-primary">Nueva Compra</h1>
                <p class="text-body-1 text-medium-emphasis">Registrar ingreso de mercadería</p>
            </div>
            <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.back()">
                Volver
            </v-btn>
        </div>

        <v-form ref="form" v-model="valid" @submit.prevent="submit">
            <v-card class="rounded-lg pa-4 mb-4" variant="outlined">
                <div class="text-h6 mb-4">Información del Proveedor</div>
                <v-row>
                    <v-col cols="12" md="6">
                        <v-autocomplete
                            v-model="proveedor"
                            :items="proveedoresList"
                            :loading="isLoadingProveedores"
                            label="Seleccionar Proveedor"
                            placeholder="Busca un proveedor..."
                            variant="outlined"
                            item-title="title"
                            item-value="value"
                            :rules="[v => !!v || 'Proveedor es requerido']"
                        />
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-text-field
                            v-model="fechaEntrega"
                            type="date"
                            label="Fecha Estimada Entrega"
                            variant="outlined"
                        />
                    </v-col>
                     <v-col cols="12" md="3">
                        <v-select
                            v-model="estado"
                            :items="['Pendiente', 'Recibido']"
                            label="Estado Inicial"
                            variant="outlined"
                            :rules="[v => !!v || 'Estado es requerido']"
                        />
                    </v-col>
                </v-row>
            </v-card>

            <v-card class="rounded-lg pa-4 mb-4" variant="outlined">
                <div class="d-flex justify-space-between align-center mb-4">
                    <div class="text-h6">Detalle de Productos</div>
                    <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addDetalle">
                        Agregar Producto
                    </v-btn>
                </div>

                <v-table density="comfortable">
                    <thead>
                        <tr>
                            <th style="width: 40%">Producto / Variante</th>
                            <th style="width: 15%">Cantidad</th>
                            <th style="width: 20%">Costo Unitario</th>
                            <th style="width: 20%" class="text-right">Subtotal</th>
                            <th style="width: 5%"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in detalles" :key="index">
                            <td>
                                <!-- Product Select -->
                                <v-autocomplete
                                    v-model="item.producto_id"
                                    :items="productosList"
                                    :loading="isLoadingProductos"
                                    v-model:search="searchProducto"
                                    placeholder="Buscar producto..."
                                    variant="outlined"
                                    density="compact"
                                    hide-details
                                    item-title="title"
                                    item-value="value"
                                    class="mb-1"
                                    @update:model-value="onProductoChange(item)"
                                    :rules="[v => !!v || 'Requerido']"
                                />
                                <!-- Variant Select (Inline) -->
                                <v-select
                                    v-if="item.requiresVariantSelection"
                                    v-model="item.variant_id"
                                    :items="item.variantsList"
                                    placeholder="Seleccionar variante..."
                                    density="compact"
                                    variant="outlined"
                                    hide-details
                                    item-title="title"
                                    item-value="value"
                                    @update:model-value="onVariantChange(item)"
                                    :rules="[v => !!v || 'Variante requerida']"
                                    class="mt-2"
                                >
                                    <template #prepend-inner>
                                        <v-icon size="small" color="primary">mdi-shape-outline</v-icon>
                                    </template>
                                </v-select>
                            </td>
                            <td>
                                <v-text-field v-model.number="item.cantidad" type="number" min="1" variant="outlined" density="compact" hide-details :rules="[v => v > 0 || '>0']" />
                            </td>
                            <td>
                                <v-text-field v-model.number="item.costo" type="number" min="0" prefix="$" variant="outlined" density="compact" hide-details :rules="[v => v >= 0 || '>=0']" />
                            </td>
                             <td class="text-right font-weight-bold">
                                {{ (item.cantidad * item.costo).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
                            </td>
                            <td class="text-center">
                                <v-btn icon="mdi-delete" color="error" variant="text" size="small" @click="removeDetalle(index)" />
                            </td>
                        </tr>
                        <tr v-if="detalles.length === 0">
                            <td colspan="5" class="text-center text-medium-emphasis pa-4">No hay productos agregados</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="text-right text-h6 font-weight-bold">TOTAL</td>
                            <td class="text-right text-h6 font-weight-bold text-primary">
                                {{ totalCompra.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </v-table>
            </v-card>

            <div class="d-flex justify-end gap-2">
                <v-btn variant="tonal" size="large" @click="router.back()">Cancelar</v-btn>
                <v-btn color="primary" size="large" type="submit" :loading="loading" prepend-icon="mdi-content-save">
                    Guardar Compra
                </v-btn>
            </div>
        </v-form>
    </v-container>
</template>
