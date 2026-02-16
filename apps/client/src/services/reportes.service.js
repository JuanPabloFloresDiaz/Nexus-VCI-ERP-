
import axios from 'axios';

const API_URL = (import.meta.env.VITE_SERVER_URL || '').replace(/\/$/, '') + '/reportes';

// Helper to get auth headers
function getAuthHeaders () {
  return {
    Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
}
}

// Helper to handle file download
function downloadFile (response, defaultFilename) {
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Try to get filename from headers
    const contentDisposition = response.headers['content-disposition'];
    let filename = defaultFilename;
    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length === 2)
            {filename = filenameMatch[1];}
    }

    link.setAttribute('download', filename);
    document.body.append(link);
    link.click();
    link.remove();
}

export async function getCategorizacionReport (params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_URL}/categorizacion?${query}`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
    });
    downloadFile(response, 'reporte-categorizacion.pdf');
}

export async function getProductosReport (params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_URL}/productos?${query}`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
    });
    downloadFile(response, 'reporte-productos.pdf');
}

export async function getClientesReport (params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_URL}/clientes?${query}`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
    });
    downloadFile(response, 'reporte-clientes.pdf');
}

export async function getPedidosLogReport (startDate, endDate, params = {}) {
    const queryParams = new URLSearchParams(params);
    if (startDate) {queryParams.append('startDate', startDate);}
    if (endDate) {queryParams.append('endDate', endDate);}

    const response = await axios.get(`${API_URL}/pedidos-log?${queryParams.toString()}`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
    });
    downloadFile(response, 'bitacora-pedidos.pdf');
}

export async function getFacturaPedido (id, params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_URL}/factura/${id}?${query}`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
    });
    // Filename will overlap with header but good fallback
    downloadFile(response, `factura-${id}.pdf`);
}

export async function getPedidosExcelReport (startDate, endDate, params = {}) {
    const queryParams = new URLSearchParams(params);
    if (startDate) {queryParams.append('startDate', startDate);}
    if (endDate) {queryParams.append('endDate', endDate);}

    const response = await axios.get(`${API_URL}/pedidos-excel?${queryParams.toString()}`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
    });
    downloadFile(response, 'reporte-pedidos.xlsx');
}
