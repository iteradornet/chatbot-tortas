const { generateCakeDescription, generateCakeImage } = require('./geminiService');
const { getMany, getOne } = require('../config/database');
const { createError } = require('../middleware/errorHandler');

/**
 * Crea un diseño de torta personalizada basado en la solicitud del usuario
 * @param {string} userMessage - Mensaje del usuario describiendo la torta
 * @returns {Promise<Object>} - Diseño de torta generado
 */
const createCakeDesign = async (userMessage) => {
  try {
    console.log('🎨 Creando diseño de torta personalizada');
    
    // Analizar la solicitud del usuario
    const designAnalysis = analyzeCakeRequest(userMessage);
    
    // Generar descripción con IA
    const aiDescription = await generateCakeDescription(userMessage);
    
    // Obtener especificaciones técnicas
    const specifications = await getCakeSpecifications(designAnalysis);
    
    // Generar imagen (función futura)
    const imageResult = await generateCakeImage(userMessage);
    
    // Calcular precio estimado
    const estimatedPrice = await calculateEstimatedPrice(designAnalysis, specifications);
    
    // Obtener sugerencias adicionales
    const suggestions = await generateDesignSuggestions(designAnalysis);
    
    return {
      description: aiDescription.text,
      design: {
        theme: designAnalysis.theme,
        occasion: designAnalysis.occasion,
        colors: designAnalysis.colors,
        size: designAnalysis.size,
        decorations: designAnalysis.decorations,
        flavors: designAnalysis.flavors
      },
      specifications: specifications,
      imageUrl: imageResult.imageUrl,
      estimatedPrice: estimatedPrice,
      suggestions: suggestions,
      processingInfo: {
        preparationTime: specifications.preparationTime,
        advanceNotice: specifications.advanceNotice,
        availability: true
      }
    };
    
  } catch (error) {
    console.error('Error creando diseño de torta:', error);
    return await getFallbackCakeDesign(userMessage);
  }
};

/**
 * Analiza la solicitud del usuario para extraer elementos de diseño
 */
const analyzeCakeRequest = (message) => {
  const lowerMessage = message.toLowerCase();
  
  const analysis = {
    occasion: null,
    theme: null,
    colors: [],
    size: null,
    decorations: [],
    flavors: [],
    ageGroup: null,
    gender: null,
    style: null
  };
  
  // Detectar ocasión
  const occasions = {
    'cumpleaños': 'cumpleanos',
    'boda': 'boda',
    'matrimonio': 'boda',
    'aniversario': 'aniversario',
    'graduación': 'graduacion',
    'graduacion': 'graduacion',
    'bautizo': 'bautizo',
    'comunión': 'comunion',
    'comunion': 'comunion',
    'quinceaños': 'quince',
    'sweet 16': 'sweet_16',
    'baby shower': 'baby_shower',
    'gender reveal': 'gender_reveal',
    'despedida': 'despedida'
  };
  
  Object.entries(occasions).forEach(([key, value]) => {
    if (lowerMessage.includes(key)) {
      analysis.occasion = value;
    }
  });
  
  // Detectar tema
  const themes = [
    'princesa', 'superhéroe', 'unicornio', 'dinosaurio', 'futbol',
    'deportes', 'música', 'arte', 'flores', 'mariposas', 'corazones',
    'estrellas', 'arco iris', 'frozen', 'disney', 'marvel', 'pokemon',
    'minecraft', 'fortnite', 'unicornios', 'sirena', 'pirata',
    'carreras', 'construcción', 'jardín', 'vintage', 'moderno',
    'elegante', 'rustico', 'tropical', 'navidad', 'halloween'
  ];
  
  themes.forEach(theme => {
    if (lowerMessage.includes(theme)) {
      analysis.theme = theme;
    }
  });
  
  // Detectar colores
  const colors = [
    'rosa', 'azul', 'verde', 'amarillo', 'rojo', 'morado', 'violeta',
    'naranja', 'blanco', 'negro', 'dorado', 'plateado', 'celeste',
    'fucsia', 'turquesa', 'coral', 'lavanda', 'mint', 'beige'
  ];
  
  colors.forEach(color => {
    if (lowerMessage.includes(color)) {
      analysis.colors.push(color);
    }
  });
  
  // Detectar tamaño
  if (lowerMessage.includes('chica') || lowerMessage.includes('pequeña') || 
      lowerMessage.includes('6 personas') || lowerMessage.includes('personal')) {
    analysis.size = 'small';
  } else if (lowerMessage.includes('mediana') || lowerMessage.includes('12 personas') ||
             lowerMessage.includes('familia')) {
    analysis.size = 'medium';
  } else if (lowerMessage.includes('grande') || lowerMessage.includes('20 personas') ||
             lowerMessage.includes('fiesta')) {
    analysis.size = 'large';
  } else if (lowerMessage.includes('extra grande') || lowerMessage.includes('30 personas') ||
             lowerMessage.includes('evento')) {
    analysis.size = 'extra_large';
  }
  
  // Detectar decoraciones
  const decorations = [
    'figuras', 'muñecos', 'flores naturales', 'flores de azúcar',
    'mariposas', 'perlas', 'brillos', 'glitter', 'fondant',
    'buttercream', 'merengue', 'chocolate', 'frutas', 'velas',
    'topper', 'banderines', 'globos', 'encaje', 'lazos'
  ];
  
  decorations.forEach(decoration => {
    if (lowerMessage.includes(decoration)) {
      analysis.decorations.push(decoration);
    }
  });
  
  // Detectar sabores
  const flavors = [
    'chocolate', 'vainilla', 'fresa', 'red velvet', 'zanahoria',
    'limón', 'café', 'dulce de leche', 'tres leches', 'coco',
    'banana', 'manzana', 'naranja', 'maracuyá', 'cheesecake'
  ];
  
  flavors.forEach(flavor => {
    if (lowerMessage.includes(flavor)) {
      analysis.flavors.push(flavor);
    }
  });
  
  // Detectar grupo etario
  if (lowerMessage.includes('niña') || lowerMessage.includes('niño') || 
      lowerMessage.includes('infantil') || lowerMessage.includes('bebé')) {
    analysis.ageGroup = 'child';
  } else if (lowerMessage.includes('adolescente') || lowerMessage.includes('teen')) {
    analysis.ageGroup = 'teen';
  } else if (lowerMessage.includes('adulto') || lowerMessage.includes('adulta')) {
    analysis.ageGroup = 'adult';
  }
  
  // Detectar género
  if (lowerMessage.includes('niña') || lowerMessage.includes('mujer') || 
      lowerMessage.includes('femenino')) {
    analysis.gender = 'female';
  } else if (lowerMessage.includes('niño') || lowerMessage.includes('hombre') || 
             lowerMessage.includes('masculino')) {
    analysis.gender = 'male';
  }
  
  // Detectar estilo
  if (lowerMessage.includes('elegante') || lowerMessage.includes('sofisticado')) {
    analysis.style = 'elegant';
  } else if (lowerMessage.includes('divertido') || lowerMessage.includes('colorido')) {
    analysis.style = 'fun';
  } else if (lowerMessage.includes('sencillo') || lowerMessage.includes('minimalista')) {
    analysis.style = 'simple';
  } else if (lowerMessage.includes('rustico') || lowerMessage.includes('campestre')) {
    analysis.style = 'rustic';
  }
  
  return analysis;
};

/**
 * Obtiene especificaciones técnicas para la torta
 */
const getCakeSpecifications = async (designAnalysis) => {
  try {
    // Determinar tiempo de preparación
    let preparationTime = '24-48 horas';
    let advanceNotice = '48 horas';
    
    if (designAnalysis.decorations.length > 3 || 
        designAnalysis.theme === 'boda' || 
        designAnalysis.size === 'extra_large') {
      preparationTime = '48-72 horas';
      advanceNotice = '72 horas';
    }
    
    // Determinar porciones según tamaño
    const portions = {
      'small': '6-8 personas',
      'medium': '12-15 personas',
      'large': '20-25 personas',
      'extra_large': '30-40 personas'
    };
    
    // Buscar especificaciones en BD si existen
    const query = `
      SELECT 
        tamaño as size, porciones as portions, 
        tiempo_preparacion as prep_time, 
        precio_base as base_price
      FROM especificaciones_torta 
      WHERE activo = 1
      ORDER BY orden
    `;
    
    const dbSpecs = await getMany(query);
    
    return {
      preparationTime: preparationTime,
      advanceNotice: advanceNotice,
      portions: portions[designAnalysis.size] || 'A consultar',
      basePrice: getBasePrice(designAnalysis.size),
      complexity: calculateComplexity(designAnalysis),
      ingredients: await getSuggestedIngredients(designAnalysis),
      dbSpecs: dbSpecs || []
    };
    
  } catch (error) {
    console.error('Error obteniendo especificaciones:', error);
    return getDefaultSpecifications(designAnalysis);
  }
};

/**
 * Calcula precio estimado
 */
const calculateEstimatedPrice = async (designAnalysis, specifications) => {
  try {
    let basePrice = specifications.basePrice || 1000;
    let totalPrice = basePrice;
    
    // Factores de precio
    const factors = {
      occasion: {
        'boda': 2.0,
        'quince': 1.8,
        'graduacion': 1.5,
        'cumpleanos': 1.2,
        'bautizo': 1.3
      },
      complexity: {
        'low': 1.0,
        'medium': 1.4,
        'high': 2.0,
        'very_high': 2.5
      },
      size: {
        'small': 1.0,
        'medium': 1.5,
        'large': 2.2,
        'extra_large': 3.0
      }
    };
    
    // Aplicar factores
    if (designAnalysis.occasion && factors.occasion[designAnalysis.occasion]) {
      totalPrice *= factors.occasion[designAnalysis.occasion];
    }
    
    if (specifications.complexity && factors.complexity[specifications.complexity]) {
      totalPrice *= factors.complexity[specifications.complexity];
    }
    
    if (designAnalysis.size && factors.size[designAnalysis.size]) {
      totalPrice *= factors.size[designAnalysis.size];
    }
    
    // Agregar costo por decoraciones especiales
    const decorationCosts = {
      'figuras': 300,
      'flores naturales': 200,
      'flores de azúcar': 400,
      'fondant': 250,
      'chocolate': 150
    };
    
    designAnalysis.decorations.forEach(decoration => {
      if (decorationCosts[decoration]) {
        totalPrice += decorationCosts[decoration];
      }
    });
    
    return {
      basePrice: basePrice,
      totalEstimated: Math.round(totalPrice),
      priceRange: {
        min: Math.round(totalPrice * 0.8),
        max: Math.round(totalPrice * 1.2)
      },
      factors: {
        occasion: designAnalysis.occasion,
        size: designAnalysis.size,
        complexity: specifications.complexity,
        decorations: designAnalysis.decorations.length
      },
      note: 'Precio estimado. El costo final puede variar según especificaciones exactas.'
    };
    
  } catch (error) {
    console.error('Error calculando precio:', error);
    return {
      totalEstimated: 'A consultar',
      note: 'Contáctanos para un presupuesto detallado'
    };
  }
};

/**
 * Genera sugerencias adicionales de diseño
 */
const generateDesignSuggestions = async (designAnalysis) => {
  const suggestions = [];
  
  // Sugerencias basadas en ocasión
  if (designAnalysis.occasion === 'cumpleanos') {
    suggestions.push('Considera agregar velas personalizadas');
    suggestions.push('¿Te gustaría incluir el nombre del festejado?');
  }
  
  if (designAnalysis.occasion === 'boda') {
    suggestions.push('Podemos crear un topper personalizado con los nombres');
    suggestions.push('Las flores naturales dan un toque muy elegante');
  }
  
  // Sugerencias basadas en colores
  if (designAnalysis.colors.length === 0) {
    suggestions.push('Considera colores que combinen con la decoración del evento');
  } else if (designAnalysis.colors.length === 1) {
    suggestions.push('Podríamos agregar un color complementario para más contraste');
  }
  
  // Sugerencias basadas en tema
  if (designAnalysis.theme === 'princesa') {
    suggestions.push('Podemos incluir una corona comestible como decoración');
    suggestions.push('Los tonos rosa y dorado quedan perfectos con este tema');
  }
  
  if (designAnalysis.theme === 'superhéroe') {
    suggestions.push('Podemos crear el logo del superhéroe favorito');
    suggestions.push('Los colores vibrantes son ideales para este tema');
  }
  
  // Sugerencias generales
  if (!designAnalysis.size) {
    suggestions.push('Especifica la cantidad aproximada de personas para sugerir el tamaño ideal');
  }
  
  if (designAnalysis.flavors.length === 0) {
    suggestions.push('¿Tienes algún sabor favorito? Podemos sugerirte las mejores combinaciones');
  }
  
  return suggestions;
};

/**
 * Calcula la complejidad del diseño
 */
const calculateComplexity = (designAnalysis) => {
  let complexityScore = 0;
  
  // Puntos por diferentes elementos
  if (designAnalysis.theme) complexityScore += 1;
  if (designAnalysis.occasion === 'boda') complexityScore += 2;
  complexityScore += designAnalysis.decorations.length;
  complexityScore += designAnalysis.colors.length * 0.5;
  
  if (designAnalysis.size === 'extra_large') complexityScore += 2;
  if (designAnalysis.size === 'large') complexityScore += 1;
  
  // Determinar nivel de complejidad
  if (complexityScore <= 2) return 'low';
  if (complexityScore <= 4) return 'medium';
  if (complexityScore <= 6) return 'high';
  return 'very_high';
};

/**
 * Obtiene precio base según tamaño
 */
const getBasePrice = (size) => {
  const basePrices = {
    'small': 800,
    'medium': 1200,
    'large': 1800,
    'extra_large': 2500
  };
  
  return basePrices[size] || 1000;
};

/**
 * Obtiene ingredientes sugeridos
 */
const getSuggestedIngredients = async (designAnalysis) => {
  const ingredients = [];
  
  // Ingredientes base
  ingredients.push('Harina premium', 'Huevos frescos', 'Mantequilla', 'Azúcar');
  
  // Ingredientes según sabores seleccionados
  if (designAnalysis.flavors.includes('chocolate')) {
    ingredients.push('Cacao premium', 'Chocolate belga');
  }
  
  if (designAnalysis.flavors.includes('vainilla')) {
    ingredients.push('Esencia de vainilla natural');
  }
  
  if (designAnalysis.flavors.includes('fresa')) {
    ingredients.push('Fresas frescas', 'Mermelada artesanal');
  }
  
  // Ingredientes según decoraciones
  if (designAnalysis.decorations.includes('fondant')) {
    ingredients.push('Fondant premium');
  }
  
  if (designAnalysis.decorations.includes('flores de azúcar')) {
    ingredients.push('Azúcar glas', 'Colorantes naturales');
  }
  
  return ingredients;
};

/**
 * Especificaciones por defecto
 */
const getDefaultSpecifications = (designAnalysis) => {
  return {
    preparationTime: '24-48 horas',
    advanceNotice: '48 horas',
    portions: 'A determinar según tamaño',
    basePrice: 1000,
    complexity: 'medium',
    ingredients: ['Ingredientes premium', 'Decoración personalizada']
  };
};

/**
 * Diseño de respaldo en caso de error
 */
const getFallbackCakeDesign = async (userMessage) => {
  return {
    description: `Basándome en tu solicitud, te propongo una torta personalizada especial. 
                  Podemos crear un diseño único que se adapte perfectamente a tus necesidades, 
                  utilizando ingredientes premium y decoraciones artesanales.`,
    design: {
      theme: 'personalizada',
      occasion: 'especial',
      colors: ['a definir'],
      size: 'a consultar',
      decorations: ['decoración personalizada'],
      flavors: ['sabor a elección']
    },
    specifications: {
      preparationTime: '24-48 horas',
      advanceNotice: '48 horas mínimo',
      portions: 'Según requerimiento'
    },
    imageUrl: 'https://via.placeholder.com/400x400/FFB6C1/000000?text=Torta+Personalizada',
    estimatedPrice: {
      totalEstimated: 'A consultar',
      note: 'El precio se determina según especificaciones exactas'
    },
    suggestions: [
      'Contáctanos para definir todos los detalles',
      'Podemos crear un diseño completamente único',
      'Trabajamos con ingredientes premium'
    ]
  };
};

module.exports = {
  createCakeDesign,
  analyzeCakeRequest,
  getCakeSpecifications,
  calculateEstimatedPrice,
  generateDesignSuggestions,
  calculateComplexity
};