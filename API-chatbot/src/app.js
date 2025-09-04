const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar middlewares
const corsMiddleware = require('./middleware/cors');
const { errorHandler } = require('./middleware/errorHandler');
const { validateChatRequest } = require('./middleware/validation');

// Importar rutas
const indexRoutes = require('./routes/index');
const chatRoutes = require('./routes/chat');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad y utilidad
app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitado para desarrollo
  crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Configuración de CORS
app.use(corsMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000, // 5 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Parseo de JSON
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));

app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

// Middleware de validación para el chat
app.use('/api/chat', (req, res, next) => {
  // Solo aplicar validación a rutas POST
  if (req.method === 'POST') {
    return validateChatRequest(req, res, next);
  }
  next();
});

// Rutas principales
app.use('/api', indexRoutes);
app.use('/api/chat', chatRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Chatbot API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta por defecto para requests no encontrados
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: 'La ruta solicitada no existe',
    availableEndpoints: [
      'GET /health - Health check',
      'GET /api - Información de la API',
      'GET /api/status - Estado de servicios',
      'GET /api/config - Configuración pública',
      'GET /api/chat/categories - Categorías disponibles',
      'GET /api/chat/examples - Ejemplos de uso',
      'POST /api/chat - Enviar mensaje al chatbot'
    ]
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada en:', promise, 'razón:', reason);
  process.exit(1);
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 Health check disponible en: http://localhost:${PORT}/health`);
  console.log(`🤖 API del chatbot disponible en: http://localhost:${PORT}/api/chat`);
  console.log(`📖 Documentación disponible en: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

module.exports = app;