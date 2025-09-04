// Constantes de la aplicación
const APP_CONSTANTS = {
  NAME: 'Chatbot API - Tienda de Tortas',
  VERSION: '1.0.0',
  DESCRIPTION: 'API para chatbot especializado en tienda de tortas y repostería'
};

// Categorías de clasificación
const CATEGORIES = {
  PRODUCTS: 'productos',
  SHIPPING: 'envios',
  PAYMENTS: 'medios_pagos',
  CAKE_CREATION: 'creacion_torta',
  INVALID_QUESTION: 'pregunta_no_valida',
  GENERAL: 'general'
};

// Tipos de respuesta
const RESPONSE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Códigos de error
const ERROR_CODES = {
  // Errores de validación
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Errores de base de datos
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR: 'DATABASE_QUERY_ERROR',
  DATABASE_TABLE_ERROR: 'DATABASE_TABLE_ERROR',
  
  // Errores de IA
  GEMINI_API_ERROR: 'GEMINI_API_ERROR',
  GEMINI_QUOTA_EXCEEDED: 'GEMINI_QUOTA_EXCEEDED',
  AI_CONFIGURATION_ERROR: 'AI_CONFIGURATION_ERROR',
  CONTENT_BLOCKED: 'CONTENT_BLOCKED',
  
  // Errores de clasificación
  CLASSIFICATION_ERROR: 'CLASSIFICATION_ERROR',
  INVALID_CATEGORY: 'INVALID_CATEGORY',
  
  // Errores de servicios
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  
  // Errores de red
  CORS_NOT_ALLOWED: 'CORS_NOT_ALLOWED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  
  // Errores generales
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED'
};

// Estados HTTP comunes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNSUPPORTED_MEDIA_TYPE: 415,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Límites de la aplicación
const LIMITS = {
  MESSAGE_MIN_LENGTH: 1,
  MESSAGE_MAX_LENGTH: 1000,
  USER_ID_MIN_LENGTH: 3,
  USER_ID_MAX_LENGTH: 50,
  MAX_CONTEXT_MESSAGES: 5,
  MAX_CONTEXT_MESSAGE_LENGTH: 500,
  DEFAULT_RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutos
  DEFAULT_RATE_LIMIT_MAX: 100,
  DEFAULT_TIMEOUT: 10000, // 10 segundos
  MAX_RESPONSE_LENGTH: 500
};

// Configuraciones por defecto
const DEFAULTS = {
  ENVIRONMENT: 'development',
  PORT: 3000,
  DATABASE_PORT: 3306,
  GEMINI_MODEL: 'gemini-1.5-flash',
  LOG_LEVEL: 'info'
};

// Mensajes predefinidos
const MESSAGES = {
  // Mensajes de éxito
  SUCCESS: {
    MESSAGE_PROCESSED: 'Mensaje procesado exitosamente',
    CLASSIFICATION_COMPLETED: 'Clasificación completada',
    SERVICE_HEALTHY: 'Servicio funcionando correctamente'
  },
  
  // Mensajes de error por defecto
  ERROR: {
    DEFAULT: 'Lo siento, no pude procesar tu pregunta en este momento. ¿Podrías intentar de nuevo?',
    INVALID_QUESTION: 'No logré entender tu pregunta. ¿Podrías ser más específico sobre productos, envíos, medios de pago o creación de tortas?',
    DATABASE_ERROR: 'Tengo problemas para acceder a la información. Intenta de nuevo en unos momentos.',
    AI_ERROR: 'Estoy teniendo dificultades para generar una respuesta. Por favor, intenta reformular tu pregunta.',
    TIMEOUT: 'La consulta está tardando más de lo normal. Por favor, intenta de nuevo.',
    SERVICE_DOWN: 'El servicio no está disponible temporalmente. Disculpa las molestias.'
  },
  
  // Mensajes de bienvenida
  WELCOME: {
    GENERAL: '¡Hola! Soy tu asistente virtual especializado en tortas y repostería. ¿En qué puedo ayudarte hoy?',
    FIRST_TIME: 'Te doy la bienvenida a nuestra tienda de tortas. Puedo ayudarte con información sobre productos, envíos, medios de pago y diseño de tortas personalizadas.',
    RETURN: '¡Qué bueno verte de nuevo! ¿En qué puedo ayudarte esta vez?'
  },
  
  // Sugerencias por categoría
  SUGGESTIONS: {
    PRODUCTS: [
      '¿Qué sabores de torta tienen disponibles?',
      '¿Cuál es el precio de una torta de chocolate?',
      '¿Tienen tortas sin gluten?',
      '¿Qué ingredientes usa la torta de vainilla?'
    ],
    SHIPPING: [
      '¿Hacen entregas a domicilio?',
      '¿Cuánto cuesta el envío?',
      '¿A qué zonas entregan?',
      '¿Cuál es el tiempo de entrega?'
    ],
    PAYMENTS: [
      '¿Qué formas de pago aceptan?',
      '¿Puedo pagar con tarjeta?',
      '¿Aceptan transferencias bancarias?',
      '¿Emiten facturas?'
    ],
    CAKE_CREATION: [
      'Quiero una torta de cumpleaños para niña',
      'Diseña una torta de boda elegante',
      'Torta temática de superhéroes',
      'Torta con decoración floral'
    ]
  }
};

// Configuraciones de tiempo
const TIMEOUTS = {
  DATABASE_CONNECTION: 60000, // 60 segundos
  GEMINI_REQUEST: 30000, // 30 segundos
  DEFAULT_REQUEST: 10000, // 10 segundos
  HEALTH_CHECK: 5000 // 5 segundos
};

// Patrones de validación
const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  SAFE_STRING: /^[a-zA-Z0-9\s\-\_\.\,\!\?]+$/
};

// Configuraciones de logging
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

// Emojis para logging (opcional)
const EMOJIS = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  ROBOT: '🤖',
  CAKE: '🎂',
  TRUCK: '🚚',
  MONEY: '💳',
  SEARCH: '🔍',
  CLOCK: '⏰',
  FIRE: '🔥',
  ROCKET: '🚀',
  GLOBE: '🌍',
  DATABASE: '📊',
  AI: '🧠'
};

// Configuraciones de cache (para uso futuro)
const CACHE = {
  DEFAULT_TTL: 300, // 5 minutos
  PRODUCT_TTL: 600, // 10 minutos
  SHIPPING_TTL: 1800, // 30 minutos
  PAYMENT_TTL: 3600, // 1 hora
  CONFIG_TTL: 86400 // 24 horas
};

// Configuraciones de paginación
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
};

// Formatos de fecha
const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss',
  DISPLAY: 'DD/MM/YYYY HH:mm',
  SHORT: 'DD/MM/YY'
};

// Configuraciones de archivos (para uso futuro)
const FILES = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  UPLOAD_PATH: '/uploads/',
  TEMP_PATH: '/tmp/'
};

// Configuraciones de seguridad
const SECURITY = {
  BCRYPT_ROUNDS: 12,
  JWT_EXPIRES_IN: '24h',
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutos
  PASSWORD_MIN_LENGTH: 8
};

module.exports = {
  APP_CONSTANTS,
  CATEGORIES,
  RESPONSE_TYPES,
  ERROR_CODES,
  HTTP_STATUS,
  LIMITS,
  DEFAULTS,
  MESSAGES,
  TIMEOUTS,
  VALIDATION_PATTERNS,
  LOG_LEVELS,
  EMOJIS,
  CACHE,
  PAGINATION,
  DATE_FORMATS,
  FILES,
  SECURITY
};