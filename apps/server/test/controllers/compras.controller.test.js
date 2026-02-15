const ComprasController = require('../../src/controllers/compras.controller');
const { Compras, DetallesCompras, Proveedores, Productos, ProductoVariantes, sequelize } = require('../../src/models');
const ApiResponse = require('../../src/utils/apiResponse');

jest.mock('../../src/models');
jest.mock('../../src/utils/apiResponse');

describe('ComprasController', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
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

        sequelize.transaction.mockImplementation(async (callback) => {
            return callback('mock-transaction');
        });
    });

    describe('store', () => {
        it('should create a purchase and increment variant stock if recieved', async () => {
            req.body = {
                id_proveedor: 'prov-uuid',
                estado_compra: 'Recibido',
                detalles: [
                    { id_variante: 'var-uuid', cantidad: 10, precio_costo_historico: 50 }
                ]
            };

            Proveedores.findOne.mockResolvedValue({ id: 'prov-uuid' });

            const mockVariant = {
                id: 'var-uuid',
                id_producto: 'prod-uuid',
                stock_actual: 0,
                path: 'prod-path',
                increment: jest.fn(),
                update: jest.fn()
            };
            ProductoVariantes.findOne.mockResolvedValue(mockVariant);

            const mockCompra = { id: 'compra-uuid', total_compra: 500 };
            Compras.create.mockResolvedValue(mockCompra);

            await ComprasController.store(req, res, next);

            expect(mockVariant.increment).toHaveBeenCalledWith('stock_actual', expect.objectContaining({
                by: 10
            }));

            expect(mockVariant.update).toHaveBeenCalledWith(expect.objectContaining({
                costo_unitario: 50
            }), expect.anything());

            expect(DetallesCompras.bulkCreate).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({
                    id_variante: 'var-uuid',
                    cantidad: 10,
                    id_compra: 'compra-uuid'
                })
            ]), expect.anything());

            expect(ApiResponse.success).toHaveBeenCalled();
        });
    });
});
