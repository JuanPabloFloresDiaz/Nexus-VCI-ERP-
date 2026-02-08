<script setup>
import { useAuth } from '@/hooks/useAuth';

const { user } = useAuth();
</script>

<template>
    <v-container class="fill-height justify-center">
        <v-card width="600" elevation="2" class="rounded-lg">
            <v-card-item class="bg-primary text-white py-4">
                <template v-slot:prepend>
                    <v-avatar color="white" size="64">
                        <v-img
                            v-if="user?.foto_perfil_url"
                            :src="user.foto_perfil_url"
                            alt="Avatar"
                        />
                        <span v-else class="text-h4 text-primary font-weight-bold">
                            {{ user?.nombre_usuario?.charAt(0).toUpperCase() }}
                        </span>
                    </v-avatar>
                </template>
                <v-card-title class="text-h5 font-weight-bold">
                    Mi Perfil
                </v-card-title>
                <v-card-subtitle class="text-white opacity-80">
                    {{ user?.rol_usuario }}
                </v-card-subtitle>
            </v-card-item>

            <v-list class="py-0">
                <v-list-item class="py-4">
                    <template v-slot:prepend>
                        <v-icon color="primary" class="mr-4">mdi-account</v-icon>
                    </template>
                    <v-list-item-title class="text-caption text-medium-emphasis">Nombre Completo</v-list-item-title>
                    <v-list-item-subtitle class="text-body-1 text-high-emphasis">
                        {{ user?.nombre_usuario }}
                    </v-list-item-subtitle>
                </v-list-item>

                <v-divider></v-divider>

                <v-list-item class="py-4">
                    <template v-slot:prepend>
                        <v-icon color="primary" class="mr-4">mdi-email</v-icon>
                    </template>
                    <v-list-item-title class="text-caption text-medium-emphasis">Correo Electrónico</v-list-item-title>
                    <v-list-item-subtitle class="text-body-1 text-high-emphasis">
                        {{ user?.correo_electronico }}
                    </v-list-item-subtitle>
                </v-list-item>

                <v-divider></v-divider>
                
                <v-list-item class="py-4" v-if="user?.empresa">
                     <template v-slot:prepend>
                        <v-icon color="primary" class="mr-4">mdi-domain</v-icon>
                    </template>
                    <v-list-item-title class="text-caption text-medium-emphasis">Empresa</v-list-item-title>
                    <v-list-item-subtitle class="text-body-1 text-high-emphasis">
                        {{ user?.empresa?.nombre_empresa || 'N/A' }}
                    </v-list-item-subtitle>
                </v-list-item>
            </v-list>
        </v-card>
    </v-container>
</template>
