const { RESPONSE_TYPES, HTTP_STATUS, ERROR_CODES, MESSAGES, CATEGORIES } = require('./constants');

/**
 * Crea una respuesta exitosa estandarizada
 * @param {Object} data - Datos de la respuesta
 * @param {string} message - Mensaje opcional
 * @param {Object} metadata - Metadatos adicionales
 * @returns {Object} - Respuesta formateada
 */
const createSuccessResponse = (data, message = null, metadata = {}) => {
  return {
    success: true,
    type: RESPONSE_TYPES.SUCCESS,
    message: message || MESSAGES.SUCCESS.MESSAGE_PROCESSED,
    data: data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };
};

/**
 * Crea una respuesta de error estandarizada
 * @param {string} message - Mensaje de error
 * @param {string} code - Código de error
 * @param {number} statusCode - Código HTTP
 * @param {Object} details - Detalles adicionales
 * @returns {Object} - Respuesta de error formateada
 */
const createErrorResponse = (message, code = ERROR_CODES.INTERNAL_SERVER_ERROR, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, details = null) => {
  return {
    success: false,
    type: RESPONSE_TYPES.ERROR,
    error: message || MESSAGES.ERROR.DEFAULT,
    code: code,
    statusCode: statusCode,
    details: details,
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Crea respuesta de validación de error
 * @param {Array} validationErrors - Errores de validación
 * @returns {Object} - Respuesta de error de validación
 */
const createValidationErrorResponse = (validationErrors) => {
  return {
    success: false,
    type: RESPONSE_TYPES.ERROR,
    error: 'Datos de entrada inválidos',
    code: ERROR_CODES.VALIDATION_ERROR,
    statusCode: HTTP_STATUS.BAD_REQUEST,
    validationErrors: validationErrors,
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Crea respuesta para pregunta no válida
 * @param {Object} classification - Resultado de clasificación
 * @returns {Object} - Respuesta formateada
 */
const createInvalidQuestionResponse = (classification) => {
  const suggestions = classification.suggestions || MESSAGES.SUGGESTIONS.PRODUCTS.concat(
    MESSAGES.SUGGESTIONS.SHIPPING.slice(0, 2)
  );
  
  return createSuccessResponse(
    {
      message: MESSAGES.ERROR.INVALID_QUESTION,
      suggestions: suggestions,
      categories: [
        'Productos y sabores',
        'Envíos y entregas',
        'Medios de pago',
        'Tortas personalizadas'
      ]
    },
    'Pregunta no válida - Se proporcionan sugerencias',
    {
      category: CATEGORIES.INVALID_QUESTION,
      confidence: classification.confidence || 0.8,
      reason: classification.reason || 'Pregunta no clasificable'
    }
  );
};

/**
 * Crea respuesta de chat exitosa
 * @param {string} botMessage - Mensaje del bot
 * @param {string} category - Categoría clasificada
 * @param {number} confidence - Nivel de confianza
 * @param {Object} additionalInfo - Información adicional
 * @param {Object} processingInfo - Información de procesamiento
 * @returns {Object} - Respuesta de chat formateada
 */
const createChatResponse = (botMessage, category, confidence, additionalInfo = null, processingInfo = {}) => {
  return {
    success: true,
    message: botMessage,
    category: category,
    confidence: confidence,
    additionalInfo: additionalInfo,
    metadata: {
      timestamp: new Date().toISOString(),
      processingTime: processingInfo.processingTime || null,
      userId: processingInfo.userId || null,
      sessionId: processingInfo.sessionId || null
    }
  };
};

/**
 * Crea respuesta de health check
 * @param {boolean} healthy - Estado de salud
 * @param {Object} services - Estado de servicios
 * @returns {Object} - Respuesta de health check
 */
const createHealthResponse = (healthy, services = {}) => {
  const statusCode = healthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;
  
  return {
    status: healthy ? 'healthy' : 'unhealthy',
    message: healthy ? 'Servicio funcionando correctamente' : 'Algunos servicios presentan problemas',
    services: services,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  };
};

/**
 * Crea respuesta de información de categorías
 * @returns {Object} - Respuesta con información de categorías
 */
const createCategoriesInfoResponse = () => {
  return createSuccessResponse({
    categories: [
      {
        id: CATEGORIES.PRODUCTS,
        name: 'Productos',
        description: 'Información sobre tortas, pasteles, ingredientes, sabores y precios',
        examples: MESSAGES.SUGGESTIONS.PRODUCTS
      },
      {
        id: CATEGORIES.SHIPPING,
        name: 'Envíos',
        description: 'Información sobre entregas, zonas de cobertura, tiempos y costos',
        examples: MESSAGES.SUGGESTIONS.SHIPPING
      },
      {
        id: CATEGORIES.PAYMENTS,
        name: 'Medios de Pago',
        description: 'Información sobre formas de pago, facturación y políticas',
        examples: MESSAGES.SUGGESTIONS.PAYMENTS
      },
      {
        id: CATEGORIES.CAKE_CREATION,
        name: 'Creación de Tortas',
        description: 'Diseño de tortas personalizadas con inteligencia artificial',
        examples: MESSAGES.SUGGESTIONS.CAKE_CREATION
      }
    ]
  }, 'Categorías disponibles');
};

/**
 * Crea respuesta de rate limit
 * @param {number} windowMs - Ventana de tiempo en ms
 * @param {number} maxRequests - Máximo de requests
 * @returns {Object} - Respuesta de rate limit
 */
const createRateLimitResponse = (windowMs, maxRequests) => {
  return createErrorResponse(
    `Demasiadas peticiones. Máximo ${maxRequests} requests cada ${Math.round(windowMs / 60000)} minutos.`,
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    HTTP_STATUS.TOO_MANY_REQUESTS,
    {
      windowMs: windowMs,
      maxRequests: maxRequests,
      retryAfter: Math.round(windowMs / 1000)
    }
  );
};

/**
 * Crea respuesta de timeout
 * @param {string} operation - Operación que hizo timeout
 * @returns {Object} - Respuesta de timeout
 */
const createTimeoutResponse = (operation = 'operación') => {
  return createErrorResponse(
    `La ${operation} tardó más de lo esperado. Por favor, intenta de nuevo.`,
    ERROR_CODES.TIMEOUT_ERROR,
    HTTP_STATUS.REQUEST_TIMEOUT,
    { operation: operation }
  );
};

/**
 * Crea respuesta de servicio no disponible
 * @param {string} service - Nombre del servicio
 * @returns {Object} - Respuesta de servicio no disponible
 */
const createServiceUnavailableResponse = (service = 'servicio') => {
  return createErrorResponse(
    `El ${service} no está disponible temporalmente. Por favor, intenta más tarde.`,
    ERROR_CODES.SERVICE_UNAVAILABLE,
    HTTP_STATUS.SERVICE_UNAVAILABLE,
    { service: service }
  );
};

/**
 * Crea respuesta de base de datos no disponible
 * @returns {Object} - Respuesta de BD no disponible
 */
const createDatabaseErrorResponse = () => {
  return createErrorResponse(
    MESSAGES.ERROR.DATABASE_ERROR,
    ERROR_CODES.DATABASE_CONNECTION_ERROR,
    HTTP_STATUS.SERVICE_UNAVAILABLE,
    { service: 'database' }
  );
};

/**
 * Crea respuesta de error de IA
 * @param {string} details - Detalles del error
 * @returns {Object} - Respuesta de error de IA
 */
const createAIErrorResponse = (details = null) => {
  return createErrorResponse(
    MESSAGES.ERROR.AI_ERROR,
    ERROR_CODES.GEMINI_API_ERROR,
    HTTP_STATUS.SERVICE_UNAVAILABLE,
    { service: 'gemini_ai', details: details }
  );
};

/**
 * Formatea respuesta de productos
 * @param {Array} products - Lista de productos
 * @param {Object} metadata - Metadatos adicionales
 * @returns {Object} - Respuesta formateada de productos
 */
const formatProductsResponse = (products, metadata = {}) => {
  return {
    products: products.map(product => ({
      id: product.id,
      name: product.name || product.nombre,
      description: product.description || product.descripcion,
      price: product.price || product.precio,
      flavor: product.flavor || product.sabor,
      available: product.available !== undefined ? product.available : true,
      image: product.image || product.imagen || null
    })),
    total: products.length,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };
};

/**
 * Formatea respuesta de envíos
 * @param {Array} zones - Zonas de entrega
 * @param {Object} costs - Costos por zona
 * @param {Object} metadata - Metadatos adicionales
 * @returns {Object} - Respuesta formateada de envíos
 */
const formatShippingResponse = (zones, costs = {}, metadata = {}) => {
  return {
    zones: zones.map(zone => ({
      name: zone.name || zone.nombre,
      cost: zone.cost || zone.costo,
      time: zone.time || zone.tiempo,
      description: zone.description || zone.descripcion
    })),
    costs: costs,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };
};

/**
 * Formatea respuesta de medios de pago
 * @param {Array} methods - Métodos de pago
 * @param {Object} policies - Políticas de pago
 * @param {Object} metadata - Metadatos adicionales
 * @returns {Object} - Respuesta formateada de pagos
 */
const formatPaymentResponse = (methods, policies = {}, metadata = {}) => {
  return {
    methods: methods.map(method => ({
      name: method.name || method.nombre,
      description: method.description || method.descripcion,
      type: method.type || method.tipo,
      fee: method.fee || method.comision || 0,
      active: method.active !== undefined ? method.active : true
    })),
    policies: policies,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };
};

/**
 * Formatea respuesta de creación de torta
 * @param {Object} cakeDesign - Diseño de torta
 * @param {Object} metadata - Metadatos adicionales
 * @returns {Object} - Respuesta formateada de torta
 */
const formatCakeResponse = (cakeDesign, metadata = {}) => {
  return {
    description: cakeDesign.description,
    design: cakeDesign.design,
    specifications: cakeDesign.specifications,
    estimatedPrice: cakeDesign.estimatedPrice,
    imageUrl: cakeDesign.imageUrl,
    suggestions: cakeDesign.suggestions || [],
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };
};

/**
 * Wrapper para respuestas con paginación
 * @param {Array} data - Datos a paginar
 * @param {number} page - Página actual
 * @param {number} limit - Elementos por página
 * @param {number} total - Total de elementos
 * @returns {Object} - Respuesta con paginación
 */
const createPaginatedResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return createSuccessResponse(data, 'Datos obtenidos correctamente', {
    pagination: {
      currentPage: page,
      itemsPerPage: limit,
      totalItems: total,
      totalPages: totalPages,
      hasNext: hasNext,
      hasPrev: hasPrev,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null
    }
  });
};

module.exports = {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createInvalidQuestionResponse,
  createChatResponse,
  createHealthResponse,
  createCategoriesInfoResponse,
  createRateLimitResponse,
  createTimeoutResponse,
  createServiceUnavailableResponse,
  createDatabaseErrorResponse,
  createAIErrorResponse,
  formatProductsResponse,
  formatShippingResponse,
  formatPaymentResponse,
  formatCakeResponse,
  createPaginatedResponse
};