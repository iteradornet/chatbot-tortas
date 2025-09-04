const Joi = require('joi');

// Schema de validación para mensajes del chat
const chatMessageSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(1000)
    .trim()
    .required()
    .messages({
      'string.empty': 'El mensaje no puede estar vacío',
      'string.min': 'El mensaje debe tener al menos 1 carácter',
      'string.max': 'El mensaje no puede tener más de 1000 caracteres',
      'any.required': 'El mensaje es requerido'
    }),
    
  userId: Joi.string()
    .optional()
    .pattern(/^[a-zA-Z0-9_-]+$/) // Permitir letras, números, guiones y guiones bajos
    .min(3)
    .max(50)
    .messages({
      'string.pattern.base': 'El ID de usuario solo puede contener letras, números, guiones y guiones bajos',
      'string.min': 'El ID de usuario debe tener al menos 3 caracteres',
      'string.max': 'El ID de usuario no puede tener más de 50 caracteres'
    }),
    
  sessionId: Joi.string()
    .optional()
    .uuid()
    .messages({
      'string.uuid': 'El ID de sesión debe ser un UUID válido'
    }),
    
  context: Joi.object({
    previousMessages: Joi.array()
      .items(Joi.string().max(500))
      .max(5)
      .optional()
      .messages({
        'array.max': 'No se pueden enviar más de 5 mensajes previos'
      }),
      
    userPreferences: Joi.object({
      language: Joi.string().valid('es', 'en').optional(),
      responseLength: Joi.string().valid('short', 'medium', 'long').optional()
    }).optional()
  }).optional()
});

// Middleware de validación para requests de chat
const validateChatRequest = (req, res, next) => {
  const { error, value } = chatMessageSchema.validate(req.body, {
    abortEarly: false, // Mostrar todos los errores
    stripUnknown: true, // Remover campos no definidos
    convert: true // Convertir tipos automáticamente
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context.value
    }));
    
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      message: 'Por favor revisa los datos enviados',
      validationErrors: errors,
      code: 'VALIDATION_ERROR'
    });
  }
  
  // Agregar datos validados al request
  req.validatedData = value;
  
  // Sanitizar el mensaje (remover caracteres especiales peligrosos)
  if (req.validatedData.message) {
    req.validatedData.message = sanitizeMessage(req.validatedData.message);
  }
  
  next();
};

// Función para sanitizar mensajes
const sanitizeMessage = (message) => {
  if (typeof message !== 'string') return '';
  
  // Remover caracteres de control y scripts potencialmente peligrosos
  return message
    .replace(/[\x00-\x1f\x7f]/g, '') // Caracteres de control
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Scripts
    .replace(/javascript:/gi, '') // JavaScript URLs
    .replace(/on\w+\s*=/gi, '') // Event handlers
    .trim();
};

// Validación para parámetros de query
const validateQueryParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));
      
      return res.status(400).json({
        error: 'Parámetros de consulta inválidos',
        validationErrors: errors,
        code: 'QUERY_VALIDATION_ERROR'
      });
    }
    
    req.validatedQuery = value;
    next();
  };
};

// Validación para parámetros de ruta
const validateRouteParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));
      
      return res.status(400).json({
        error: 'Parámetros de ruta inválidos',
        validationErrors: errors,
        code: 'PARAMS_VALIDATION_ERROR'
      });
    }
    
    req.validatedParams = value;
    next();
  };
};

// Schema común para paginación
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'La página debe ser un número',
      'number.integer': 'La página debe ser un número entero',
      'number.min': 'La página debe ser mayor a 0'
    }),
    
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'El límite debe ser un número',
      'number.integer': 'El límite debe ser un número entero',
      'number.min': 'El límite debe ser mayor a 0',
      'number.max': 'El límite no puede ser mayor a 100'
    })
});

// Middleware para validar Content-Type
const validateContentType = (expectedTypes = ['application/json']) => {
  return (req, res, next) => {
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      return res.status(400).json({
        error: 'Content-Type requerido',
        message: 'Debe especificar el Content-Type del request',
        expectedTypes,
        code: 'MISSING_CONTENT_TYPE'
      });
    }
    
    const isValidType = expectedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    );
    
    if (!isValidType) {
      return res.status(415).json({
        error: 'Content-Type no soportado',
        message: 'El Content-Type del request no es válido',
        received: contentType,
        expectedTypes,
        code: 'UNSUPPORTED_MEDIA_TYPE'
      });
    }
    
    next();
  };
};

module.exports = {
  validateChatRequest,
  validateQueryParams,
  validateRouteParams,
  validateContentType,
  sanitizeMessage,
  chatMessageSchema,
  paginationSchema
};