const { getMany, getOne } = require('../config/database');
const { createError } = require('../middleware/errorHandler');

/**
 * Obtiene información de envíos basada en la consulta del usuario
 * @param {string} userMessage - Mensaje del usuario
 * @returns {Promise<Object>} - Información de envíos relevante
 */
const getShippingInformation = async (userMessage) => {
  try {
    console.log('🚚 Consultando información de envíos');
    
    // Analizar consulta del usuario
    const queryAnalysis = analyzeShippingQuery(userMessage);
    
    let zones = [];
    let costs = {};
    let timeEstimates = {};
    let policies = {};
    
    // Obtener zonas de entrega
    zones = await getShippingZones();
    
    // Obtener costos específicos si se solicita
    if (queryAnalysis.needCosts) {
      costs = await getShippingCosts(queryAnalysis.zone);
    }
    
    // Obtener tiempos estimados
    if (queryAnalysis.needTimeEstimates) {
      timeEstimates = await getDeliveryTimes(queryAnalysis.zone);
    }
    
    // Obtener políticas de envío
    policies = await getShippingPolicies();
    
    return {
      zones: zones,
      costs: costs,
      timeEstimates: timeEstimates,
      policies: policies,
      queryType: queryAnalysis.type,
      searchZone: queryAnalysis.zone
    };
    
  } catch (error) {
    console.error('Error obteniendo información de envíos:', error);
    return await getFallbackShippingInfo();
  }
};

/**
 * Analiza la consulta del usuario sobre envíos
 */
const analyzeShippingQuery = (message) => {
  const lowerMessage = message.toLowerCase();
  
  const analysis = {
    type: 'general',
    needCosts: false,
    needTimeEstimates: false,
    zone: null
  };
  
  // Detectar tipo de consulta
  if (lowerMessage.includes('costo') || lowerMessage.includes('precio') || 
      lowerMessage.includes('vale') || lowerMessage.includes('cuanto')) {
    analysis.type = 'cost';
    analysis.needCosts = true;
  } else if (lowerMessage.includes('tiempo') || lowerMessage.includes('cuando') || 
             lowerMessage.includes('demora') || lowerMessage.includes('tardan')) {
    analysis.type = 'time';
    analysis.needTimeEstimates = true;
  } else if (lowerMessage.includes('zona') || lowerMessage.includes('área') || 
             lowerMessage.includes('cobertura') || lowerMessage.includes('entregan')) {
    analysis.type = 'zones';
  } else if (lowerMessage.includes('horario') || lowerMessage.includes('hora')) {
    analysis.type = 'schedule';
  }
  
  // Detectar zona específica mencionada
  const zones = [
    'centro', 'microcentro', 'puerto madero', 'san telmo', 'la boca',
    'barracas', 'constitución', 'monserrat', 'retiro', 'recoleta',
    'palermo', 'villa crespo', 'almagro', 'caballito', 'flores',
    'once', 'balvanera', 'boedo', 'parque chacabuco', 'nueva pompeya'
  ];
  
  zones.forEach(zone => {
    if (lowerMessage.includes(zone)) {
      analysis.zone = zone;
      analysis.needCosts = true;
      analysis.needTimeEstimates = true;
    }
  });
  
  return analysis;
};

/**
 * Obtiene las zonas de entrega desde la base de datos
 */
const getShippingZones = async () => {
  try {
    const query = `
      SELECT 
        id, nombre as name, descripcion as description,
        costo_base as cost, tiempo_estimado as time,
        activo as active, orden as order_priority
      FROM zonas_entrega 
      WHERE activo = 1
      ORDER BY orden, nombre
    `;
    
    return await getMany(query);
  } catch (error) {
    console.error('Error obteniendo zonas de entrega:', error);
    return [];
  }
};

/**
 * Obtiene costos de envío específicos
 */
const getShippingCosts = async (specificZone = null) => {
  try {
    let query = `
      SELECT 
        z.nombre as zone_name,
        z.costo_base as base_cost,
        z.costo_express as express_cost,
        z.costo_programado as scheduled_cost
      FROM zonas_entrega z
      WHERE z.activo = 1
    `;
    
    const params = [];
    
    if (specificZone) {
      query += ` AND LOWER(z.nombre) LIKE ?`;
      params.push(`%${specificZone}%`);
    }
    
    query += ` ORDER BY z.orden, z.nombre`;
    
    const results = await getMany(query, params);
    
    // Convertir a objeto para fácil acceso
    const costs = {};
    results.forEach(row => {
      costs[row.zone_name] = {
        standard: row.base_cost,
        express: row.express_cost,
        scheduled: row.scheduled_cost
      };
    });
    
    return costs;
  } catch (error) {
    console.error('Error obteniendo costos de envío:', error);
    return {};
  }
};

/**
 * Obtiene tiempos estimados de entrega
 */
const getDeliveryTimes = async (specificZone = null) => {
  try {
    let query = `
      SELECT 
        z.nombre as zone_name,
        z.tiempo_estimado as standard_time,
        z.tiempo_express as express_time,
        z.horario_inicio as start_time,
        z.horario_fin as end_time
      FROM zonas_entrega z
      WHERE z.activo = 1
    `;
    
    const params = [];
    
    if (specificZone) {
      query += ` AND LOWER(z.nombre) LIKE ?`;
      params.push(`%${specificZone}%`);
    }
    
    query += ` ORDER BY z.orden, z.nombre`;
    
    const results = await getMany(query, params);
    
    // Convertir a objeto para fácil acceso
    const times = {};
    results.forEach(row => {
      times[row.zone_name] = {
        standard: row.standard_time,
        express: row.express_time,
        schedule: {
          start: row.start_time,
          end: row.end_time
        }
      };
    });
    
    return times;
  } catch (error) {
    console.error('Error obteniendo tiempos de entrega:', error);
    return {};
  }
};

/**
 * Obtiene políticas de envío
 */
const getShippingPolicies = async () => {
  try {
    const query = `
      SELECT 
        nombre as name, valor as value, descripcion as description
      FROM configuraciones 
      WHERE categoria = 'envios' AND activo = 1
      ORDER BY orden, nombre
    `;
    
    const results = await getMany(query);
    
    // Convertir a objeto para fácil acceso
    const policies = {};
    results.forEach(row => {
      policies[row.name] = {
        value: row.value,
        description: row.description
      };
    });
    
    // Agregar políticas por defecto si no existen en BD
    if (Object.keys(policies).length === 0) {
      return getDefaultShippingPolicies();
    }
    
    return policies;
  } catch (error) {
    console.error('Error obteniendo políticas de envío:', error);
    return getDefaultShippingPolicies();
  }
};

/**
 * Políticas de envío por defecto
 */
const getDefaultShippingPolicies = () => {
  return {
    'horario_entrega': {
      value: '9:00 AM - 8:00 PM',
      description: 'Horario de entregas de lunes a domingo'
    },
    'tiempo_preparacion': {
      value: '2-4 horas',
      description: 'Tiempo mínimo para preparar el pedido'
    },
    'pedido_minimo': {
      value: '$500',
      description: 'Monto mínimo para entregas a domicilio'
    },
    'envio_gratis': {
      value: '$1500',
      description: 'Envío gratis en pedidos superiores a este monto'
    },
    'areas_cobertura': {
      value: 'CABA y Gran Buenos Aires',
      description: 'Áreas donde realizamos entregas'
    }
  };
};

/**
 * Calcula costo de envío para una zona específica
 */
const calculateShippingCost = async (zoneName, orderValue = 0, deliveryType = 'standard') => {
  try {
    const query = `
      SELECT 
        costo_base as base_cost,
        costo_express as express_cost,
        costo_programado as scheduled_cost,
        envio_gratis_desde as free_shipping_threshold
      FROM zonas_entrega 
      WHERE LOWER(nombre) LIKE ? AND activo = 1
      LIMIT 1
    `;
    
    const zone = await getOne(query, [`%${zoneName.toLowerCase()}%`]);
    
    if (!zone) {
      return {
        cost: null,
        error: 'Zona no encontrada'
      };
    }
    
    let baseCost = 0;
    
    switch (deliveryType) {
      case 'express':
        baseCost = zone.express_cost || zone.base_cost;
        break;
      case 'scheduled':
        baseCost = zone.scheduled_cost || zone.base_cost;
        break;
      default:
        baseCost = zone.base_cost;
    }
    
    // Verificar si califica para envío gratis
    const freeShippingThreshold = zone.free_shipping_threshold || 1500;
    if (orderValue >= freeShippingThreshold) {
      baseCost = 0;
    }
    
    return {
      cost: baseCost,
      originalCost: deliveryType === 'express' ? zone.express_cost : zone.base_cost,
      freeShipping: baseCost === 0 && orderValue >= freeShippingThreshold,
      deliveryType: deliveryType
    };
    
  } catch (error) {
    console.error('Error calculando costo de envío:', error);
    return {
      cost: null,
      error: error.message
    };
  }
};

/**
 * Verifica si una dirección está en zona de cobertura
 */
const checkCoverageArea = async (address) => {
  try {
    // Normalizar dirección
    const normalizedAddress = address.toLowerCase().trim();
    
    const query = `
      SELECT 
        z.nombre as zone_name,
        z.costo_base as cost,
        z.tiempo_estimado as time
      FROM zonas_entrega z
      WHERE z.activo = 1 AND (
        LOWER(z.nombre) LIKE ? OR
        LOWER(z.descripcion) LIKE ? OR
        FIND_IN_SET(?, LOWER(REPLACE(z.barrios_incluidos, ' ', ''))) > 0
      )
      ORDER BY z.orden
      LIMIT 1
    `;
    
    const params = [
      `%${normalizedAddress}%`,
      `%${normalizedAddress}%`,
      normalizedAddress
    ];
    
    const result = await getOne(query, params);
    
    if (result) {
      return {
        covered: true,
        zone: result.zone_name,
        cost: result.cost,
        estimatedTime: result.time
      };
    } else {
      return {
        covered: false,
        message: 'Zona no cubierta por nuestro servicio de delivery'
      };
    }
    
  } catch (error) {
    console.error('Error verificando cobertura:', error);
    return {
      covered: false,
      error: error.message
    };
  }
};

/**
 * Información de respaldo en caso de error de BD
 */
const getFallbackShippingInfo = async () => {
  return {
    zones: [
      {
        name: 'Centro',
        description: 'Microcentro y zonas céntricas',
        cost: 300,
        time: '2-3 horas'
      },
      {
        name: 'Zona Norte',
        description: 'Recoleta, Palermo, Belgrano',
        cost: 400,
        time: '3-4 horas'
      },
      {
        name: 'Zona Sur',
        description: 'San Telmo, La Boca, Barracas',
        cost: 400,
        time: '3-4 horas'
      }
    ],
    costs: {
      'Centro': { standard: 300, express: 450 },
      'Zona Norte': { standard: 400, express: 600 },
      'Zona Sur': { standard: 400, express: 600 }
    },
    timeEstimates: {
      'Centro': { standard: '2-3 horas', express: '1-2 horas' },
      'Zona Norte': { standard: '3-4 horas', express: '2-3 horas' },
      'Zona Sur': { standard: '3-4 horas', express: '2-3 horas' }
    },
    policies: getDefaultShippingPolicies(),
    queryType: 'fallback'
  };
};

module.exports = {
  getShippingInformation,
  getShippingZones,
  getShippingCosts,
  getDeliveryTimes,
  getShippingPolicies,
  calculateShippingCost,
  checkCoverageArea,
  analyzeShippingQuery
};