<template>
  <v-container class="pa-6" fluid>
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold text-secondary">Perfil de Empresa</h1>
      <p class="text-body-1 text-medium-emphasis">Información general de su organización</p>
    </div>

    <v-card v-if="isLoading" class="border rounded-lg" elevation="0">
      <v-skeleton-loader type="article, list-item-three-line" />
    </v-card>

    <v-card v-else-if="empresa" class="border rounded-lg" elevation="0">
      <v-img
        class="align-end"
        cover 
        height="200"
        src="https://cdn.vuetifyjs.com/images/cards/server-room.jpg"
      />

      <v-card-text class="pt-6">
        <v-row>
          <v-col class="d-flex justify-center flex-column align-center" cols="12" md="2">
            <div class="position-relative">
              <v-avatar 
                class="border cursor-pointer elevation-2" 
                color="surface-variant" 
                size="120" 
                style="margin-top: -80px; z-index: 1;"
                @click="triggerFileInput"
              >
                <!-- Image Loader / Skeleton -->
                <v-skeleton-loader v-if="imageLoading" height="120" type="avatar" width="120" />
                <v-img v-else-if="imageUrl" alt="Logo" cover :src="imageUrl" />
                <span v-else class="text-h3 font-weight-bold text-uppercase">
                  {{ empresa.nombre_empresa?.charAt(0) }}
                </span>
                    
                <!-- Overlay for hover effect -->
                <v-overlay
                  activator="parent"
                  class="align-center justify-center"
                  contained
                  location-strategy="connected"
                  scrim="#000"
                  scroll-strategy="block"
                  theme="dark"
                >
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
            <!-- Hidden File Input -->
            <input 
              ref="fileInput" 
              accept="image/*" 
              class="d-none" 
              type="file"
              @change="handleFileUpload"
            >
          </v-col>
          
          <v-col cols="12" md="10">
            <div class="mb-4 mt-2">
              <h2 class="text-h4 font-weight-bold">{{ empresa.nombre_empresa }}</h2>
              <v-chip class="mt-2" color="primary" size="small" variant="flat">Empresa Activa</v-chip>
            </div>
            <v-divider class="mb-4" />
            <v-row>
              <v-col cols="12" md="6">
                <v-list-item>
                  <template #prepend>
                    <v-icon color="primary" icon="mdi-card-account-details-outline" />
                  </template>
                  <v-list-item-title class="font-weight-bold">NIT / Identificación</v-list-item-title>
                  <v-list-item-subtitle class="text-h6 text-high-emphasis opacity-100 mt-1">
                    {{ empresa.nit_empresa || 'No registrado' }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-col>

              <v-col cols="12" md="6">
                <v-list-item>
                  <template #prepend>
                    <v-icon color="primary" icon="mdi-email-outline" />
                  </template>
                  <v-list-item-title class="font-weight-bold">Correo Electrónico</v-list-item-title>
                  <v-list-item-subtitle class="text-h6 text-high-emphasis opacity-100 mt-1">
                    {{ empresa.correo_empresa || 'No registrado' }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-col>

              <v-col cols="12" md="6">
                <v-list-item>
                  <template #prepend>
                    <v-icon color="primary" icon="mdi-phone-outline" />
                  </template>
                  <v-list-item-title class="font-weight-bold">Teléfono</v-list-item-title>
                  <v-list-item-subtitle class="text-h6 text-high-emphasis opacity-100 mt-1">
                    {{ empresa.telefono_empresa || 'No registrado' }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-col>

              <v-col cols="12" md="6">
                <v-list-item>
                  <template #prepend>
                    <v-icon color="primary" icon="mdi-map-marker-outline" />
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
      <v-icon color="error" icon="mdi-alert-circle-outline" size="64" />
      <h3 class="text-h5 mt-4">No se pudo cargar la información de la empresa</h3>
      <p class="text-body-1 text-medium-emphasis">Por favor intente nuevamente más tarde.</p>
    </div>
  </v-container>
</template>

<script setup>
  import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
  import Swal from 'sweetalert2';
  import { computed, ref } from 'vue';
  import { getEmpresaProfile, updateEmpresaProfile } from '@/services/empresas.service';
  import { uploadFile } from '@/services/storage.service';
  import { getImage } from '@/utils/getImage';
  import { useHead } from '@unhead/vue';

  // --- SEO ---
  useHead({
    title: 'Perfil de Empresa',
    meta: [
      { name: 'description', content: 'Configuración y detalles del perfil de la empresa.' }
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });

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

  async function loadCompanyLogo () {
    if (empresa.value?.logo_url) {
      imageLoading.value = true;
      try {
        imageUrl.value = await getImage(empresa.value.logo_url);
      } catch (error) {
        console.error(error);
      } finally {
        imageLoading.value = false;
      }
    }
  }

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


  function triggerFileInput () {
    fileInput.value.click();
  }

  function handleFileUpload (event) {
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
  }
</script>
