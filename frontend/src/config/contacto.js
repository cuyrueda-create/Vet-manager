// frontend/src/config/contacto.js
const CONTACTO = {
  email: import.meta.env.VITE_CONTACT_EMAIL || 'cuyrueda@gmail.com',
  telefono: import.meta.env.VITE_CONTACT_PHONE || '3224327558',
  ubicacion: import.meta.env.VITE_CONTACT_LOCATION || 'Soacha, Colombia',
  nombre: import.meta.env.VITE_APP_NAME || 'Vet Manager',
  anio: new Date().getFullYear()
};

export default CONTACTO;