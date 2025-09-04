const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
require('dotenv').config();

// Validar que existen las API keys
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY no está configurada en las variables de entorno');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY no está configurada en las variables de entorno');
  process.exit(1);
}

// Inicializar clientes
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuración del modelo Gemini
const modelConfig = {
  model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: parseInt(process.env.CHATBOT_MAX_RESPONSE_LENGTH) || 500,
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ]
};

// Configuración de DALL-E
const dalleConfig = {
  model: "dall-e-3",
  size: "1024x1024",
  quality: "standard",
  n: 1,
};

// Obtener modelo configurado
const getModel = () => {
  try {
    return genAI.getGenerativeModel(modelConfig);
  } catch (error) {
    console.error('Error obteniendo modelo de Gemini:', error.message);
    throw new Error('Error configurando Gemini AI');
  }
};

// Función para generar texto
const generateText = async (prompt, context = '') => {
  try {
    const model = getModel();
    
    // Crear prompt completo con contexto si se proporciona
    const fullPrompt = context ? `${context}\n\nPregunta del usuario: ${prompt}` : prompt;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      success: true,
      text: text.trim(),
      usage: {
        promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
        candidateTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.response.usageMetadata?.totalTokenCount || 0
      }
    };
    
  } catch (error) {
    console.error('Error generando texto con Gemini:', error.message);
    
    // Manejo específico de errores de Gemini
    let errorMessage = 'Error generando respuesta';
    
    if (error.message.includes('API_KEY')) {
      errorMessage = 'Error de autenticación con Gemini AI';
    } else if (error.message.includes('QUOTA')) {
      errorMessage = 'Límite de cuota excedido';
    } else if (error.message.includes('SAFETY')) {
      errorMessage = 'Contenido bloqueado por filtros de seguridad';
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.message
    };
  }
};

// Función para optimizar prompt para DALL-E
const optimizeCakePromptForDalle = (userPrompt) => {
  // Prompt base optimizado para generar tortas realistas y atractivas
  const basePrompt = "Professional high-quality cake photography, detailed and realistic cake design";
  
  // Palabras clave para mejorar la generación
  const enhancementWords = [
    "beautiful decoration",
    "professional bakery style",
    "elegant presentation",
    "vibrant colors",
    "detailed frosting work",
    "clean white background",
    "studio lighting"
  ];
  
  // Combinar el prompt del usuario con mejoras
  let optimizedPrompt = `${basePrompt}, ${userPrompt}`;
  
  // Agregar mejoras contextuales
  if (!userPrompt.toLowerCase().includes('background')) {
    optimizedPrompt += ", clean white background";
  }
  
  if (!userPrompt.toLowerCase().includes('lighting')) {
    optimizedPrompt += ", professional studio lighting";
  }
  
  if (!userPrompt.toLowerCase().includes('realistic')) {
    optimizedPrompt += ", photorealistic";
  }
  
  // Agregar restricciones para evitar elementos no deseados
  optimizedPrompt += ", no text, no writing, high resolution, detailed";
  
  return optimizedPrompt;
};

// Función para generar imagen usando DALL-E
const generateImage = async (prompt, imageConfig = {}) => {
  try {
    console.log('🎨 Generando imagen de torta con DALL-E:', prompt);
    
    // Optimizar el prompt para DALL-E
    const optimizedPrompt = optimizeCakePromptForDalle(prompt);
    
    // Configuración final combinando defaults con parámetros
    const finalConfig = {
      ...dalleConfig,
      ...imageConfig,
      prompt: optimizedPrompt
    };
    
    // Llamada a DALL-E
    const response = await openai.images.generate(finalConfig);
    
    if (response.data && response.data.length > 0) {
      const imageData = response.data[0];
      
      console.log('✅ Imagen generada exitosamente con DALL-E');
      
      return {
        success: true,
        imageUrl: imageData.url,
        description: `Torta personalizada generada con IA basada en: ${prompt}`,
        revisedPrompt: imageData.revised_prompt || optimizedPrompt,
        model: 'dall-e-3',
        size: finalConfig.size,
        quality: finalConfig.quality
      };
    } else {
      throw new Error('No se recibieron datos de imagen de DALL-E');
    }
    
  } catch (error) {
    console.error('❌ Error generando imagen con DALL-E:', error.message);
    
    // Manejo específico de errores de OpenAI
    let errorMessage = 'Error generando imagen de torta';
    let fallbackUrl = 'https://via.placeholder.com/1024x1024/FFB6C1/000000?text=Torta+Personalizada';
    
    if (error.message.includes('billing')) {
      errorMessage = 'Límite de créditos de OpenAI excedido';
    } else if (error.message.includes('API key')) {
      errorMessage = 'Error de autenticación con OpenAI';
    } else if (error.message.includes('content policy')) {
      errorMessage = 'Contenido bloqueado por políticas de OpenAI';
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Límite de solicitudes excedido, intenta de nuevo en unos minutos';
    }
    
    // Retornar respuesta con imagen placeholder en caso de error
    return {
      success: false,
      error: errorMessage,
      details: error.message,
      imageUrl: fallbackUrl,
      description: `Imagen placeholder para: ${prompt}`,
      fallback: true
    };
  }
};

// Función para probar la conexión con Gemini (mantener original)
const testGeminiConnection = async () => {
  try {
    const testResult = await generateText('Hola, ¿funciona la conexión?');
    if (testResult.success) {
      console.log('✅ Conexión con Gemini AI exitosa');
      return true;
    } else {
      console.error('❌ Error probando Gemini:', testResult.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error conectando con Gemini:', error.message);
    return false;
  }
};

// Función para probar la conexión con OpenAI
const testOpenAIConnection = async () => {
  try {
    const testResult = await openai.models.list();
    if (testResult && testResult.data) {
      console.log('✅ Conexión con OpenAI exitosa');
      return true;
    } else {
      console.error('❌ Error probando OpenAI');
      return false;
    }
  } catch (error) {
    console.error('❌ Error conectando con OpenAI:', error.message);
    return false;
  }
};

// Función para probar ambas conexiones
const testAllConnections = async () => {
  console.log('🔄 Probando conexiones...');
  
  const geminiStatus = await testGeminiConnection();
  const openaiStatus = await testOpenAIConnection();
  
  if (geminiStatus && openaiStatus) {
    console.log('✅ Todas las conexiones funcionan correctamente');
    return true;
  } else {
    console.log('⚠️ Algunas conexiones tienen problemas');
    console.log(`Gemini: ${geminiStatus ? '✅' : '❌'}`);
    console.log(`OpenAI: ${openaiStatus ? '✅' : '❌'}`);
    return false;
  }
};

// Prompts del sistema para diferentes categorías (mantener original)
const systemPrompts = {
  products: `Eres un asistente especializado en productos de una tienda de tortas y repostería. 
             Responde de manera amable y profesional sobre productos, sabores, precios, ingredientes y disponibilidad.
             Mantén las respuestas concisas pero informativas.`,
             
  shipping: `Eres un asistente especializado en información de envíos y entregas de una tienda de tortas.
             Proporciona información sobre zonas de entrega, tiempos, costos y políticas de envío.
             Sé claro y preciso con los detalles logísticos.`,
             
  payments: `Eres un asistente especializado en métodos de pago y facturación de una tienda de tortas.
             Explica las opciones de pago disponibles, políticas de reembolso y procesos de facturación.
             Mantén un tono profesional y confiable.`,
             
  cakes: `Eres un diseñador creativo especializado en tortas personalizadas.
          Ayuda a crear descripciones detalladas de tortas basadas en las preferencias del cliente.
          Sé creativo pero realista en las propuestas.`,
          
  general: `Eres un asistente virtual amigable de una tienda de tortas y repostería.
            Responde de manera cortés y deriva las consultas a las categorías específicas cuando sea necesario.`
};

module.exports = {
  genAI,
  openai,
  getModel,
  generateText,
  generateImage,
  testGeminiConnection,
  testOpenAIConnection,
  testAllConnections,
  systemPrompts,
  modelConfig,
  dalleConfig,
  optimizeCakePromptForDalle
};