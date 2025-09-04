const { generateText, generateImage, systemPrompts } = require('../config/gemini');
const { createError } = require('../middleware/errorHandler');

/**
 * Genera respuesta sobre productos usando Gemini
 * @param {string} userMessage - Mensaje del usuario
 * @param {Object} productInfo - Información de productos de la BD
 * @returns {Promise<Object>} - Respuesta generada
 */
const generateProductResponse = async (userMessage, productInfo) => {
  try {
    const context = buildProductContext(productInfo);
    const prompt = `${systemPrompts.products}\n\n${context}\n\nPregunta del usuario: ${userMessage}`;
    
    const result = await generateText(prompt);
    
    if (!result.success) {
      throw createError(result.error, 500, 'GEMINI_PRODUCT_ERROR');
    }
    
    return {
      text: result.text,
      usage: result.usage,
      context: 'products'
    };
    
  } catch (error) {
    console.error('Error generando respuesta de productos:', error);
    throw error;
  }
};

/**
 * Genera respuesta sobre envíos usando Gemini
 */
const generateShippingResponse = async (userMessage, shippingInfo) => {
  try {
    const context = buildShippingContext(shippingInfo);
    const prompt = `${systemPrompts.shipping}\n\n${context}\n\nPregunta del usuario: ${userMessage}`;
    
    const result = await generateText(prompt);
    
    if (!result.success) {
      throw createError(result.error, 500, 'GEMINI_SHIPPING_ERROR');
    }
    
    return {
      text: result.text,
      usage: result.usage,
      context: 'shipping'
    };
    
  } catch (error) {
    console.error('Error generando respuesta de envíos:', error);
    throw error;
  }
};

/**
 * Genera respuesta sobre medios de pago usando Gemini
 */
const generatePaymentResponse = async (userMessage, paymentInfo) => {
  try {
    const context = buildPaymentContext(paymentInfo);
    const prompt = `${systemPrompts.payments}\n\n${context}\n\nPregunta del usuario: ${userMessage}`;
    
    const result = await generateText(prompt);
    
    if (!result.success) {
      throw createError(result.error, 500, 'GEMINI_PAYMENT_ERROR');
    }
    
    return {
      text: result.text,
      usage: result.usage,
      context: 'payments'
    };
    
  } catch (error) {
    console.error('Error generando respuesta de pagos:', error);
    throw error;
  }
};

/**
 * Genera descripción de torta personalizada
 */
const generateCakeDescription = async (userMessage) => {
  try {
    const prompt = `${systemPrompts.cakes}\n\nSolicitud del cliente: ${userMessage}\n\nCrea una descripción detallada y atractiva de la torta personalizada, incluyendo:\n- Diseño y decoración\n- Colores sugeridos\n- Elementos decorativos\n- Tamaño recomendado\n- Ocasión específica\n\nMantén un tono creativo pero profesional.`;
    
    const result = await generateText(prompt);
    
    if (!result.success) {
      throw createError(result.error, 500, 'GEMINI_CAKE_ERROR');
    }
    
    return {
      text: result.text,
      usage: result.usage,
      context: 'cake_creation'
    };
    
  } catch (error) {
    console.error('Error generando descripción de torta:', error);
    throw error;
  }
};

/**
 * Genera respuesta general
 */
const generateGeneralResponse = async (userMessage) => {
  try {
    const prompt = `${systemPrompts.general}\n\nMensaje del usuario: ${userMessage}\n\nResponde de manera amigable y profesional, y si es posible, dirige la conversación hacia alguna de nuestras especialidades (productos, envíos, pagos, o tortas personalizadas).`;
    
    const result = await generateText(prompt);
    
    if (!result.success) {
      throw createError(result.error, 500, 'GEMINI_GENERAL_ERROR');
    }
    
    return {
      text: result.text,
      usage: result.usage,
      context: 'general'
    };
    
  } catch (error) {
    console.error('Error generando respuesta general:', error);
    throw error;
  }
};

/**
 * Genera imagen de torta (función futura)
 */
const generateCakeImage = async (description) => {
  try {
    console.log('🎨 Generando imagen de torta:', description);
    
    // Por ahora usa la función placeholder de config/gemini.js
    const result = await generateImage(description);
    
    return result;
    
  } catch (error) {
    console.error('Error generando imagen de torta:', error);
    return {
      success: false,
      error: error.message,
      imageUrl: 'https://via.placeholder.com/400x400/FFB6C1/000000?text=Torta+Personalizada'
    };
  }
};

/**
 * Construye contexto para productos
 */
const buildProductContext = (productInfo) => {
  if (!productInfo || Object.keys(productInfo).length === 0) {
    return `INFORMACIÓN DE PRODUCTOS:
No se pudo obtener información específica de la base de datos.
Por favor, proporciona información general sobre productos de repostería.`;
  }
  
  let context = 'INFORMACIÓN DE PRODUCTOS DISPONIBLES:\n\n';
  
  if (productInfo.products && productInfo.products.length > 0) {
    context += 'PRODUCTOS:\n';
    productInfo.products.forEach(product => {
      context += `- ${product.name || product.nombre}: `;
      context += `$${product.price || product.precio || 'Consultar'} `;
      context += `(${product.description || product.descripcion || 'Sin descripción'})\n`;
    });
    context += '\n';
  }
  
  if (productInfo.categories && productInfo.categories.length > 0) {
    context += 'CATEGORÍAS:\n';
    productInfo.categories.forEach(cat => {
      context += `- ${cat.name || cat.nombre}\n`;
    });
    context += '\n';
  }
  
  if (productInfo.flavors && productInfo.flavors.length > 0) {
    context += 'SABORES DISPONIBLES:\n';
    productInfo.flavors.forEach(flavor => {
      context += `- ${flavor.name || flavor.nombre}\n`;
    });
    context += '\n';
  }
  
  return context;
};

/**
 * Construye contexto para envíos
 */
const buildShippingContext = (shippingInfo) => {
  if (!shippingInfo || Object.keys(shippingInfo).length === 0) {
    return `INFORMACIÓN DE ENVÍOS:
No se pudo obtener información específica de envíos.
Por favor, proporciona información general sobre entregas.`;
  }
  
  let context = 'INFORMACIÓN DE ENVÍOS Y ENTREGAS:\n\n';
  
  if (shippingInfo.zones && shippingInfo.zones.length > 0) {
    context += 'ZONAS DE ENTREGA:\n';
    shippingInfo.zones.forEach(zone => {
      context += `- ${zone.name || zone.nombre}: $${zone.cost || zone.costo || 'Consultar'} `;
      context += `(${zone.time || zone.tiempo || 'Tiempo a consultar'})\n`;
    });
    context += '\n';
  }
  
  if (shippingInfo.policies && Object.keys(shippingInfo.policies).length > 0) {
    context += 'POLÍTICAS DE ENVÍO:\n';
    Object.entries(shippingInfo.policies).forEach(([key, value]) => {
      context += `- ${key}: ${value}\n`;
    });
    context += '\n';
  }
  
  if (shippingInfo.timeEstimates && Object.keys(shippingInfo.timeEstimates).length > 0) {
    context += 'TIEMPOS ESTIMADOS:\n';
    Object.entries(shippingInfo.timeEstimates).forEach(([zone, time]) => {
      context += `- ${zone}: ${time}\n`;
    });
    context += '\n';
  }
  
  return context;
};

/**
 * Construye contexto para medios de pago
 */
const buildPaymentContext = (paymentInfo) => {
  if (!paymentInfo || Object.keys(paymentInfo).length === 0) {
    return `INFORMACIÓN DE MEDIOS DE PAGO:
No se pudo obtener información específica de medios de pago.
Por favor, proporciona información general sobre formas de pago.`;
  }
  
  let context = 'INFORMACIÓN DE MEDIOS DE PAGO:\n\n';
  
  if (paymentInfo.methods && paymentInfo.methods.length > 0) {
    context += 'MÉTODOS DE PAGO DISPONIBLES:\n';
    paymentInfo.methods.forEach(method => {
      context += `- ${method.name || method.nombre}`;
      if (method.description || method.descripcion) {
        context += `: ${method.description || method.descripcion}`;
      }
      context += '\n';
    });
    context += '\n';
  }
  
  if (paymentInfo.policies && Object.keys(paymentInfo.policies).length > 0) {
    context += 'POLÍTICAS DE PAGO:\n';
    Object.entries(paymentInfo.policies).forEach(([key, value]) => {
      context += `- ${key}: ${value}\n`;
    });
    context += '\n';
  }
  
  if (paymentInfo.requirements && paymentInfo.requirements.length > 0) {
    context += 'REQUISITOS:\n';
    paymentInfo.requirements.forEach(req => {
      context += `- ${req}\n`;
    });
    context += '\n';
  }
  
  return context;
};

/**
 * Optimiza el prompt para mejores resultados
 */
const optimizePrompt = (basePrompt, userMessage, context) => {
  // Limitar longitud del contexto si es muy largo
  const maxContextLength = 1500;
  let optimizedContext = context;
  
  if (context.length > maxContextLength) {
    optimizedContext = context.substring(0, maxContextLength) + '...\n[INFORMACIÓN TRUNCADA]';
  }
  
  // Agregar instrucciones específicas según el tipo de consulta
  let additionalInstructions = '';
  
  if (userMessage.toLowerCase().includes('precio')) {
    additionalInstructions += '\nSi mencionas precios, siempre indica que pueden variar y se recomienda confirmar.';
  }
  
  if (userMessage.toLowerCase().includes('disponible')) {
    additionalInstructions += '\nSi mencionas disponibilidad, indica que puede cambiar y se recomienda confirmar.';
  }
  
  return `${basePrompt}\n\n${optimizedContext}${additionalInstructions}\n\nPregunta del usuario: ${userMessage}\n\nResponde de manera concisa pero completa, máximo 3 párrafos.`;
};

module.exports = {
  generateProductResponse,
  generateShippingResponse,
  generatePaymentResponse,
  generateCakeDescription,
  generateGeneralResponse,
  generateCakeImage,
  buildProductContext,
  buildShippingContext,
  buildPaymentContext,
  optimizePrompt
};