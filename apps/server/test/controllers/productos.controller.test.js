const ProductosController = require('../../src/controllers/productos.controller');
// We need to require the module to access the mocked functions to set assertions
const Models = require('../../src/models');
const ApiResponse = require('../../src/utils/apiResponse');

// Explicit mock factory
jest.mock('../../src/models', () => ({
    Productos: {
        create: jest.fn(),
        findAndCountAll: jest.fn()
    },
    ProductoVariantes: {
        create: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn()
    },
    ProductoDetallesFiltros: {
        bulkCreate: jest.fn(),
        destroy: jest.fn()
    },
    Categorias: {},
    Marcas: {},
    Proveedores: {},
    sequelize: {
        transaction: jest.fn(),
        literal: jest.fn()
    }
}));

jest.mock('../../src/utils/apiResponse', () => ({
    success: jest.fn(),
    error: jest.fn()
}));

describe('ProductosController', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            query: {},
            body: {},
            user: { id_empresa: 'empresa-uuid', id: 'user-uuid' },
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();

        // Mock transaction
        Models.sequelize.transaction.mockImplementation(async (callback) => {
            return callback('mock-transaction');
        });
    });

    describe('store', () => {
        it('should create a product with variants successfully', async () => {
            req.body = {
                nombre_producto: 'Camiseta',
                descripcion_producto: 'Camiseta de algodón',
                id_categoria: 'cat-uuid',
                id_marca: 'marca-uuid',
                variantes: [
                    {
                        sku: 'CAM-S',
                        stock_actual: 10,
                        precio_unitario: 20,
                        detalles_filtros: [
                            { id_opcion_filtro: 'opcion-talla-s' }
                        ]
                    }
                ]
            };

            const mockProduct = { id: 'prod-uuid', ...req.body };
            Models.Productos.create.mockResolvedValue(mockProduct);

            const mockVariant = { id: 'var-uuid', sku: 'CAM-S' };
            Models.ProductoVariantes.create.mockResolvedValue(mockVariant);

            // Mock bulkCreate for details
            Models.ProductoDetallesFiltros.bulkCreate.mockResolvedValue([]);

            await ProductosController.store(req, res, next);

            expect(Models.sequelize.transaction).toHaveBeenCalled();
            expect(Models.Productos.create).toHaveBeenCalledWith(expect.objectContaining({
                nombre_producto: 'Camiseta',
                id_empresa: 'empresa-uuid'
            }), expect.anything());

            expect(Models.ProductoVariantes.create).toHaveBeenCalledWith(expect.objectContaining({
                sku: 'CAM-S',
                stock_actual: 10,
                id_producto: 'prod-uuid'
            }), expect.anything());

            expect(ApiResponse.success).toHaveBeenCalled();
        });
    });
});
