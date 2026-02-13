import { defineStore } from 'pinia';
import router from '@/router';
import { authLogin, authRegister } from '@/services/auth.service';

export const useAuthStore = defineStore('auth', {
    state: () => {
        let parsedUser = null;
        try {
            const stored = localStorage.getItem('user');
            if (stored) {parsedUser = JSON.parse(stored);}
        } catch (error) {
            console.warn('Corrupted user session data, clearing.', error);
            localStorage.removeItem('user');
        }
        return {
            user: parsedUser,
            token: localStorage.getItem('token') || null,
        };
    },

    getters: {
        isAuthenticated: (state) => !!state.token,

        // Role Helpers
        isSuperAdmin: (state) => state.user?.rol_usuario === 'SuperAdministrador',
        isAdmin: (state) => state.user?.rol_usuario === 'Administrador',
        isVendor: (state) => state.user?.rol_usuario === 'Vendedor',

        // Enterprise Context
        // SuperAdmin might want to "view as" a specific company later, but default to own or null
        idEmpresa: (state) => state.user?.id_empresa,

        // Permissions Logic
        canViewAllTenants: (state) => state.user?.rol_usuario === 'SuperAdministrador',
        canManageUsers: (state) => ['SuperAdministrador', 'Administrador'].includes(state.user?.rol_usuario),
        canManageCompany: (state) => ['SuperAdministrador', 'Administrador'].includes(state.user?.rol_usuario),
    },

    actions: {
        async login(credentials) {
            try {
                const response = await authLogin(credentials);
                const { token, user } = response.data;

                this.setSession(token, user);
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
                const { token, user } = response.data;

                // Auto-login after register
                this.setSession(token, user);
                return { success: true };
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.message || 'Error en el registro'
                };
            }
        },

        setSession(token, user) {
            this.token = token;
            this.user = user;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Setup Axios default header if using a global axios instance (optional here if handled in interceptor)
            // axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
        },

        logout() {
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirigir a la pantalla de inicio o al login
            router.push('/');
            // window.location.reload(); // Optional: force reload to clear all memory states
        }
    }
});
