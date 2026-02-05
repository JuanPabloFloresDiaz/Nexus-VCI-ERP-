/**
 * Helper para procesar parámetros de paginación y filtrado desde la URL (req.query).
 * Devuelve un objeto listo para usar en Sequelize (limit, offset, order, where).
 * 
 * @param {Object} queryParams - req.query
 * @returns {Object} { limit, offset, order, query }
 */
const getPaginatedQuery = (queryParams = {}) => {
  // Extraer parámetros reservados para paginación/orden
  // search se extrae en el controlador usualmente para lógica específica (OR, LIKE)
  const {
    page = 1,
    limit = 10,
    sort = 'created_at',
    order = 'DESC',
    search,
    ...filters
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  // Validación básica de orden
  const validOrders = ['ASC', 'DESC'];
  const sortOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

  return {
    limit: limitNum,
    offset,
    order: [[sort, sortOrder]],
    query: filters // El resto de parámetros se consideran filtros directos (where)
  };
};

module.exports = getPaginatedQuery;
