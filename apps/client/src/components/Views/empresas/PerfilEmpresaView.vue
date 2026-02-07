<template>
  <v-container fluid class="pa-6">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold text-primary">Perfil de Empresa</h1>
      <p class="text-body-1 text-medium-emphasis">Información general de su organización</p>
    </div>

    <v-card v-if="isLoading" class="border rounded-lg" elevation="0">
      <v-skeleton-loader type="article, list-item-three-line"></v-skeleton-loader>
    </v-card>

    <v-card v-else-if="empresa" class="border rounded-lg" elevation="0">
      <v-img
        height="200"
        src="https://cdn.vuetifyjs.com/images/cards/server-room.jpg" 
        cover
        class="align-end"
      >
      </v-img>

      <v-card-text class="pt-6">
        <v-row>
          <v-col cols="12" md="2" class="d-flex justify-center flex-column align-center">
             <div class="position-relative">
                 <v-avatar 
                    size="120" 
                    color="surface-variant" 
                    class="border cursor-pointer elevation-2" 
                    style="margin-top: -80px; z-index: 1;"
                    @click="triggerFileInput"
                 >
                     <!-- Image Loader / Skeleton -->
                     <v-skeleton-loader v-if="imageLoading" type="avatar" width="120" height="120"></v-skeleton-loader>
                    <v-img v-else-if="imageUrl" :src="imageUrl" alt="Logo" cover></v-img>
                    <span v-else class="text-h3 font-weight-bold text-uppercase">
                        {{ empresa.nombre_empresa?.charAt(0) }}
                    </span>
                    
                    <!-- Overlay for hover effect -->
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
             <!-- Hidden File Input -->
             <input 
                type="file" 
                ref="fileInput" 
                class="d-none" 
                accept="image/*"
                @change="handleFileUpload"
             />
          </v-col>
          
          <v-col cols="12" md="10">
            <div class="mb-4 mt-2">
                <h2 class="text-h4 font-weight-bold">{{ empresa.nombre_empresa }}</h2>
                <v-chip size="small" color="primary" variant="flat" class="mt-2">Empresa Activa</v-chip>
            </div>
            <v-divider class="mb-4"></v-divider>
            <v-row>
                <v-col cols="12" md="6">
                    <v-list-item>
                        <template v-slot:prepend>
                            <v-icon icon="mdi-card-account-details-outline" color="primary"></v-icon>
                        </template>
                        <v-list-item-title class="font-weight-bold">NIT / Identificación</v-list-item-title>
                        <v-list-item-subtitle class="text-h6 text-high-emphasis opacity-100 mt-1">
                            {{ empresa.nit_empresa || 'No registrado' }}
                        </v-list-item-subtitle>
                    </v-list-item>
                </v-col>

                 <v-col cols="12" md="6">
                    <v-list-item>
                        <template v-slot:prepend>
                            <v-icon icon="mdi-email-outline" color="primary"></v-icon>
                        </template>
                        <v-list-item-title class="font-weight-bold">Correo Electrónico</v-list-item-title>
                        <v-list-item-subtitle class="text-h6 text-high-emphasis opacity-100 mt-1">
                            {{ empresa.correo_empresa || 'No registrado' }}
                        </v-list-item-subtitle>
                    </v-list-item>
                </v-col>

                 <v-col cols="12" md="6">
                    <v-list-item>
                        <template v-slot:prepend>
                            <v-icon icon="mdi-phone-outline" color="primary"></v-icon>
                        </template>
                        <v-list-item-title class="font-weight-bold">Teléfono</v-list-item-title>
                        <v-list-item-subtitle class="text-h6 text-high-emphasis opacity-100 mt-1">
                            {{ empresa.telefono_empresa || 'No registrado' }}
                        </v-list-item-subtitle>
                    </v-list-item>
                </v-col>

                 <v-col cols="12" md="6">
                    <v-list-item>
                        <template v-slot:prepend>
                            <v-icon icon="mdi-map-marker-outline" color="primary"></v-icon>
                        </template>
                        <v-list-item-title class="font-weight-bold">Dirección</v-list-item-title>
                        <v-list-item-subtitle class="text-h6 text-high-emphasis opacity-100 mt-1">
                            {{ empresa.direccion_empresa || 'No registrada' }}
                        </v-list-item-subtitle>
                    </v-list-item>
                </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-card-text>
      
      <!-- <v-divider></v-divider>
      <v-card-actions class="justify-end pa-4">
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-pencil">
            Editar Información
        </v-btn>
      </v-card-actions> -->
    </v-card>

    <div v-else class="text-center pa-10">
        <v-icon icon="mdi-alert-circle-outline" size="64" color="error"></v-icon>
        <h3 class="text-h5 mt-4">No se pudo cargar la información de la empresa</h3>
        <p class="text-body-1 text-medium-emphasis">Por favor intente nuevamente más tarde.</p>
    </div>
  </v-container>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { getEmpresaProfile, updateEmpresaProfile } from '@/services/empresas.service';
import { uploadFile } from '@/services/storage.service';
import { getImage } from '@/utils/getImage';
import Swal from 'sweetalert2';

const queryClient = useQueryClient();
const fileInput = ref(null);

const { data: profileData, isPending: isLoading } = useQuery({
  queryKey: ['empresas', 'profile'],
  queryFn: getEmpresaProfile,
  staleTime: 1000 * 60 * 30, // 30 mins
});

const empresa = computed(() => {
  return profileData.value?.success ? profileData.value.data : null;
});

const imageUrl = ref(null);
const imageLoading = ref(false);

const loadCompanyLogo = async () => {
    if (empresa.value?.logo_url) {
        imageLoading.value = true;
        try {
            imageUrl.value = await getImage(empresa.value.logo_url);
        } catch (e) {
            console.error(e);
        } finally {
            imageLoading.value = false;
        }
    }
};

watch(empresa, () => {
    loadCompanyLogo();
}, { immediate: true });

// Mutations
const updateMutation = useMutation({
    mutationFn: (data) => updateEmpresaProfile(data),
    onSuccess: () => {
        queryClient.invalidateQueries(['empresas', 'profile']);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Logo actualizado correctamente',
            showConfirmButton: false,
            timer: 3000
        });
    },
    onError: () => {
        Swal.fire('Error', 'No se pudo actualizar el logo', 'error');
    }
});

const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: (response) => {
        // Once uploaded, update company with new logo URL
        if (response.success && response.data?.url) {
             updateMutation.mutate({ logo_url: response.data.url });
             // Update local preview immediately if needed, or wait for invalidateQueries
             // invalidateQueries triggers profile reload -> watcher triggers getImage -> updates imageUrl
             // But valid URL from upload response can be used directly?
             // response.data.url is relative. We can just let the watcher handle it.
        }
    },
    onError: () => {
        Swal.fire('Error', 'Falló la subida de la imagen', 'error');
    }
});


const triggerFileInput = () => {
    fileInput.value.click();
};

const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate size (e.g., max 2MB) and type
    if (file.size > 2 * 1024 * 1024) {
        Swal.fire('Error', 'La imagen no debe superar los 2MB', 'warning');
        return;
    }

    if (!file.type.startsWith('image/')) {
        Swal.fire('Error', 'Solo se permiten archivos de imagen', 'warning');
        return;
    }

    // Call upload service
    // AxiosRequest handles FormData if object has File values
    const formData = {
        image: file
    };
    
    uploadMutation.mutate(formData);
};
</script>
