const cors = require('cors');

// ⚠️ CONFIGURACIÓN ABIERTA - PERMITE ACCESO DESDE CUALQUIER ORIGEN
// Para producción, considera restringir los orígenes por seguridad

const corsOptions = {
  origin: true, // Permite TODOS los orígenes
  
  methods: [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'OPTIONS',
    'HEAD'
  ],
  
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-API-Key'
  ],
  
  exposedHeaders: [
    'X-Total-Count',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ],
  
  credentials: false, // No necesitamos cookies para el chatbot
  
  preflightContinue: false,
  
  optionsSuccessStatus: 204, // Para soporte de navegadores legacy
  
  maxAge: 86400 // 24 horas de cache para preflight
};

// Aplicar CORS directamente - EXPORTAR LA FUNCIÓN MIDDLEWARE
const corsMiddleware = cors(corsOptions);

// Funciones de utilidad (mantenidas para compatibilidad)
const addAllowedOrigin = (origin) => {
  console.log(`ℹ️ CORS está configurado para permitir todos los orígenes. Origin ${origin} ya está permitido.`);
};

const removeAllowedOrigin = (origin) => {
  console.log(`ℹ️ CORS está configurado para permitir todos los orígenes. No se puede remover ${origin}.`);
};

const getAllowedOrigins = () => {
  return ['*']; // Indica que todos los orígenes están permitidos
};

module.exports = corsMiddleware; // ✅ EXPORTAR DIRECTAMENTE EL MIDDLEWARE

// También exportar las funciones auxiliares si las necesitas
module.exports.corsMiddleware = corsMiddleware;
module.exports.addAllowedOrigin = addAllowedOrigin;
module.exports.removeAllowedOrigin = removeAllowedOrigin;
module.exports.getAllowedOrigins = getAllowedOrigins;