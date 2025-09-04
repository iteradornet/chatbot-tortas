const { CATEGORIES } = require('./constants');

/**
 * Utilidades adicionales para el clasificador de mensajes
 */

// Sinónimos y variaciones de palabras para mejorar la clasificación
const SYNONYMS = {
  productos: [
    'torta', 'tortas', 'pastel', 'pasteles', 'cake', 'cakes',
    'postre', 'postres', 'dulce', 'dulces', 'repostería', 'reposteria',
    'producto', 'productos', 'artículo', 'articulos', 'item', 'items'
  ],
  
  sabores: [
    'sabor', 'sabores', 'gusto', 'gustos', 'flavor', 'flavors',
    'variedad', 'variedades', 'tipo', 'tipos', 'clase', 'clases'
  ],
  
  precios: [
    'precio', 'precios', 'costo', 'costos', 'vale', 'valor',
    'cuanto', 'cuánto', 'tarifa', 'tarifas', 'monto', 'importe'
  ],
  
  envios: [
    'envío', 'envio', 'envíos', 'envios', 'entrega', 'entregas',
    'delivery', 'despacho', 'distribución', 'distribucion',
    'transporte', 'logística', 'logistica'
  ],
  
  zonas: [
    'zona', 'zonas', 'área', 'areas', 'región', 'regiones',
    'sector', 'sectores', 'barrio', 'barrios', 'ubicación', 'ubicacion'
  ],
  
  pagos: [
    'pago', 'pagos', 'pagar', 'abono', 'abonos', 'cancelar',
    'facturación', 'facturacion', 'cobro', 'cobros'
  ],
  
  tarjetas: [
    'tarjeta', 'tarjetas', 'crédito', 'credito', 'débito', 'debito',
    'visa', 'mastercard', 'american express', 'amex'
  ],
  
  personalizada: [
    'personalizada', 'personalizado', 'custom', 'especial',
    'único', 'unico', 'exclusivo', 'hecho a medida'
  ]
};

// Frases comunes por categoría para mejorar detección
const COMMON_PHRASES = {
  productos: [
    'qué sabores tienen', 'que sabores tienen', 'sabores disponibles',
    'cuánto vale', 'cuanto vale', 'precio de', 'costo de',
    'tienen torta de', 'hay torta de', 'venden torta',
    'ingredientes de', 'contiene gluten', 'sin gluten',
    'torta vegana', 'para cuántas personas', 'tamaño de'
  ],
  
  envios: [
    'hacen envío', 'hacen envio', 'entregan a domicilio',
    'cuánto cuesta el envío', 'cuanto cuesta el envio',
    'tiempo de entrega', 'demoran en entregar',
    'zonas de entrega', 'cobran envío', 'envío gratis',
    'horarios de entrega', 'cuando entregan'
  ],
  
  pagos: [
    'formas de pago', 'métodos de pago', 'cómo puedo pagar',
    'como puedo pagar', 'aceptan tarjeta', 'pago en efectivo',
    'transferencia bancaria', 'mercado pago', 'emiten factura',
    'factura a', 'descuento por', 'promociones'
  ],
  
  creacion_torta: [
    'quiero una torta', 'necesito una torta', 'diseñar torta',
    'torta personalizada', 'torta especial', 'torta de cumpleaños',
    'torta de boda', 'torta temática', 'crear torta',
    'torta con', 'decoración de', 'figura de'
  ]
};

// Stopwords en español que pueden confundir la clasificación
const STOPWORDS = [
  'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se',
  'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con',
  'para', 'al', 'del', 'los', 'una', 'las', 'me', 'si', 'ya',
  'muy', 'más', 'mas', 'pero', 'como', 'todo', 'bien', 'ser',
  'tener', 'hacer', 'ver', 'poder', 'decir', 'ir', 'estar',
  'haber', 'dar', 'saber', 'deber', 'querer', 'venir', 'salir'
];

// Palabras que indican negación y pueden cambiar el contexto
const NEGATION_WORDS = [
  'no', 'sin', 'nunca', 'jamás', 'nada', 'ningún', 'ninguna',
  'tampoco', 'ni', 'nadie', 'ninguno', 'excepto', 'salvo'
];

// Palabras interrogativas que indican preguntas
const QUESTION_WORDS = [
  'qué', 'que', 'cómo', 'como', 'cuándo', 'cuando', 'dónde', 'donde',
  'por qué', 'por que', 'para qué', 'para que', 'cuál', 'cual',
  'cuáles', 'cuales', 'cuánto', 'cuanto', 'cuánta', 'cuanta',
  'cuántos', 'cuantos', 'cuántas', 'cuantas', 'quién', 'quien'
];

/**
 * Preprocessa un mensaje removiendo stopwords y normalizando texto
 * @param {string} message - Mensaje a procesar
 * @returns {string} - Mensaje procesado
 */
const preprocessMessage = (message) => {
  if (!message || typeof message !== 'string') return '';
  
  // Convertir a minúsculas y limpiar
  let processed = message.toLowerCase().trim();
  
  // Remover caracteres especiales pero mantener acentos
  processed = processed.replace(/[^\w\sáéíóúüñ]/g, ' ');
  
  // Reemplazar múltiples espacios por uno solo
  processed = processed.replace(/\s+/g, ' ');
  
  // Dividir en palabras
  const words = processed.split(' ');
  
  // Filtrar stopwords pero mantener palabras interrogativas y de negación
  const filteredWords = words.filter(word => {
    return word.length > 2 && (
      !STOPWORDS.includes(word) ||
      QUESTION_WORDS.includes(word) ||
      NEGATION_WORDS.includes(word)
    );
  });
  
  return filteredWords.join(' ');
};

/**
 * Expande sinónimos en el mensaje para mejorar matching
 * @param {string} message - Mensaje original
 * @returns {string} - Mensaje expandido con sinónimos
 */
const expandSynonyms = (message) => {
  let expandedMessage = message;
  
  Object.entries(SYNONYMS).forEach(([category, synonyms]) => {
    synonyms.forEach(synonym => {
      if (message.includes(synonym)) {
        // Agregar la categoría como contexto adicional
        expandedMessage += ` ${category}`;
      }
    });
  });
  
  return expandedMessage;
};

/**
 * Detecta frases comunes para mejorar clasificación
 * @param {string} message - Mensaje a analizar
 * @returns {Object} - Puntuaciones por categoría basadas en frases
 */
const detectCommonPhrases = (message) => {
  const scores = {
    productos: 0,
    envios: 0,
    pagos: 0,
    creacion_torta: 0
  };
  
  Object.entries(COMMON_PHRASES).forEach(([category, phrases]) => {
    phrases.forEach(phrase => {
      if (message.includes(phrase)) {
        // Dar mayor peso a frases completas
        scores[category] += 2;
      }
    });
  });
  
  return scores;
};

/**
 * Analiza el sentimiento/intención del mensaje
 * @param {string} message - Mensaje a analizar
 * @returns {Object} - Información sobre la intención
 */
const analyzeIntent = (message) => {
  const intent = {
    type: 'unknown',
    confidence: 0,
    indicators: []
  };
  
  // Detectar tipo de intención
  const hasQuestionWords = QUESTION_WORDS.some(word => message.includes(word));
  const hasNegation = NEGATION_WORDS.some(word => message.includes(word));
  
  if (hasQuestionWords) {
    intent.type = 'question';
    intent.confidence += 0.3;
    intent.indicators.push('contains_question_words');
  }
  
  // Detectar patrones específicos
  const patterns = {
    request: ['quiero', 'necesito', 'me gustaría', 'busco', 'solicito'],
    inquiry: ['información', 'saber', 'conocer', 'consultar', 'preguntar'],
    comparison: ['mejor', 'diferencia', 'comparar', 'versus', 'vs'],
    urgency: ['urgente', 'rápido', 'ya', 'ahora', 'inmediato']
  };
  
  Object.entries(patterns).forEach(([type, words]) => {
    const matches = words.filter(word => message.includes(word));
    if (matches.length > 0) {
      intent.type = type;
      intent.confidence += matches.length * 0.2;
      intent.indicators.push(`contains_${type}_words`);
    }
  });
  
  if (hasNegation) {
    intent.indicators.push('contains_negation');
    // La negación puede cambiar el contexto pero no necesariamente la categoría
  }
  
  return intent;
};

/**
 * Calcula similitud entre dos strings usando Levenshtein simplificado
 * @param {string} str1 - Primera string
 * @param {string} str2 - Segunda string
 * @returns {number} - Similitud entre 0 y 1
 */
const calculateSimilarity = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  // Algoritmo simplificado para calcular similitud
  const maxLen = Math.max(len1, len2);
  let matches = 0;
  
  // Contar caracteres coincidentes en posiciones similares
  for (let i = 0; i < Math.min(len1, len2); i++) {
    if (str1[i] === str2[i]) {
      matches++;
    }
  }
  
  // Bonificación por subcadenas comunes
  const commonSubstrings = findCommonSubstrings(str1, str2);
  matches += commonSubstrings.length * 2;
  
  return Math.min(matches / maxLen, 1);
};

/**
 * Encuentra subcadenas comunes entre dos strings
 * @param {string} str1 - Primera string
 * @param {string} str2 - Segunda string
 * @returns {Array} - Array de subcadenas comunes
 */
const findCommonSubstrings = (str1, str2) => {
  const common = [];
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  
  words1.forEach(word1 => {
    if (word1.length > 3) { // Solo palabras significativas
      words2.forEach(word2 => {
        if (word1 === word2) {
          common.push(word1);
        }
      });
    }
  });
  
  return [...new Set(common)]; // Remover duplicados
};

/**
 * Valida si un mensaje tiene suficiente contenido para clasificar
 * @param {string} message - Mensaje a validar
 * @returns {Object} - Resultado de la validación
 */
const validateMessageContent = (message) => {
  if (!message || typeof message !== 'string') {
    return {
      valid: false,
      reason: 'Mensaje vacío o inválido'
    };
  }
  
  const trimmed = message.trim();
  
  if (trimmed.length < 3) {
    return {
      valid: false,
      reason: 'Mensaje demasiado corto'
    };
  }
  
  if (trimmed.length > 1000) {
    return {
      valid: false,
      reason: 'Mensaje demasiado largo'
    };
  }
  
  // Verificar que no sea solo números o símbolos
  if (/^[0-9\s\W]+$/.test(trimmed)) {
    return {
      valid: false,
      reason: 'Mensaje sin contenido textual significativo'
    };
  }
  
  // Verificar que tenga al menos una palabra significativa
  const processedMessage = preprocessMessage(trimmed);
  if (processedMessage.length < 2) {
    return {
      valid: false,
      reason: 'No contiene palabras significativas'
    };
  }
  
  return {
    valid: true,
    processedMessage: processedMessage
  };
};

/**
 * Genera sugerencias de reformulación para mensajes problemáticos
 * @param {string} message - Mensaje original
 * @param {string} category - Categoría sugerida
 * @returns {Array} - Array de sugerencias
 */
const generateReformulationSuggestions = (message, category = null) => {
  const suggestions = [];
  
  if (category) {
    switch (category) {
      case CATEGORIES.PRODUCTS:
        suggestions.push('Pregunta específica: "¿Qué sabores de torta tienen disponibles?"');
        suggestions.push('Sobre precios: "¿Cuánto cuesta una torta de chocolate?"');
        break;
      case CATEGORIES.SHIPPING:
        suggestions.push('Sobre entregas: "¿Hacen envíos a domicilio?"');
        suggestions.push('Sobre costos: "¿Cuánto cuesta el envío a [tu zona]?"');
        break;
      case CATEGORIES.PAYMENTS:
        suggestions.push('Sobre pagos: "¿Qué formas de pago aceptan?"');
        suggestions.push('Sobre facturación: "¿Emiten facturas?"');
        break;
      case CATEGORIES.CAKE_CREATION:
        suggestions.push('Para diseño: "Quiero una torta de cumpleaños para niña"');
        suggestions.push('Con detalles: "Torta de boda con decoración elegante"');
        break;
    }
  } else {
    // Sugerencias generales
    suggestions.push('Intenta ser más específico sobre lo que necesitas');
    suggestions.push('Menciona si buscas información sobre productos, envíos o pagos');
    suggestions.push('Para tortas personalizadas, describe la ocasión y tus preferencias');
  }
  
  return suggestions;
};

/**
 * Extrae entidades nombradas simples del mensaje
 * @param {string} message - Mensaje a analizar
 * @returns {Object} - Entidades encontradas
 */
const extractNamedEntities = (message) => {
  const entities = {
    flavors: [],
    occasions: [],
    colors: [],
    numbers: [],
    locations: []
  };
  
  // Sabores
  const flavors = ['chocolate', 'vainilla', 'fresa', 'limón', 'café', 'dulce de leche'];
  flavors.forEach(flavor => {
    if (message.includes(flavor)) {
      entities.flavors.push(flavor);
    }
  });
  
  // Ocasiones
  const occasions = ['cumpleaños', 'boda', 'aniversario', 'graduación', 'bautizo'];
  occasions.forEach(occasion => {
    if (message.includes(occasion)) {
      entities.occasions.push(occasion);
    }
  });
  
  // Colores
  const colors = ['rosa', 'azul', 'verde', 'amarillo', 'rojo', 'blanco', 'negro'];
  colors.forEach(color => {
    if (message.includes(color)) {
      entities.colors.push(color);
    }
  });
  
  // Números
  const numbers = message.match(/\b\d+\b/g);
  if (numbers) {
    entities.numbers = numbers.map(num => parseInt(num));
  }
  
  return entities;
};

module.exports = {
  SYNONYMS,
  COMMON_PHRASES,
  STOPWORDS,
  NEGATION_WORDS,
  QUESTION_WORDS,
  preprocessMessage,
  expandSynonyms,
  detectCommonPhrases,
  analyzeIntent,
  calculateSimilarity,
  findCommonSubstrings,
  validateMessageContent,
  generateReformulationSuggestions,
  extractNamedEntities
};