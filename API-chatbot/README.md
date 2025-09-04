# Chatbot API - Tienda de Tortas

API especializada para chatbot de tienda de tortas y repostería con integración de Gemini AI.

## 🚀 Características

- **Clasificación inteligente** de mensajes en categorías específicas
- **Integración con Gemini AI** para respuestas naturales
- **Consultas a base de datos** existente para información actualizada
- **Creación de tortas personalizadas** con IA
- **API RESTful** bien estructurada y documentada
- **Manejo robusto de errores** y validaciones
- **Rate limiting** y medidas de seguridad

## 📋 Categorías Soportadas

1. **Productos** - Información sobre tortas, sabores, precios, ingredientes
2. **Envíos** - Zonas de entrega, costos, tiempos, políticas
3. **Medios de Pago** - Formas de pago, facturación, financiación
4. **Creación de Tortas** - Diseño personalizado con IA

## 🛠️ Instalación

### Prerrequisitos

- Node.js >= 16.0.0
- MySQL (para base de datos existente)
- API Key de Google Gemini AI

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tuusuario/chatbot-api.git
cd chatbot-api
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos (usar tu BD existente)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=tu_base_de_datos

# Gemini AI
GEMINI_API_KEY=tu_api_key_aqui
GEMINI_MODEL=gemini-1.5-flash

# CORS (agregar tu dominio)
CORS_ORIGIN=http://localhost:3000,https://tu-dominio.com
```

4. **Iniciar el servidor**

Desarrollo:
```bash
npm run dev
```

Producción:
```bash
npm start
```

## 📡 API Endpoints

### Información General

- `GET /health` - Health check del servicio
- `GET /api` - Información general de la API
- `GET /api/status` - Estado detallado de servicios
- `GET /api/config` - Configuración pública

### Chat

- `POST /api/chat` - **Endpoint principal del chatbot**
- `GET /api/chat/categories` - Información sobre categorías
- `GET /api/chat/examples` - Ejemplos de conversación
- `POST /api/chat/validate` - Validar formato de mensaje

### Ejemplos de uso

#### Enviar mensaje al chatbot

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Qué sabores de torta tienen disponibles?",
    "userId": "user123",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

#### Respuesta exitosa

```json
{
  "success": true,
  "message": "Tenemos una gran variedad de sabores: chocolate, vainilla, fresa, red velvet, zanahoria, limón, y café. También manejamos sabores especiales como dulce de leche y tres leches. ¿Hay algún sabor en particular que te interese?",
  "category": "productos",
  "confidence": 0.95,
  "additionalInfo": {
    "products": [...],
    "suggestions": [...]
  },
  "metadata": {
    "processingTime": 1250,
    "timestamp": "2025-01-01T12:00:00.000Z",
    "userId": "user123",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## 🗂️ Estructura del Proyecto

```
chatbot-api/
├── src/
│   ├── app.js                 # Aplicación principal
│   ├── config/
│   │   ├── database.js        # Configuración BD
│   │   └── gemini.js          # Configuración Gemini AI
│   ├── controllers/
│   │   ├── chatController.js  # Lógica principal del chat
│   │   └── classifierController.js # Clasificación de mensajes
│   ├── services/
│   │   ├── geminiService.js   # Integración con Gemini
│   │   ├── productService.js  # Servicio de productos
│   │   ├── shippingService.js # Servicio de envíos
│   │   ├── paymentService.js  # Servicio de pagos
│   │   └── cakeService.js     # Servicio de creación de tortas
│   ├── routes/
│   │   ├── index.js          # Rutas generales
│   │   └── chat.js           # Rutas del chat
│   ├── middleware/
│   │   ├── cors.js           # Configuración CORS
│   │   ├── validation.js     # Validación de datos
│   │   └── errorHandler.js   # Manejo de errores
│   └── utils/
│       ├── constants.js      # Constantes
│       ├── responses.js      # Formateadores de respuesta
│       └── classifier.js     # Utilidades de clasificación
├── package.json
├── .env
└── README.md
```

## 🔧 Configuración de Base de Datos

La API está diseñada para trabajar con tu base de datos existente. Asegúrate de que las tablas principales existan:

### Tablas requeridas (ajustar según tu estructura):

- `productos` - Información de productos
- `categorias` - Categorías de productos  
- `zonas_entrega` - Zonas de envío
- `medios_pago` - Métodos de pago
- `configuraciones` - Configuraciones del sistema

## 🤖 Integración con Gemini AI

1. **Obtener API Key**
   - Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Crea una nueva API key
   - Agrégala a tu archivo `.env`

2. **Configurar modelo**
   - Por defecto usa `gemini-1.5-flash`
   - Puedes cambiar el modelo en `.env`

## 🚦 Rate Limiting

Por defecto:
- 100 requests por IP cada 15 minutos
- Configurable via variables de entorno

## 🔒 Seguridad

- Headers de seguridad con Helmet
- Validación de entrada con Joi
- Sanitización de mensajes
- CORS configurado
- Rate limiting

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Linting
npm run lint
npm run lint:fix
```

## 📝 Logs

En desarrollo: logs detallados en consola
En producción: logs estructurados

## 🔄 Flujo de Procesamiento

1. **Recepción** → Mensaje del usuario
2. **Validación** → Validar formato y contenido
3. **Clasificación** → Determinar categoría (productos/envíos/pagos/tortas)
4. **Consulta BD** → Obtener información relevante
5. **Generación IA** → Crear respuesta con Gemini
6. **Respuesta** → Enviar respuesta formateada

## 🐛 Troubleshooting

### Error de conexión a BD
```bash
# Verificar conexión
npm run db:test
```

### Error de Gemini API
- Verificar API key en `.env`
- Revisar cuotas en Google Cloud Console

### CORS errors
- Agregar tu dominio a `CORS_ORIGIN` en `.env`

## 🚀 Deployment

### Producción

1. **Variables de entorno**
```env
NODE_ENV=production
GEMINI_API_KEY=tu_api_key_production
DB_HOST=tu_host_produccion
# ... otras variables
```

2. **PM2 (recomendado)**
```bash
npm install -g pm2
pm2 start src/app.js --name "chatbot-api"
```

3. **Docker**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear branch para feature
3. Commit con mensajes descriptivos
4. Push al branch
5. Crear Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles

## 📞 Soporte

Para soporte técnico:
- Issues: GitHub Issues
- Email: tu-email@dominio.com
- Documentación: [Wiki del proyecto]

---
