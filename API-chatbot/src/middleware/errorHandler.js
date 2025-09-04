// Clase personalizada para errores de la aplicación
class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware principal de manejo de errores
const errorHandler = (err, req, res, next) => {
  // Log del error
  console.error('🚨 Error capturado:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Error por defecto
  let error = {
    statusCode: err.statusCode || 500,
    message: err.message || 'Error interno del servidor',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    details: err.details || null
  };
  
  // Manejo de errores específicos
  error = handleSpecificErrors(err, error);
  
  // Respuesta según el entorno
  const response = {
    error: error.message,
    code: error.code,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };
  
  // Agregar detalles adicionales en desarrollo
  if (process.env.NODE_ENV === 'development') {
    response.details = error.details;
    response.stack = err.stack;
  }
  
  // Agregar información adicional si existe
  if (error.details) {
    response.additionalInfo = error.details;
  }
  
  res.status(error.statusCode).json(response);
};

// Función para manejar errores específicos
const handleSpecificErrors = (err, defaultError) => {
  // Errores de MySQL
  if (err.code === 'ER_NO_SUCH_TABLE') {
    return {
      statusCode: 500,
      message: 'Error en la estructura de la base de datos',
      code: 'DATABASE_TABLE_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : null
    };
  }
  
  if (err.code === 'ER_DUP_ENTRY') {
    return {
      statusCode: 409,
      message: 'El registro ya existe',
      code: 'DUPLICATE_ENTRY',
      details: process.env.NODE_ENV === 'development' ? err.message : null
    };
  }
  
  if (err.code === 'ECONNREFUSED') {
    return {
      statusCode: 503,
      message: 'Servicio no disponible temporalmente',
      code: 'SERVICE_UNAVAILABLE',
      details: 'Error de conexión con la base de datos'
    };
  }
  
  // Errores de Gemini API
  if (err.message && err.message.includes('API_KEY')) {
    return {
      statusCode: 500,
      message: 'Error de configuración del servicio de IA',
      code: 'AI_CONFIGURATION_ERROR',
      details: null
    };
  }
  
  if (err.message && err.message.includes('QUOTA')) {
    return {
      statusCode: 429,
      message: 'Límite de uso del servicio de IA excedido',
      code: 'AI_QUOTA_EXCEEDED',
      details: 'Intenta de nuevo más tarde'
    };
  }
  
  if (err.message && err.message.includes('SAFETY')) {
    return {
      statusCode: 400,
      message: 'Contenido no permitido por políticas de seguridad',
      code: 'CONTENT_BLOCKED',
      details: 'Por favor reformula tu pregunta'
    };
  }
  
  // Errores de validación de Joi
  if (err.name === 'ValidationError') {
    return {
      statusCode: 400,
      message: 'Datos de entrada inválidos',
      code: 'VALIDATION_ERROR',
      details: err.details
    };
  }
  
  // Errores de timeout
  if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
    return {
      statusCode: 408,
      message: 'Timeout - La operación tardó demasiado',
      code: 'TIMEOUT_ERROR',
      details: 'Intenta de nuevo'
    };
  }
  
  // Errores de JSON malformado
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return {
      statusCode: 400,
      message: 'JSON malformado en el request',
      code: 'INVALID_JSON',
      details: 'Verifica la sintaxis del JSON enviado'
    };
  }
  
  // Errores de rate limiting
  if (err.status === 429) {
    return {
      statusCode: 429,
      message: 'Demasiadas peticiones',
      code: 'RATE_LIMIT_EXCEEDED',
      details: 'Intenta de nuevo más tarde'
    };
  }
  
  return defaultError;
};

// Middleware para rutas no encontradas
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Ruta ${req.originalUrl} no encontrada`,
    404,
    'ROUTE_NOT_FOUND',
    `El endpoint ${req.method} ${req.originalUrl} no existe`
  );
  next(error);
};

// Función para envolver controladores async y capturar errores
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Función para crear errores personalizados
const createError = (message, statusCode = 500, code = null, details = null) => {
  return new AppError(message, statusCode, code, details);
};

// Función para manejar errores no capturados a nivel de proceso
const handleUncaughtExceptions = () => {
  process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
    console.error('Error:', err.name, err.message);
    console.error('Stack:', err.stack);
    
    process.exit(1);
  });
  
  process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down...');
    console.error('Error:', err);
    
    process.exit(1);
  });
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createError,
  handleUncaughtExceptions
};