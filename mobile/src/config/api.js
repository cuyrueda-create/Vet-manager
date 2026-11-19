// CAMBIA la IP por la de tu computadora en la red local
// En Windows: abre cmd y escribe `ipconfig` para ver tu IP
const API_CONFIG = {
  // NOSONAR: IP privada (RFC1918) del emulator/dispositivo en la red local;
  // el backend local no tiene certificado TLS y no es trafico publico.
  baseURL: 'http://10.195.33.178:5000', // NOSONAR
};

export default API_CONFIG;
