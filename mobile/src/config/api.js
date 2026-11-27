// URL de la API. En local se puede usar una IP privada; en producción se
// usa la URL pública de Render. Override con EXPO_PUBLIC_API_URL.
const configurado = process.env.EXPO_PUBLIC_API_URL;

const baseURL = configurado
  ? configurado.replace(/\/$/, '')
  : 'https://vet-manager-api.onrender.com';

const API_CONFIG = { baseURL };

export default API_CONFIG;
