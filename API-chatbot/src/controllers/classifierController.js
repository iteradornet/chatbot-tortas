const { generateText, systemPrompts } = require('../config/gemini');
const { createError } = require('../middleware/errorHandler');

// Palabras clave para clasificación por categoría
const categoryKeywords = {
  productos: [
    'torta', 'pastel', 'tortas', 'pasteles', 'sabor', 'sabores', 'precio', 'precios',
    'ingredientes', 'chocolate', 'vainilla', 'fresa', 'red velvet', 'zanahoria',
    'sin gluten', 'vegano', 'dulce', 'amargo', 'tamaño', 'porciones', 'disponible',
    'stock', 'catálogo', 'menu', 'opciones', 'variedades', 'especialidad',
    'recomendación', 'popular', 'mejor', 'nuevo', 'temporada'
  ],
  
  envios: [
    'envío', 'envio', 'entrega', 'delivery', 'domicilio', 'enviar', 'entregar',
    'zona', 'zonas', 'cobertura', 'área', 'tiempo', 'horario', 'cuando',
    'rápido', 'urgente', 'costo', 'precio envío', 'gratis', 'distancia',
    'ubicación', 'dirección', 'barrio', 'ciudad', 'llevar', 'recoger',
    'pickup', 'logística', 'transporte'
  ],
  
  medios_pagos: [
    'pagar', 'pago', 'pagos', 'precio', 'costo', 'tarjeta', 'efectivo',
    'transferencia', 'débito', 'crédito', 'mercado pago', 'paypal', 'visa',
    'mastercard', 'factura', 'facturación', 'recibo', 'comprobante',
    'descuento', 'promoción', 'oferta', 'anticipo', 'seña', 'cuotas',
    'financiación', 'método', 'forma', 'modalidad'
  ],
  
  creacion_torta: [
    'diseñar', 'crear', 'personalizada', 'personalizado', 'custom', 'especial',
    'cumpleaños', 'boda', 'matrimonio', 'aniversario', 'graduación', 'bautizo',
    'comunión', 'quinceaños', 'sweet 16', 'baby shower', 'género reveal',
    'temática', 'tema', 'decoración', 'adorno', 'figura', 'muñeco',
    'floral', 'flores', 'rosas', 'mariposas', 'princesa', 'superhéroe',
    'unicornio', 'dinosaurio', 'futbol', 'deportes', 'música', 'arte',
    'colores', 'rosa', 'azul', 'dorado', 'plateado', 'elegante', 'moderno'
  ]
};

// Patrones de preguntas no válidas
const invalidPatterns = [
  /^(hola|hi|hello|hey)$/i,
  /^(adiós|bye|chao)$/i,
  /^(gracias|thanks)$/i,
  /^(sí|si|yes|no)$/i,
  /^\w{1,2}$/i, // Palabras muy cortas
  /^[0-9]+$/i, // Solo números
  /^[!@#$%^&*(),.?":{}|<>]+$/i, // Solo símbolos
];

/**
 * Clasifica un mensaje de usuario en una de las categorías disponibles
 * @param {string} message - El mensaje del usuario
 * @param {boolean} useAI - Si usar IA para clasificación avanzada
 * @returns {Promise<Object>} - Objeto con la categoría y confianza
 */
const classifyMessage = async (message, useAI = false) => {
  try {
    if (!message || typeof message !== 'string') {
      throw createError('Mensaje inválido para clasificación', 400, 'INVALID_MESSAGE');
    }

    const cleanMessage = message.toLowerCase().trim();
    
    // Verificar si es una pregunta no válida
    const isInvalid = invalidPatterns.some(pattern => pattern.test(cleanMessage));
    if (isInvalid) {
      return {
        category: 'pregunta_no_valida',
        confidence: 0.9,
        reason: 'Mensaje muy corto o saludo',
        suggestions: ['Intenta hacer una pregunta más específica sobre productos, envíos o medios de pago']
      };
    }

    // Clasificación basada en palabras clave
    const keywordScores = calculateKeywordScores(cleanMessage);
    
    // Obtener la categoría con mayor puntuación
    const bestMatch = Object.entries(keywordScores)
      .sort(([,a], [,b]) => b - a)[0];
    
    const [bestCategory, bestScore] = bestMatch;
    
    // Si la confianza es muy baja, usar IA para clasificación
    if (bestScore < 0.3 && useAI) {
      return await classifyWithAI(message);
    }
    
    // Si no hay coincidencias claras, es pregunta no válida
    if (bestScore === 0) {
      return {
        category: 'pregunta_no_valida',
        confidence: 0.8,
        reason: 'No se encontraron palabras clave relacionadas',
        suggestions: [
          'Pregunta sobre productos: "¿Qué sabores de torta tienen?"',
          'Pregunta sobre envíos: "¿Hacen delivery?"',
          'Pregunta sobre pagos: "¿Qué formas de pago aceptan?"',
          'Creación de torta: "Quiero una torta de cumpleaños"'
        ]
      };
    }
    
    return {
      category: bestCategory,
      confidence: Math.min(bestScore, 1.0),
      reason: 'Clasificación por palabras clave',
      keywordMatches: getMatchedKeywords(cleanMessage, bestCategory),
      allScores: keywordScores
    };

  } catch (error) {
    console.error('Error en clasificación:', error);
    return {
      category: 'pregunta_no_valida',
      confidence: 0.5,
      reason: 'Error en clasificación',
      error: error.message
    };
  }
};

/**
 * Clasifica usando IA cuando las palabras clave no son suficientes
 */
const classifyWithAI = async (message) => {
  try {
    const prompt = `
Clasifica el siguiente mensaje de usuario en UNA de estas categorías exactas:
- productos: preguntas sobre tortas, sabores, ingredientes, precios de productos
- envios: preguntas sobre entregas, zonas, tiempos, costos de envío
- medios_pagos: preguntas sobre formas de pago, facturación, precios
- creacion_torta: solicitudes para diseñar tortas personalizadas
- pregunta_no_valida: mensajes poco claros, saludos, o no relacionados con el negocio

Mensaje: "${message}"

Responde SOLO con el nombre de la categoría, sin explicaciones adicionales.
`;

    const result = await generateText(prompt);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    const aiCategory = result.text.toLowerCase().trim();
    const validCategories = ['productos', 'envios', 'medios_pagos', 'creacion_torta', 'pregunta_no_valida'];
    
    if (validCategories.includes(aiCategory)) {
      return {
        category: aiCategory,
        confidence: 0.7,
        reason: 'Clasificación con IA',
        aiResponse: result.text
      };
    } else {
      return {
        category: 'pregunta_no_valida',
        confidence: 0.6,
        reason: 'IA no pudo clasificar correctamente',
        aiResponse: result.text
      };
    }
    
  } catch (error) {
    console.error('Error en clasificación con IA:', error);
    return {
      category: 'pregunta_no_valida',
      confidence: 0.4,
      reason: 'Error en clasificación con IA',
      error: error.message
    };
  }
};

/**
 * Calcula puntuaciones basadas en palabras clave
 */
const calculateKeywordScores = (message) => {
  const scores = {
    productos: 0,
    envios: 0,
    medios_pagos: 0,
    creacion_torta: 0
  };
  
  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (message.includes(keyword)) {
        // Palabras más específicas tienen mayor peso
        const weight = keyword.length > 5 ? 1.2 : 1.0;
        scores[category] += weight;
      }
    });
    
    // Normalizar por número de palabras clave en la categoría
    scores[category] = scores[category] / keywords.length;
  });
  
  return scores;
};

/**
 * Obtiene las palabras clave que coincidieron
 */
const getMatchedKeywords = (message, category) => {
  if (!categoryKeywords[category]) return [];
  
  return categoryKeywords[category].filter(keyword => 
    message.includes(keyword)
  );
};

/**
 * Valida que el resultado de clasificación sea correcto
 */
const validateClassification = (classification) => {
  if (!classification || typeof classification !== 'object') {
    return false;
  }
  
  const requiredFields = ['category', 'confidence', 'reason'];
  return requiredFields.every(field => field in classification);
};

/**
 * Obtiene estadísticas de clasificación (para debugging)
 */
const getClassificationStats = () => {
  return {
    categories: Object.keys(categoryKeywords),
    totalKeywords: Object.values(categoryKeywords).reduce((sum, arr) => sum + arr.length, 0),
    keywordsPerCategory: Object.entries(categoryKeywords).map(([cat, keywords]) => ({
      category: cat,
      count: keywords.length
    })),
    invalidPatterns: invalidPatterns.length
  };
};

module.exports = {
  classifyMessage,
  classifyWithAI,
  calculateKeywordScores,
  getMatchedKeywords,
  validateClassification,
  getClassificationStats,
  categoryKeywords
};