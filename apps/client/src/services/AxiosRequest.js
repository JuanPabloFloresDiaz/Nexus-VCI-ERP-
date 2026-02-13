import axios from 'axios';

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

async function AxiosRequest(endpoint, method, form = {}, params, config = {}) {
  // Verificar si alguno de los valores en `form` es un archivo (instancia de File)
  const hasFile = Object.values(form).some(value => value instanceof File);

  let data = null;
  const headers = {
    Authorization: localStorage.getItem('token')
      ? `Bearer ${localStorage.getItem('token')}`
      : '',
  };

  // Para los métodos que envían body
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    if (hasFile) {
      // Si hay un archivo, usar FormData
      const formData = new FormData();
      for (const [key, value] of Object.entries(form)) {
        formData.append(key, value);
      }
      data = formData;
    } else {
      // Si no hay archivo, enviar como JSON
      data = form;
      headers['Content-Type'] = 'application/json';
    }
  }

  const options = {
    method,
    url: SERVER_URL + endpoint,
    headers,
    data,
    params,
    ...config // Merge custom config (e.g. responseType)
  };

  console.log('Request Data:', data);
  console.log('Request Headers:', headers);
  console.log('Request URL:', options.url);

  try {
    const response = await axios(options);
    console.log('RESPONSE:', {
      URL: options.url,
      Status: response.status,
      // Data: response.data, // Don't log data if blob
    });
    return response.data;
  } catch (error) {
    console.error('Error en la petición:', error);

    if (axios.isAxiosError(error)) {
      // Handle blob errors which are not JSON
      if (config.responseType === 'blob' && error.response?.data instanceof Blob) {
        // Can't read text from blob easily here without promise, just throw generic
        throw new Error('Error al descargar archivo');
      }

      const errorData = error.response?.data;
      if (Array.isArray(errorData?.error)) {
        const errorMessages = errorData.error.map(err => err.msg).join(', ');
        throw new Error(`Errores: ${errorMessages}`);
      }
      throw new Error(errorData?.error || 'Error desconocido');
    }

    throw error;
  }
}

export default AxiosRequest;
