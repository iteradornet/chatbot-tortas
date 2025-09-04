const express = require('express');
const router = express.Router();
const { testConnection } = require('../config/database');
const { testGeminiConnection } = require('../config/gemini');
const { getAllowedOrigins } = require('../middleware/cors');

// Ruta principal de información de la API
router.get('/', (req, res) => {
  res.json({
    name: 'Chatbot API - Tienda de Tortas',
    version: '1.0.0',
    description: 'API para chatbot especializado en tienda de tortas y repostería',
    status: 'active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      chat: 'POST /api/chat - Enviar mensaje al chatbot',
      health: 'GET /health - Estado del servicio',
      info: 'GET /api - Información de la API',
      status: 'GET /api/status - Estado detallado de servicios'
    },
    features: [
      'Consultas sobre productos',
      'Información de envíos',
      'Medios de pago',
      'Creación de tortas personalizadas con IA',
      'Clasificación automática de preguntas'
    ],
    supportedCategories: [
      'productos',
      'envios',
      'medios_pagos',
      'creacion_torta',
      'general'
    ]
  });
});

// Ruta de estado detallado de servicios
router.get('/status', async (req, res) => {
  const status = {
    api: {
      status: 'online',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    },
    database: {
      status: 'checking...',
      connected: false,
      lastCheck: null
    },
    gemini: {
      status: 'checking...',
      connected: false,
      lastCheck: null
    },
    cors: {
      allowedOrigins: getAllowedOrigins(),
      status: 'configured'
    }
  };

  try {
    // Verificar conexión a base de datos
    const dbConnection = await testConnection();
    status.database = {
      status: dbConnection ? 'connected' : 'disconnected',
      connected: dbConnection,
      lastCheck: new Date().toISOString(),
      host: process.env.DB_HOST,
      database: process.env.DB_NAME
    };
  } catch (error) {
    status.database = {
      status: 'error',
      connected: false,
      lastCheck: new Date().toISOString(),
      error: error.message
    };
  }

  try {
    // Verificar conexión con Gemini
    const geminiConnection = await testGeminiConnection();
    status.gemini = {
      status: geminiConnection ? 'connected' : 'disconnected',
      connected: geminiConnection,
      lastCheck: new Date().toISOString(),
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    };
  } catch (error) {
    status.gemini = {
      status: 'error',
      connected: false,
      lastCheck: new Date().toISOString(),
      error: error.message
    };
  }

  // Determinar estado general
  const overallStatus = status.database.connected && status.gemini.connected ? 'healthy' : 'degraded';
  
  res.status(overallStatus === 'healthy' ? 200 : 503).json({
    overall: overallStatus,
    services: status,
    checks: {
      database: status.database.connected,
      gemini: status.gemini.connected,
      api: true
    }
  });
});

// Ruta para obtener información de configuración (sin datos sensibles)
router.get('/config', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'development',
    rateLimiting: {
      windowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000,
      maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 100
    },
    chatbot: {
      maxResponseLength: process.env.CHATBOT_MAX_RESPONSE_LENGTH || 500,
      timeout: process.env.CHATBOT_TIMEOUT || 10000
    },
    features: {
      imageGeneration: false, // Por ahora deshabilitado
      conversationMemory: false, // Función futura
      multiLanguage: false // Función futura
    },
    version: '1.0.0',
    lastUpdated: '2025-01-01'
  });
});

// Ruta para estadísticas básicas (sin datos personales)
router.get('/stats', (req, res) => {
  res.json({
    uptime: {
      seconds: Math.floor(process.uptime()),
      formatted: formatUptime(process.uptime())
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      arch: process.arch
    },
    timestamp: new Date().toISOString()
  });
});

// Ruta para probar conectividad básica
router.get('/ping', (req, res) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    latency: Date.now() - req.startTime
  });
});

// Middleware para medir latencia en /ping
router.use('/ping', (req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Función helper para formatear uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  result += `${secs}s`;
  
  return result.trim();
}

module.exports = router;