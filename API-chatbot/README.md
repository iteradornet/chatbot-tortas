# Chatbot API - Tienda de Tortas

API especializada para chatbot de tienda de tortas y repostería con integración de **Gemini AI** y **DALL-E** para generación de imágenes.

## 🚀 Características

- **Clasificación inteligente** de mensajes en categorías específicas
- **Integración con Gemini AI** para respuestas naturales
- **Generación de imágenes con DALL-E** para tortas personalizadas
- **Consultas a base de datos** existente para información actualizada
- **Creación de tortas personalizadas** con IA (descripción + imagen)
- **API RESTful** bien estructurada y documentada
- **Manejo robusto de errores** y validaciones
- **Rate limiting** y medidas de seguridad

## 📋 Categorías Soportadas

1. **Productos** - Información sobre tortas, sabores, precios, ingredientes
2. **Envíos** - Zonas de entrega, costos, tiempos, políticas
3. **Medios de Pago** - Formas de pago, facturación, financiación
4. **Creación de Tortas** - Diseño personalizado con IA (texto + imagen generada)

## 🛠️ Instalación

### Prerrequisitos

- Node.js >= 16.0.0
- MySQL (para base de datos existente)
- API Key de Google Gemini AI
- **API Key de OpenAI** (para DALL-E)

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/iteradornet/chatbot-tortas.git
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

# OpenAI DALL-E (NUEVO)
OPENAI_API_KEY=tu_openai_api_key_aqui

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
- `GET /api/status` - Estado detallado de servicios (incluye OpenAI)
- `GET /api/config` - Configuración pública

### Chat

- `POST /api/chat` - **Endpoint principal del chatbot**
- `GET /api/chat/categories` - Información sobre categorías
- `GET /api/chat/examples` - Ejemplos de conversación
- `POST /api/chat/validate` - Validar formato de mensaje

### Ejemplos de uso

#### Enviar mensaje para crear torta personalizada

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Quiero una torta de cumpleaños para niña de 5 años, tema princesas, color rosa",
    "userId": "user123",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

#### Respuesta con imagen generada

```json
{
  "success": true,
  "message": "¡Perfecto! He diseñado una hermosa torta de princesas para la pequeña. Será una torta de dos pisos con decoración en tonos rosa y dorado, con figuras de princesas, corona comestible y detalles florales...",
  "category": "creacion_torta",
  "confidence": 0.98,
  "imageGenerated": true,
  "imageData": {
    "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/private/...",
    "description": "Torta personalizada generada con IA basada en: torta princesas niña rosa",
    "model": "dall-e-3",
    "size": "1024x1024",
    "quality": "standard"
  },
  "additionalInfo": {
    "suggestions": [...],
    "customizations": [...]
  },
  "metadata": {
    "processingTime": 3500,
    "timestamp": "2025-01-01T12:00:00.000Z",
    "userId": "user123",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### Consulta sobre productos

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Qué sabores de torta tienen disponibles?",
    "userId": "user123",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

#### Respuesta de productos

```json
{
  "success": true,
  "message": "Tenemos una gran variedad de sabores: chocolate, vainilla, fresa, red velvet, zanahoria, limón, y café. También manejamos sabores especiales como dulce de leche y tres leches. ¿Hay algún sabor en particular que te interese?",
  "category": "productos",
  "confidence": 0.95,
  "imageGenerated": false,
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
│   │   └── gemini.js          # Configuración Gemini AI + OpenAI DALL-E
│   ├── controllers/
│   │   ├── chatController.js  # Lógica principal del chat
│   │   └── classifierController.js # Clasificación de mensajes
│   ├── services/
│   │   ├── geminiService.js   # Integración con Gemini (incluye DALL-E)
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

## 🤖 Integración con IA

### Gemini AI (Google)

1. **Obtener API Key**
   - Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Crea una nueva API key
   - Agrégala a tu archivo `.env` como `GEMINI_API_KEY`

2. **Configurar modelo**
   - Por defecto usa `gemini-1.5-flash`
   - Puedes cambiar el modelo en `.env` con `GEMINI_MODEL`

### DALL-E (OpenAI) - NUEVO

1. **Obtener API Key de OpenAI**
   - Ve a [OpenAI Platform](https://platform.openai.com/api-keys)
   - Crea una nueva API key
   - Agrégala a tu archivo `.env` como `OPENAI_API_KEY`

2. **Configuración de imágenes**
   - Usa **DALL-E 3** por defecto
   - Genera imágenes de **1024x1024** píxeles
   - Optimiza automáticamente los prompts para tortas

3. **Funciones de DALL-E disponibles**
   - `generateImage()` - Genera imágenes de tortas personalizadas
   - `optimizeCakePromptForDalle()` - Optimiza prompts automáticamente
   - Manejo de errores con fallback a placeholder

## 🎨 Generación de Imágenes

### Cómo funciona

1. **Usuario solicita torta personalizada**
2. **Gemini genera descripción detallada**
3. **DALL-E genera imagen basada en la descripción**
4. **Se retorna descripción + imagen**

### Optimización automática de prompts

El sistema optimiza automáticamente los prompts para DALL-E:

```javascript
// Entrada del usuario
"torta de chocolate para cumpleaños"

// Prompt optimizado automáticamente
"Professional high-quality cake photography, detailed and realistic cake design, torta de chocolate para cumpleaños, clean white background, professional studio lighting, photorealistic, no text, no writing, high resolution, detailed"
```

### Manejo de errores de imagen

- **Si DALL-E falla**: Retorna imagen placeholder automáticamente
- **Si no hay créditos**: Informa el error pero continúa funcionando
- **Si hay filtros de contenido**: Sugiere modificar la descripción

## 🚦 Rate Limiting

Por defecto:
- 100 requests por IP cada 15 minutos
- Configurable via variables de entorno
- **Nota**: DALL-E tiene sus propios límites de OpenAI

## 🔒 Seguridad

- Headers de seguridad con Helmet
- Validación de entrada con Joi
- Sanitización de mensajes
- CORS configurado
- Rate limiting
- **Validación de API Keys** tanto para Gemini como OpenAI

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Test de conexión con servicios de IA
npm run test:ai

# Linting
npm run lint
npm run lint:fix
```

### Test de conexiones IA

```bash
# Test específico para verificar Gemini + OpenAI
node -e "
const { testAllConnections } = require('./src/config/gemini');
testAllConnections().then(result => {
  console.log('Conexiones:', result ? 'OK' : 'ERROR');
  process.exit(result ? 0 : 1);
});
"
```

## 📝 Logs

En desarrollo: logs detallados en consola
En producción: logs estructurados

### Logs específicos de IA

- `🎨 Generando imagen de torta con DALL-E`
- `✅ Imagen generada exitosamente con DALL-E`
- `❌ Error generando imagen con DALL-E`
- `✅ Conexión con OpenAI exitosa`

## 🔄 Flujo de Procesamiento

### Flujo general
1. **Recepción** → Mensaje del usuario
2. **Validación** → Validar formato y contenido
3. **Clasificación** → Determinar categoría (productos/envíos/pagos/tortas)
4. **Consulta BD** → Obtener información relevante
5. **Generación IA** → Crear respuesta con Gemini
6. **Respuesta** → Enviar respuesta formateada

### Flujo para creación de tortas (NUEVO)
1. **Clasificación como "creación_torta"**
2. **Gemini genera descripción detallada**
3. **DALL-E genera imagen personalizada**
4. **Combina descripción + imagen en respuesta**
5. **Fallback a placeholder si DALL-E falla**

## 💰 Costos y Cuotas

### Gemini AI (Google)
- Generalmente gratuito con límites generosos
- Revisar en [Google AI Studio](https://makersuite.google.com/app/apikey)

### DALL-E (OpenAI) - NUEVO
- **DALL-E 3**: ~$0.04 por imagen (1024x1024)
- **Créditos**: Se consumen por cada imagen generada
- **Límites**: Ver en [OpenAI Platform](https://platform.openai.com/usage)

**Recomendación**: Configurar alertas de facturación en OpenAI

## 🐛 Troubleshooting

### Error de conexión a BD
```bash
# Verificar conexión
npm run db:test
```

### Error de Gemini API
- Verificar API key en `.env`
- Revisar cuotas en Google Cloud Console

### Error de OpenAI/DALL-E - NUEVO
```bash
# Verificar conexión OpenAI
node -e "
const { testOpenAIConnection } = require('./src/config/gemini');
testOpenAIConnection();
"
```

**Errores comunes de OpenAI:**
- `billing`: Sin créditos disponibles
- `rate limit`: Demasiadas requests
- `API key`: Key inválida o expirada
- `content policy`: Prompt bloqueado por filtros

### CORS errors
- Agregar tu dominio a `CORS_ORIGIN` en `.env`

### Imágenes no se generan
1. Verificar `OPENAI_API_KEY` en `.env`
2. Revisar créditos en OpenAI Platform
3. Verificar logs del servidor para errores específicos
4. Sistema usa fallback automático si DALL-E falla

## 🚀 Deployment

### Producción

1. **Variables de entorno**
```env
NODE_ENV=production
GEMINI_API_KEY=tu_api_key_production
OPENAI_API_KEY=tu_openai_key_production
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

### Variables de entorno para producción

```env
# APIs de producción
GEMINI_API_KEY=gsk_prod_XXXXXXXX
OPENAI_API_KEY=sk-proj-XXXXXXXX

# Optimizaciones DALL-E
DALLE_MODEL=dall-e-3
DALLE_SIZE=1024x1024
DALLE_QUALITY=standard
```

## 🎯 Casos de Uso Avanzados

### Integración con frontend

```javascript
// Ejemplo de integración con React
const sendMessage = async (message) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      userId: 'user123',
      sessionId: generateSessionId()
    })
  });
  
  const data = await response.json();
  
  // Mostrar respuesta
  console.log('Respuesta:', data.message);
  
  // Si hay imagen generada
  if (data.imageGenerated && data.imageData) {
    displayImage(data.imageData.imageUrl);
  }
};
```

### Personalización de prompts DALL-E

```javascript
// En src/config/gemini.js puedes modificar optimizeCakePromptForDalle
const customPrompt = optimizeCakePromptForDalle("torta moderna minimalista");
console.log(customPrompt);
// Output: "Professional high-quality cake photography, detailed and realistic cake design, torta moderna minimalista, clean white background, professional studio lighting, photorealistic, no text, no writing, high resolution, detailed"
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear branch para feature
3. Commit con mensajes descriptivos
4. Push al branch
5. Crear Pull Request

### Áreas que necesitan contribución
- Optimización de prompts para DALL-E
- Nuevas categorías de clasificación
- Integración con más servicios de IA
- Tests automatizados para generación de imágenes

### Soporte específico para IA
- **Gemini AI**: [Google AI Support](https://support.google.com/)
- **OpenAI DALL-E**: [OpenAI Support](https://help.openai.com/)

## 🎉 Changelog

### v2.0.0 (ACTUAL)
- ✅ **Integración con DALL-E** para generación de imágenes
- ✅ **Optimización automática de prompts** para tortas
- ✅ **Manejo robusto de errores** con fallbacks
- ✅ **Validación de múltiples API keys**
- ✅ **Sistema de testing** para conexiones IA

### v1.0.0
- ✅ Integración básica con Gemini AI
- ✅ Clasificación de mensajes
- ✅ Consultas a base de datos
- ✅ API RESTful completa

---

