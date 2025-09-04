const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tortas_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
  // Removidas todas las opciones que causan warnings en MySQL2
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a base de datos exitosa');
    console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
    console.log(`🖥️  Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
    // Liberar la conexión
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    return false;
  }
};

// Función genérica para ejecutar queries
const executeQuery = async (query, params = []) => {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Error ejecutando query:', error.message);
    console.error('Query:', query);
    console.error('Parámetros:', params);
    throw new Error(`Error en base de datos: ${error.message}`);
  }
};

// Función para obtener una sola fila
const getOne = async (query, params = []) => {
  try {
    const rows = await executeQuery(query, params);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Función para obtener múltiples filas
const getMany = async (query, params = []) => {
  try {
    const rows = await executeQuery(query, params);
    return rows || [];
  } catch (error) {
    throw error;
  }
};

// Función para insertar datos
const insert = async (query, params = []) => {
  try {
    const [result] = await pool.execute(query, params);
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows
    };
  } catch (error) {
    console.error('Error insertando datos:', error.message);
    throw new Error(`Error insertando: ${error.message}`);
  }
};

// Función para actualizar datos
const update = async (query, params = []) => {
  try {
    const [result] = await pool.execute(query, params);
    return {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows
    };
  } catch (error) {
    console.error('Error actualizando datos:', error.message);
    throw new Error(`Error actualizando: ${error.message}`);
  }
};

// Función para cerrar el pool de conexiones
const closeConnection = async () => {
  try {
    await pool.end();
    console.log('🔒 Pool de conexiones cerrado');
  } catch (error) {
    console.error('Error cerrando conexiones:', error.message);
  }
};

// Exportar funciones y objetos
module.exports = {
  pool,
  testConnection,
  executeQuery,
  getOne,
  getMany,
  insert,
  update,
  closeConnection
};