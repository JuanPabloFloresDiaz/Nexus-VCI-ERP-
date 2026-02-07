import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
    const authStore = useAuthStore();
    const { user, token, isAuthenticated, isSuperAdmin, isAdmin, isVendor, idEmpresa } = storeToRefs(authStore);

    return {
        // State (Reactive)
        user,
        token,
        isAuthenticated,
        idEmpresa,

        // Roles (Reactive)
        isSuperAdmin,
        isAdmin,
        isVendor,

        // Actions
        login: authStore.login,
        register: authStore.register,
        logout: authStore.logout
    };
}
