import { defineStore } from 'pinia';
import router from '@/router';
import { authLogin, authRegister } from '@/services/auth.service';

export const useAuthStore = defineStore('auth', {
    state: () => {
        let parsedUser = null;
        let parsedConfig = null;
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) { parsedUser = JSON.parse(storedUser); }

            const storedConfig = localStorage.getItem('config');
            if (storedConfig) { parsedConfig = JSON.parse(storedConfig); }
        } catch (error) {
            console.warn('Corrupted user session data, clearing.', error);
            localStorage.removeItem('user');
            localStorage.removeItem('config');
        }
        return {
            user: parsedUser,
            token: localStorage.getItem('token') || null,
            config: parsedConfig,
        };
    },

    getters: {
        isAuthenticated: (state) => !!state.token,

        // Role Helpers
        isSuperAdmin: (state) => state.user?.rol_usuario === 'SuperAdministrador',
        isAdmin: (state) => state.user?.rol_usuario === 'Administrador',
        isVendor: (state) => state.user?.rol_usuario === 'Vendedor',

        // Enterprise Context
        idEmpresa: (state) => state.user?.id_empresa,

        // Config Helpers
        globalConfig: (state) => state.config,
        currentTheme: (state) => state.config?.tema_interfaz || 'nexusTheme',

        // Permissions Logic
        canViewAllTenants: (state) => state.user?.rol_usuario === 'SuperAdministrador',
        canManageUsers: (state) => ['SuperAdministrador', 'Administrador'].includes(state.user?.rol_usuario),
        canManageCompany: (state) => ['SuperAdministrador', 'Administrador'].includes(state.user?.rol_usuario),
    },

    actions: {
        async login(credentials) {
            try {
                const response = await authLogin(credentials);
                const { token, user, config } = response.data;

                this.setSession(token, user, config);
                return { success: true };
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.message || 'Error al iniciar sesión'
                };
            }
        },

        async register(data) {
            try {
                const response = await authRegister(data);
                const { token, user, config } = response.data;

                // Auto-login after register
                this.setSession(token, user, config);
                return { success: true };
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.message || 'Error en el registro'
                };
            }
        },

        setSession(token, user, config) {
            this.token = token;
            this.user = user;
            if (config) this.config = config;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            if (config) localStorage.setItem('config', JSON.stringify(config));
        },

        logout() {
            this.token = null;
            this.user = null;
            this.config = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('config');
            // Redirigir a la pantalla de inicio o al login
            router.push('/');
        },

        updateConfig(newConfig) {
            // Merge existing config with new changes
            this.config = { ...this.config, ...newConfig };
            localStorage.setItem('config', JSON.stringify(this.config));
        }
    }
});
