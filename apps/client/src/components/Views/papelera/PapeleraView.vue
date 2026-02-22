<template>
  <v-container class="pa-6" fluid>
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold text-secondary">Papelera de Reciclaje</h1>
      <p class="text-body-1 text-medium-emphasis">Recupera elementos eliminados o bórralos permanentemente.</p>
    </div>

    <v-card class="border rounded-lg" elevation="0">
      <v-tabs v-model="tab" color="primary" show-arrows>
        <!-- Generic Tabs available to Admin and SuperAdmin -->
        <v-tab class="text-none" value="usuarios">
          <v-icon start>mdi-account-group</v-icon> Usuarios
        </v-tab>
        <v-tab class="text-none" value="clientes">
          <v-icon start>mdi-account-tie</v-icon> Clientes
        </v-tab>
        <v-tab class="text-none" value="proveedores">
          <v-icon start>mdi-truck-delivery</v-icon> Proveedores
        </v-tab>
        <v-tab class="text-none" value="categorizacion">
          <v-icon start>mdi-shape</v-icon> Categorización
        </v-tab>
        <v-tab class="text-none" value="productos">
          <v-icon start>mdi-package-variant</v-icon> Productos
        </v-tab>
        <v-tab class="text-none" value="compras">
          <v-icon start>mdi-cart-arrow-down</v-icon> Compras
        </v-tab>
        <v-tab class="text-none" value="pedidos">
          <v-icon start>mdi-cart</v-icon> Pedidos
        </v-tab>
        
        <!-- Super Admin Only Tabs -->
        <v-tab v-if="isSuperAdmin" class="text-none" value="empresas">
          <v-icon start>mdi-domain</v-icon> Empresas
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text class="pa-6 bg-grey-lighten-5" style="min-height: 400px;">
        <v-window v-model="tab">
          <v-window-item value="usuarios">
            <usuariosWindowTab />
          </v-window-item>
          <v-window-item value="clientes">
            <clientesWindowTab />
          </v-window-item>
          <v-window-item value="proveedores">
            <proveedoresWindowTab />
          </v-window-item>
          <v-window-item value="categorizacion">
            <categorizacionWindowTab />
          </v-window-item>
          <v-window-item value="productos">
            <productosWindowTab />
          </v-window-item>
          <v-window-item value="compras">
            <comprasWindowTab />
          </v-window-item>
          <v-window-item value="pedidos">
            <pedidosWindowTab />
          </v-window-item>

          <v-window-item v-if="isSuperAdmin" value="empresas">
            <empresasWindowTab />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
  import { useHead } from '@unhead/vue';
  import { ref } from 'vue';
  import { useAuth } from '@/hooks/useAuth';

  import categorizacionWindowTab from './window-tab/categorizacionWindowTab.vue';
  import clientesWindowTab from './window-tab/clientesWindowTab.vue';
  import comprasWindowTab from './window-tab/comprasWindowTab.vue';
  import empresasWindowTab from './window-tab/empresasWindowTab.vue';
  import pedidosWindowTab from './window-tab/pedidosWindowTab.vue';
  import productosWindowTab from './window-tab/productosWindowTab.vue';
  import proveedoresWindowTab from './window-tab/proveedoresWindowTab.vue';
  // Import Window Tabs
  // Note: Assuming these components will be implemented. 
  // For now, I'm importing them. If they are empty/don't exist properly, I might need to create placeholders or the build will fail.
  // User provided paths, so I assume files exist (even if empty).
  import usuariosWindowTab from './window-tab/usuariosWindowTab.vue';

  // --- SEO ---
  useHead({
    title: 'Papelera de Reciclaje',
    meta: [
      { name: 'description', content: 'Recuperación de elementos eliminados.' }
    ],
    link: [
      { rel: 'canonical', href: window.location.href }
    ]
  });
  // import filtrosWindowTab from './window-tab/filtrosWindowTab.vue'; // Optional if needed

  const { isSuperAdmin } = useAuth();
  const tab = ref('usuarios'); // Default tab

</script>
