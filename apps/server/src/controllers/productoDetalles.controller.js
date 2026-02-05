const { ProductoDetallesFiltros, Productos, OpcionesFiltro } = require('../models');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');

class ProductoDetallesController {
    static routes = '/producto-detalles';

    static store = catchErrors(async (req, res) => {
        const { id_producto, id_opcion_filtro } = req.body;

        const producto = await Productos.findByPk(id_producto);
        if (!producto) {
            return ApiResponse.error(res, {
                error: 'Producto no encontrado',
                status: 404,
                route: this.routes
            });
        }

        const opcion = await OpcionesFiltro.findByPk(id_opcion_filtro);
        if (!opcion) {
            return ApiResponse.error(res, {
                error: 'Opción de filtro no encontrada',
                status: 404,
                route: this.routes
            });
        }

        // Check for duplicates
        const existing = await ProductoDetallesFiltros.findOne({
            where: { id_producto, id_opcion_filtro }
        });

        if (existing) {
            return ApiResponse.error(res, {
                error: 'El producto ya tiene esta opción asociada',
                status: 400,
                route: this.routes
            });
        }

        const detalle = await ProductoDetallesFiltros.create({
            id_producto,
            id_opcion_filtro
        });

        return ApiResponse.success(res, {
            data: detalle,
            message: 'Detalle agregado exitosamente',
            status: 201,
            route: this.routes
        });
    });

    static destroy = catchErrors(async (req, res) => {
        const { id } = req.params;
        const detalle = await ProductoDetallesFiltros.findByPk(id);

        if (!detalle) {
            return ApiResponse.error(res, {
                error: 'Detalle no encontrado',
                status: 404,
                route: `${this.routes}/${id}`
            });
        }

        await detalle.destroy({ force: true }); // Usually hard delete for join table association removal

        return ApiResponse.success(res, {
            data: null,
            message: 'Detalle eliminado correctamente',
            status: 200,
            route: `${this.routes}/${id}`
        });
    });
}

module.exports = ProductoDetallesController;
