const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validateContentType } = require('../middleware/validation');
const chatController = require('../controllers/chatController');

// Aplicar validación de Content-Type a todas las rutas POST
router.use(validateContentType(['application/json']));

// Ruta principal del chat
router.post('/', asyncHandler(async (req, res) => {
  await chatController.processMessage(req, res);
}));

// Ruta para obtener información sobre categorías disponibles
router.get('/categories', (req, res) => {
  res.json({
    categories: [
      {
        id: 'productos',
        name: 'Productos',
        description: 'Información sobre tortas, pasteles, ingredientes, sabores y precios',
        examples: [
          '¿Qué sabores de torta tienen disponibles?',
          '¿Cuál es el precio de una torta de chocolate?',
          '¿Tienen tortas sin gluten?',
          '¿Qué ingredientes usa la torta de vainilla?'
        ]
      },
      {
        id: 'envios',
        name: 'Envíos',
        description: 'Información sobre entregas, zonas de cobertura, tiempos y costos',
        examples: [
          '¿Hacen entregas a domicilio?',
          '¿Cuánto cuesta el envío?',
          '¿A qué zonas entregan?',
          '¿Cuál es el tiempo de entrega?'
        ]
      },
      {
        id: 'medios_pagos',
        name: 'Medios de Pago',
        description: 'Información sobre formas de pago, facturación y políticas',
        examples: [
          '¿Qué formas de pago aceptan?',
          '¿Puedo pagar con tarjeta?',
          '¿Aceptan transferencias bancarias?',
          '¿Emiten facturas?'
        ]
      },
      {
        id: 'creacion_torta',
        name: 'Creación de Tortas',
        description: 'Diseño de tortas personalizadas con inteligencia artificial',
        examples: [
          'Quiero una torta de cumpleaños para niña',
          'Diseña una torta de boda elegante',
          'Torta temática de superhéroes',
          'Torta con decoración floral'
        ]
      }
    ],
    usage: {
      endpoint: 'POST /api/chat',
      format: {
        message: 'string (requerido)',
        userId: 'string (opcional)',
        sessionId: 'uuid (opcional)',
        context: 'object (opcional)'
      }
    }
  });
});

// Ruta para obtener ejemplos de conversación
router.get('/examples', (req, res) => {
  res.json({
    examples: [
      {
        category: 'productos',
        conversation: [
          {
            user: '¿Qué sabores de torta tienen?',
            bot: 'Tenemos una gran variedad de sabores: chocolate, vainilla, fresa, red velvet, zanahoria, limón, y café. También manejamos sabores especiales como dulce de leche y tres leches. ¿Hay algún sabor en particular que te interese?'
          }
        ]
      },
      {
        category: 'envios',
        conversation: [
          {
            user: '¿Entregan a domicilio?',
            bot: 'Sí, realizamos entregas a domicilio en toda la ciudad. El costo del envío varía según la zona: $50 en el centro, $75 en zonas intermedias y $100 en zonas alejadas. El tiempo estimado es de 2-3 horas. ¿A qué zona necesitas el envío?'
          }
        ]
      },
      {
        category: 'medios_pagos',
        conversation: [
          {
            user: '¿Cómo puedo pagar?',
            bot: 'Aceptamos múltiples formas de pago: efectivo, tarjetas de crédito y débito (Visa, Mastercard), transferencias bancarias, y pagos digitales como Mercado Pago. Para pedidos superiores a $500, requerimos un anticipo del 50%. ¿Cuál prefieres?'
          }
        ]
      },
      {
        category: 'creacion_torta',
        conversation: [
          {
            user: 'Quiero una torta para cumpleaños de 5 años',
            bot: 'Te ayudo a diseñar la torta perfecta para ese cumpleaños especial. Basándome en tu solicitud, te propongo una torta colorida con decoración infantil, quizás con figuras de animales o personajes favoritos. ¿Tienes alguna temática específica en mente o colores preferidos?'
          }
        ]
      }
    ],
    tips: [
      'Sé específico en tus preguntas para obtener respuestas más precisas',
      'Puedes preguntar sobre múltiples aspectos en un mismo mensaje',
      'Para tortas personalizadas, menciona ocasión, colores, tamaño y decoración deseada',
      'Si no entiendo tu pregunta, te pediré que seas más específico'
    ]
  });
});

// Ruta para validar formato de mensaje antes de enviar
router.post('/validate', asyncHandler(async (req, res) => {
  // Esta ruta usa el mismo middleware de validación que la ruta principal
  // Si llega aquí, significa que el formato es válido
  
  const { message, userId, sessionId, context } = req.validatedData;
  
  res.json({
    valid: true,
    message: 'Formato de mensaje válido',
    data: {
      messageLength: message.length,
      hasUserId: !!userId,
      hasSessionId: !!sessionId,
      hasContext: !!context,
      estimatedCategory: await require('../controllers/classifierController').classifyMessage(message)
    }
  });
}));

// Ruta para obtener historial de una sesión (función futura)
router.get('/history/:sessionId', asyncHandler(async (req, res) => {
  // Por ahora retorna un placeholder
  res.json({
    sessionId: req.params.sessionId,
    messages: [],
    note: 'Función de historial en desarrollo'
  });
}));

// Ruta para limpiar sesión (función futura)
router.delete('/session/:sessionId', asyncHandler(async (req, res) => {
  res.json({
    message: 'Sesión eliminada correctamente',
    sessionId: req.params.sessionId,
    note: 'Función de sesiones en desarrollo'
  });
}));

// Middleware para logging de requests del chat
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`💬 Chat request: ${req.method} ${req.originalUrl}`);
    if (req.body && req.body.message) {
      console.log(`📝 Message preview: ${req.body.message.substring(0, 100)}${req.body.message.length > 100 ? '...' : ''}`);
    }
  }
  next();
});

module.exports = router;