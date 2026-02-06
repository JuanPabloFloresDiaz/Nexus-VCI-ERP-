import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/**
 * Muestra una alerta modal con SweetAlert2.
 * @param {Object} options - Configuración de la alerta.
 * @param {boolean} options.status - Estado de la alerta (true para éxito, false para error).
 * @param {string} options.message - Mensaje a mostrar en la alerta.
 */
// Paleta de colores del Plan de Implementación
const COLORS = {
  success: '#10B981', // Emerald
  error: '#E11D48',   // Rosewood
  warning: '#FBBF24', // Amber
  info: '#0EA5E9',    // Sky
  primary: '#1E293B', // Blue Tech
  background: '#ffffff',
  text: '#333333'
};

/**
 * Muestra una alerta modal con SweetAlert2.
 * @param {Object} options - Configuración de la alerta.
 * @param {boolean} options.status - Estado de la alerta (true para éxito, false para error).
 * @param {string} options.message - Mensaje a mostrar en la alerta.
 * @param {string} [options.title] - Título opcional.
 */
export const showAlert = ({ status, message, title }) => {
  const type = status ? 'success' : 'error';
  Swal.fire({
    title: title || (status ? '¡Éxito!' : 'Oops...'),
    text: message,
    icon: type,
    confirmButtonColor: COLORS[type],
    background: COLORS.background,
    color: COLORS.text,
    customClass: {
      popup: 'rounded-xl shadow-lg border border-gray-200 font-roboto', // Added font-roboto if custom class available or needed
      confirmButton: 'rounded-lg px-6 py-2'
    },
    buttonsStyling: true
  });
};

/**
 * Muestra una notificación tipo toast con SweetAlert2.
 * @param {Object} options - Configuración del toast.
 * @param {string} options.icon - Icono de la notificación ('success', 'error', 'warning', 'info').
 * @param {string} options.title - Título del toast.
 * @param {number} [options.timer=3500] - Duración del toast en milisegundos.
 */
export const fireToast = ({ icon, title, timer = 3500 }) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    background: COLORS.background,
    color: COLORS.text,
    iconColor: COLORS[icon] || COLORS.info, // Use palette color for icon
    customClass: {
      popup: 'rounded-xl shadow-md border border-gray-200 font-roboto',
    },
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  Toast.fire({ icon, title });
};

// Helpers específicos para consistencia
export const showSuccessToast = (title) => fireToast({ icon: 'success', title });
export const showErrorToast = (title) => fireToast({ icon: 'error', title });
export const showWarningToast = (title) => fireToast({ icon: 'warning', title });
export const showInfoToast = (title) => fireToast({ icon: 'info', title });
