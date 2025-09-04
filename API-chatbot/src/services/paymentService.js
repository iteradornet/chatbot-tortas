const { getMany, getOne } = require('../config/database');
const { createError } = require('../middleware/errorHandler');

/**
 * Obtiene información de medios de pago basada en la consulta del usuario
 * @param {string} userMessage - Mensaje del usuario
 * @returns {Promise<Object>} - Información de pagos relevante
 */
const getPaymentInformation = async (userMessage) => {
  try {
    console.log('💳 Consultando información de medios de pago');
    
    // Analizar consulta del usuario
    const queryAnalysis = analyzePaymentQuery(userMessage);
    
    let methods = [];
    let policies = {};
    let requirements = [];
    
    // Obtener métodos de pago
    methods = await getPaymentMethods(queryAnalysis.specificMethod);
    
    // Obtener políticas de pago
    policies = await getPaymentPolicies();
    
    // Obtener requisitos según el tipo de consulta
    if (queryAnalysis.needRequirements) {
      requirements = await getPaymentRequirements(queryAnalysis.type);
    }
    
    return {
      methods: methods,
      policies: policies,
      requirements: requirements,
      queryType: queryAnalysis.type,
      searchMethod: queryAnalysis.specificMethod
    };
    
  } catch (error) {
    console.error('Error obteniendo información de medios de pago:', error);
    return await getFallbackPaymentInfo();
  }
};

/**
 * Analiza la consulta del usuario sobre medios de pago
 */
const analyzePaymentQuery = (message) => {
  const lowerMessage = message.toLowerCase();
  
  const analysis = {
    type: 'general',
    specificMethod: null,
    needRequirements: false
  };
  
  // Detectar tipo de consulta
  if (lowerMessage.includes('tarjeta') || lowerMessage.includes('credito') || 
      lowerMessage.includes('debito') || lowerMessage.includes('visa') || 
      lowerMessage.includes('mastercard')) {
    analysis.type = 'card';
    analysis.specificMethod = 'tarjeta';
    analysis.needRequirements = true;
  } else if (lowerMessage.includes('efectivo') || lowerMessage.includes('cash')) {
    analysis.type = 'cash';
    analysis.specificMethod = 'efectivo';
  } else if (lowerMessage.includes('transferencia') || lowerMessage.includes('banco')) {
    analysis.type = 'transfer';
    analysis.specificMethod = 'transferencia';
    analysis.needRequirements = true;
  } else if (lowerMessage.includes('mercado pago') || lowerMessage.includes('mercadopago') || 
             lowerMessage.includes('mp')) {
    analysis.type = 'digital';
    analysis.specificMethod = 'mercado_pago';
  } else if (lowerMessage.includes('paypal')) {
    analysis.type = 'digital';
    analysis.specificMethod = 'paypal';
  } else if (lowerMessage.includes('cuota') || lowerMessage.includes('financiacion') || 
             lowerMessage.includes('planes')) {
    analysis.type = 'financing';
    analysis.needRequirements = true;
  } else if (lowerMessage.includes('factura') || lowerMessage.includes('recibo') || 
             lowerMessage.includes('comprobante')) {
    analysis.type = 'invoice';
    analysis.needRequirements = true;
  } else if (lowerMessage.includes('descuento') || lowerMessage.includes('promocion') || 
             lowerMessage.includes('oferta')) {
    analysis.type = 'discounts';
  }
  
  return analysis;
};

/**
 * Obtiene los métodos de pago desde la base de datos
 */
const getPaymentMethods = async (specificMethod = null) => {
  try {
    let query = `
      SELECT 
        id, nombre as name, descripcion as description,
        tipo as type, activo as active, comision as fee,
        icono as icon, orden as order_priority,
        requiere_datos as requires_data
      FROM medios_pago 
      WHERE activo = 1
    `;
    
    const params = [];
    
    if (specificMethod) {
      query += ` AND (LOWER(nombre) LIKE ? OR LOWER(tipo) LIKE ?)`;
      params.push(`%${specificMethod}%`, `%${specificMethod}%`);
    }
    
    query += ` ORDER BY orden, nombre`;
    
    return await getMany(query, params);
  } catch (error) {
    console.error('Error obteniendo métodos de pago:', error);
    return [];
  }
};

/**
 * Obtiene políticas de pago
 */
const getPaymentPolicies = async () => {
  try {
    const query = `
      SELECT 
        nombre as name, valor as value, descripcion as description
      FROM configuraciones 
      WHERE categoria = 'pagos' AND activo = 1
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
      return getDefaultPaymentPolicies();
    }
    
    return policies;
  } catch (error) {
    console.error('Error obteniendo políticas de pago:', error);
    return getDefaultPaymentPolicies();
  }
};

/**
 * Obtiene requisitos específicos según tipo de pago
 */
const getPaymentRequirements = async (paymentType) => {
  try {
    const query = `
      SELECT 
        requisito as requirement, descripcion as description
      FROM requisitos_pago 
      WHERE tipo = ? AND activo = 1
      ORDER BY orden
    `;
    
    const results = await getMany(query, [paymentType]);
    
    if (results.length === 0) {
      return getDefaultRequirements(paymentType);
    }
    
    return results.map(row => ({
      requirement: row.requirement,
      description: row.description
    }));
    
  } catch (error) {
    console.error('Error obteniendo requisitos de pago:', error);
    return getDefaultRequirements(paymentType);
  }
};

/**
 * Políticas de pago por defecto
 */
const getDefaultPaymentPolicies = () => {
  return {
    'anticipo_requerido': {
      value: '50%',
      description: 'Anticipo requerido para pedidos superiores a $1000'
    },
    'tiempo_reserva': {
      value: '24 horas',
      description: 'Tiempo máximo para confirmar pago y mantener reserva'
    },
    'reembolsos': {
      value: '48 horas antes',
      description: 'Política de reembolsos hasta 48 horas antes de la entrega'
    },
    'facturacion': {
      value: 'A y B disponible',
      description: 'Emitimos facturas A y B'
    },
    'comisiones': {
      value: 'Incluidas en precio',
      description: 'Las comisiones están incluidas en el precio final'
    }
  };
};

/**
 * Requisitos por defecto según tipo de pago
 */
const getDefaultRequirements = (paymentType) => {
  const requirements = {
    card: [
      { requirement: 'Tarjeta válida', description: 'Tarjeta de crédito o débito vigente' },
      { requirement: 'DNI del titular', description: 'Documento de identidad del titular de la tarjeta' },
      { requirement: 'Código de seguridad', description: 'CVV de la tarjeta' }
    ],
    transfer: [
      { requirement: 'Datos bancarios', description: 'CBU y datos de la cuenta bancaria' },
      { requirement: 'Comprobante', description: 'Enviar comprobante de transferencia' },
      { requirement: 'Referencia', description: 'Indicar número de pedido en la transferencia' }
    ],
    financing: [
      { requirement: 'Monto mínimo', description: 'Pedidos superiores a $2000 para financiación' },
      { requirement: 'Aprobación crediticia', description: 'Sujeto a aprobación de la entidad financiera' },
      { requirement: 'Anticipo 30%', description: 'Se requiere anticipo del 30%' }
    ],
    invoice: [
      { requirement: 'CUIT/CUIL', description: 'Número de CUIT o CUIL para facturación' },
      { requirement: 'Razón social', description: 'Nombre o razón social completa' },
      { requirement: 'Domicilio fiscal', description: 'Dirección fiscal registrada' }
    ]
  };
  
  return requirements[paymentType] || [];
};

/**
 * Calcula comisiones por método de pago
 */
const calculatePaymentFee = async (paymentMethodId, amount) => {
  try {
    const query = `
      SELECT 
        nombre as name, comision as fee_percentage,
        comision_fija as fixed_fee, maximo_comision as max_fee
      FROM medios_pago 
      WHERE id = ? AND activo = 1
    `;
    
    const method = await getOne(query, [paymentMethodId]);
    
    if (!method) {
      return {
        fee: 0,
        error: 'Método de pago no encontrado'
      };
    }
    
    let calculatedFee = 0;
    
    // Calcular comisión porcentual
    if (method.fee_percentage > 0) {
      calculatedFee = (amount * method.fee_percentage) / 100;
    }
    
    // Agregar comisión fija si existe
    if (method.fixed_fee > 0) {
      calculatedFee += method.fixed_fee;
    }
    
    // Aplicar máximo si existe
    if (method.max_fee > 0 && calculatedFee > method.max_fee) {
      calculatedFee = method.max_fee;
    }
    
    return {
      fee: calculatedFee,
      feePercentage: method.fee_percentage,
      fixedFee: method.fixed_fee,
      maxFee: method.max_fee,
      total: amount + calculatedFee,
      methodName: method.name
    };
    
  } catch (error) {
    console.error('Error calculando comisión:', error);
    return {
      fee: 0,
      error: error.message
    };
  }
};

/**
 * Verifica disponibilidad de financiación
 */
const checkFinancingAvailability = async (amount, customerData = {}) => {
  try {
    const policies = await getPaymentPolicies();
    const minAmount = parseInt(policies.financiacion_minima?.value || '2000');
    
    if (amount < minAmount) {
      return {
        available: false,
        reason: `Monto mínimo para financiación: $${minAmount}`,
        minAmount: minAmount
      };
    }
    
    // Obtener planes de financiación disponibles
    const query = `
      SELECT 
        cuotas as installments, interes as interest_rate,
        descripcion as description, activo as active
      FROM planes_financiacion 
      WHERE activo = 1 AND monto_minimo <= ?
      ORDER BY cuotas
    `;
    
    const plans = await getMany(query, [amount]);
    
    return {
      available: true,
      plans: plans,
      requiredAdvance: amount * 0.3, // 30% de anticipo
      amount: amount
    };
    
  } catch (error) {
    console.error('Error verificando financiación:', error);
    return {
      available: false,
      error: error.message
    };
  }
};

/**
 * Información de respaldo en caso de error de BD
 */
const getFallbackPaymentInfo = async () => {
  return {
    methods: [
      {
        name: 'Efectivo',
        description: 'Pago en efectivo contra entrega',
        type: 'cash',
        fee: 0
      },
      {
        name: 'Tarjeta de Crédito/Débito',
        description: 'Visa, Mastercard, American Express',
        type: 'card',
        fee: 3.5
      },
      {
        name: 'Transferencia Bancaria',
        description: 'CBU y datos bancarios disponibles',
        type: 'transfer',
        fee: 0
      },
      {
        name: 'Mercado Pago',
        description: 'Pago digital con Mercado Pago',
        type: 'digital',
        fee: 2.9
      }
    ],
    policies: getDefaultPaymentPolicies(),
    requirements: [
      'Los precios incluyen IVA',
      'Aceptamos facturas A y B',
      'Descuentos por pago en efectivo'
    ],
    queryType: 'fallback'
  };
};

module.exports = {
  getPaymentInformation,
  getPaymentMethods,
  getPaymentPolicies,
  getPaymentRequirements,
  calculatePaymentFee,
  checkFinancingAvailability,
  analyzePaymentQuery
};