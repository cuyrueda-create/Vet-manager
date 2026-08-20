const CONTACTO = {
  email: import.meta.env.VITE_CONTACT_EMAIL || 'contacto@vetmanager.com',
  telefono: import.meta.env.VITE_CONTACT_PHONE || '(601) 000-0000',
  ubicacion: import.meta.env.VITE_CONTACT_LOCATION || 'Bogotá, Colombia',
  nombre: import.meta.env.VITE_APP_NAME || 'Vet-Manager',
  anio: new Date().getFullYear()
};

export default CONTACTO;