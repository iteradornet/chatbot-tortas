const { getMany } = require('../config/database');
const { createError } = require('../middleware/errorHandler');

/**
 * Obtiene todos los productos de la base de datos para pasarlos a la IA.
 * @returns {Promise<Object>} - Un objeto con la lista de productos y metadatos.
 */
const getProductInformation = async () => {
  try {
    console.log('🎂 Consultando todos los productos para la IA');
    
    // Obtener todos los productos activos de la base de datos.
    const query = `
      SELECT 
        id, nombre as name, descripcion as description, 
        precio as price, id_categoria as category_id,
        sabor as flavor, disponible as available,
        ingredientes as ingredients, imagen as image
      FROM productos 
      WHERE activo = 1
      ORDER BY nombre
    `;
    
    const products = await getMany(query);
    console.log(products)
    // La IA procesará toda esta información para generar una respuesta.
    return {
      products: products,
      queryType: 'all-products-for-ia',
      suggestions: ['La información de todos los productos ha sido cargada.'],
    };
    
  } catch (error) {
    console.error('Error obteniendo productos para la IA:', error);
    // En caso de error, retornar una lista vacía para evitar fallos.
    return {
      products: [],
      queryType: 'fallback',
      suggestions: ['Hubo un error al cargar la información de los productos.']
    };
  }
};

/**
 * Esta función ya no es necesaria en este enfoque simplificado.
 */
const getProductById = async (productId) => {
  // Mantener la función, pero su uso dependerá de la lógica de tu IA.
  try {
    const query = `
      SELECT 
        p.id, p.nombre as name, p.descripcion as description, 
        p.precio as price, p.sabor as flavor, p.disponible as available,
        p.ingredientes as ingredients, p.imagen as image,
        c.nombre as category_name
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id
      WHERE p.id = ? AND p.activo = 1
    `;
    return await getOne(query, [productId]);
  } catch (error) {
    console.error('Error obteniendo producto por ID:', error);
    return null;
  }
};

module.exports = {
  getProductInformation,
  getProductById,
};