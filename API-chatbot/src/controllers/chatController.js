const { classifyMessage } = require('./classifierController');
const { createError } = require('../middleware/errorHandler');
const productService = require('../services/productService');
const shippingService = require('../services/shippingService');
const paymentService = require('../services/paymentService');
const cakeService = require('../services/cakeService');
const geminiService = require('../services/geminiService');

/**
 * Procesa un mensaje del usuario y devuelve la respuesta apropiada
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const processMessage = async (req, res) => {
  const startTime = Date.now();
  
  console.log('🤖 [MAIN-DEBUG] === INICIANDO PROCESAMIENTO DE MENSAJE ===');
  
  try {
    // Los datos ya fueron validados por el middleware
    const { message, userId, sessionId, context } = req.validatedData;
    
    console.log(`🤖 [MAIN-DEBUG] Mensaje recibido: "${message}"`);
    console.log(`🤖 [MAIN-DEBUG] Usuario ID: ${userId}`);
    
    // Paso 1: Clasificar el mensaje
    console.log('🤖 [MAIN-DEBUG] === PASO 1: CLASIFICACIÓN ===');
    const classification = await classifyMessage(message, true);
    console.log(`🤖 [MAIN-DEBUG] Categoría clasificada: ${classification.category}`);
    console.log(`🤖 [MAIN-DEBUG] Confianza: ${classification.confidence}`);
    console.log(`🤖 [MAIN-DEBUG] Clasificación completa:`, JSON.stringify(classification, null, 2));
    
    // Paso 2: Procesar según la categoría
    console.log('🤖 [MAIN-DEBUG] === PASO 2: PROCESAMIENTO POR CATEGORÍA ===');
    let response;
    const processingTime = Date.now() - startTime;
    
    switch (classification.category) {
      case 'productos':
        console.log('🤖 [MAIN-DEBUG] ➡️ Enviando a handleProductsQuery');
        response = await handleProductsQuery(message, context);
        break;
        
      case 'envios':
        console.log('🤖 [MAIN-DEBUG] ➡️ Enviando a handleShippingQuery');
        response = await handleShippingQuery(message, context);
        break;
        
      case 'medios_pagos':
        console.log('🤖 [MAIN-DEBUG] ➡️ Enviando a handlePaymentQuery');
        response = await handlePaymentQuery(message, context);
        break;
        
      case 'creacion_torta':
        console.log('🤖 [MAIN-DEBUG] ➡️ Enviando a handleCakeCreationQuery');
        response = await handleCakeCreationQuery(message, context);
        break;
        
      case 'pregunta_no_valida':
        console.log('🤖 [MAIN-DEBUG] ➡️ Enviando a handleInvalidQuery');
        response = await handleInvalidQuery(message, classification);
        break;
        
      default:
        console.log('🤖 [MAIN-DEBUG] ➡️ Enviando a handleGeneralQuery (default)');
        response = await handleGeneralQuery(message, context);
    }
    
    console.log('🤖 [MAIN-DEBUG] === RESPUESTA DEL HANDLER ===');
    console.log('🤖 [MAIN-DEBUG] Servicio usado:', response.service);
    console.log('🤖 [MAIN-DEBUG] Longitud del mensaje:', response.message?.length);
    console.log('🤖 [MAIN-DEBUG] Tiene additionalInfo:', !!response.additionalInfo);
    
    // Paso 3: Preparar respuesta final
    const totalTime = Date.now() - startTime;
    
    const finalResponse = {
      success: true,
      message: response.message,
      category: classification.category,
      confidence: classification.confidence,
      additionalInfo: response.additionalInfo || null,
      metadata: {
        processingTime: totalTime,
        classificationTime: processingTime,
        timestamp: new Date().toISOString(),
        userId: userId || null,
        sessionId: sessionId || null
      }
    };
    
    // Agregar información de debug en desarrollo
    if (process.env.NODE_ENV === 'development') {
      finalResponse.debug = {
        classification: classification,
        keywordMatches: classification.keywordMatches || null,
        serviceUsed: response.service || 'unknown'
      };
    }
    
    console.log(`🤖 [MAIN-DEBUG] === RESPUESTA FINAL PREPARADA ===`);
    console.log(`🤖 [MAIN-DEBUG] Tiempo total: ${totalTime}ms`);
    console.log(`🤖 [MAIN-DEBUG] Categoría final: ${finalResponse.category}`);
    console.log(`🤖 [MAIN-DEBUG] Success: ${finalResponse.success}`);
    
    res.json(finalResponse);
    
  } catch (error) {
    console.error('❌ [MAIN-DEBUG] Error procesando mensaje:', error);
    console.error('❌ [MAIN-DEBUG] Stack trace:', error.stack);
    
    const errorResponse = {
      success: false,
      error: error.message || process.env.DEFAULT_ERROR_MESSAGE,
      code: error.code || 'PROCESSING_ERROR',
      category: 'error',
      metadata: {
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        userId: req.validatedData?.userId || null,
        sessionId: req.validatedData?.sessionId || null
      }
    };
    
    // En desarrollo, agregar más detalles del error
    if (process.env.NODE_ENV === 'development') {
      errorResponse.debug = {
        stack: error.stack,
        originalMessage: req.validatedData?.message
      };
    }
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json(errorResponse);
  }
};

/**
 * Maneja consultas sobre productos
 */
const handleProductsQuery = async (message, context) => {
  try {
    console.log('🎂 Procesando consulta de productos');
    
    const productInfo = await productService.getProductInformation(message);
    const aiResponse = await geminiService.generateProductResponse(message, productInfo);
    
    return {
      message: aiResponse.text,
      additionalInfo: {
        products: productInfo.products || [],
        suggestions: productInfo.suggestions || []
      },
      service: 'products'
    };
    
  } catch (error) {
    console.error('Error en consulta de productos:', error);
    return {
      message: 'Disculpa, tengo problemas para acceder a la información de productos en este momento. ¿Podrías intentar de nuevo?',
      service: 'products',
      error: error.message
    };
  }
};

/**
 * Maneja consultas sobre envíos
 */
const handleShippingQuery = async (message, context) => {
  try {
    console.log('🚚 Procesando consulta de envíos');
    
    const shippingInfo = await shippingService.getShippingInformation(message);
    const aiResponse = await geminiService.generateShippingResponse(message, shippingInfo);
    
    return {
      message: aiResponse.text,
      additionalInfo: {
        zones: shippingInfo.zones || [],
        costs: shippingInfo.costs || {},
        timeEstimates: shippingInfo.timeEstimates || {}
      },
      service: 'shipping'
    };
    
  } catch (error) {
    console.error('Error en consulta de envíos:', error);
    return {
      message: 'Disculpa, no puedo acceder a la información de envíos ahora. Te recomiendo contactarnos directamente para obtener detalles de entrega.',
      service: 'shipping',
      error: error.message
    };
  }
};

/**
 * Maneja consultas sobre medios de pago
 */
const handlePaymentQuery = async (message, context) => {
  try {
    console.log('💳 Procesando consulta de pagos');
    
    const paymentInfo = await paymentService.getPaymentInformation(message);
    const aiResponse = await geminiService.generatePaymentResponse(message, paymentInfo);
    
    return {
      message: aiResponse.text,
      additionalInfo: {
        methods: paymentInfo.methods || [],
        policies: paymentInfo.policies || {},
        requirements: paymentInfo.requirements || []
      },
      service: 'payments'
    };
    
  } catch (error) {
    console.error('Error en consulta de pagos:', error);
    return {
      message: 'Tengo dificultades para acceder a la información de medios de pago. Por favor, contáctanos directamente para conocer las opciones disponibles.',
      service: 'payments',
      error: error.message
    };
  }
};

/**
 * Maneja solicitudes de creación de tortas
 */
const handleCakeCreationQuery = async (message, context) => {
  try {
    console.log('🎨 Procesando creación de torta');
    
    const cakeDesign = await cakeService.createCakeDesign(message);
    
    return {
      message: cakeDesign.description,
      additionalInfo: {
        design: cakeDesign.design || {},
        imageUrl: cakeDesign.imageUrl || null,
        specifications: cakeDesign.specifications || {},
        estimatedPrice: cakeDesign.estimatedPrice || null
      },
      service: 'cake_creation'
    };
    
  } catch (error) {
    console.error('Error en creación de torta:', error);
    return {
      message: 'Me gustaría ayudarte a diseñar tu torta personalizada, pero tengo problemas técnicos en este momento. ¿Podrías describirme qué tipo de torta necesitas y te ayudo con ideas generales?',
      service: 'cake_creation',
      error: error.message
    };
  }
};

/**
 * Maneja preguntas no válidas
 */
const handleInvalidQuery = async (message, classification) => {
  console.log('❓ Procesando pregunta no válida');
  
  const suggestions = classification.suggestions || [
    'Pregunta sobre nuestros productos: "¿Qué sabores de torta tienen?"',
    'Consulta sobre envíos: "¿Hacen entregas a domicilio?"',
    'Información de pagos: "¿Qué formas de pago aceptan?"',
    'Diseño personalizado: "Quiero una torta de cumpleaños especial"'
  ];
  
  let responseMessage = process.env.INVALID_QUESTION_MESSAGE || 
    'No logré entender tu pregunta. ¿Podrías ser más específico?';
  
  // Personalizar respuesta según el motivo
  if (classification.reason === 'Mensaje muy corto o saludo') {
    responseMessage = '¡Hola! Soy tu asistente virtual para tortas y repostería. ¿En qué puedo ayudarte hoy?';
  }
  
  return {
    message: responseMessage,
    additionalInfo: {
      suggestions: suggestions,
      categories: [
        'Productos y sabores',
        'Envíos y entregas', 
        'Medios de pago',
        'Tortas personalizadas'
      ]
    },
    service: 'invalid_handler'
  };
};

/**
 * Maneja consultas generales
 */
const handleGeneralQuery = async (message, context) => {
  try {
    console.log('💬 Procesando consulta general');
    
    const aiResponse = await geminiService.generateGeneralResponse(message);
    
    return {
      message: aiResponse.text,
      additionalInfo: {
        canHelp: [
          'Información sobre productos',
          'Detalles de envío',
          'Medios de pago',
          'Diseño de tortas personalizadas'
        ]
      },
      service: 'general'
    };
    
  } catch (error) {
    console.error('Error en consulta general:', error);
    return {
      message: '¡Hola! Soy tu asistente virtual especializado en tortas y repostería. Puedo ayudarte con información sobre productos, envíos, medios de pago y diseño de tortas personalizadas. ¿En qué te gustaría que te ayude?',
      service: 'general',
      error: error.message
    };
  }
};

module.exports = {
  processMessage,
  handleProductsQuery,
  handleShippingQuery,
  handlePaymentQuery,
  handleCakeCreationQuery,
  handleInvalidQuery,
  handleGeneralQuery
};