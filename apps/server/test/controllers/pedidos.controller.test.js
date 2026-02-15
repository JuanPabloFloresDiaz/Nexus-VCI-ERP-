const PedidosController = require('../../src/controllers/pedidos.controller');
const { Pedidos, DetallesPedidos, Productos, ProductoVariantes, Clientes, sequelize } = require('../../src/models');
const ApiResponse = require('../../src/utils/apiResponse');
const { sendMail } = require('../../src/utils/mail');

jest.mock('../../src/models');
jest.mock('../../src/utils/apiResponse');
jest.mock('../../src/utils/mail');
jest.mock('../../src/utils/invoiceGenerator', () => ({
    generateInvoicePdfBuffer: jest.fn().mockResolvedValue(Buffer.from('pdf'))
}));

describe('PedidosController', () => {
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
        it('should create an order and decrement variant stock', async () => {
            req.body = {
                id_cliente: 'cli-uuid',
                detalles: [
                    { id_variante: 'var-uuid', cantidad: 2, precio_historico: 100 }
                ]
            };

            const mockCliente = { id: 'cli-uuid', corre_cliente: 'test@test.com' };
            Clientes.findOne.mockResolvedValue(mockCliente);

            const mockVariant = {
                id: 'var-uuid',
                id_producto: 'prod-uuid',
                sku: 'SKU-1',
                stock_actual: 10,
                producto: { nombre_producto: 'Producto 1' },
                decrement: jest.fn(),
                save: jest.fn()
            };
            ProductoVariantes.findOne.mockResolvedValue(mockVariant);

            const mockPedido = { id: 'pedido-uuid', total_pedido: 200 };
            Pedidos.create.mockResolvedValue(mockPedido);
            Pedidos.findByPk.mockResolvedValue(mockPedido); // For invoice generation

            await PedidosController.store(req, res, next);

            expect(mockVariant.decrement).toHaveBeenCalledWith('stock_actual', expect.objectContaining({
                by: 2
            }));

            expect(DetallesPedidos.bulkCreate).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({
                    id_variante: 'var-uuid',
                    cantidad: 2,
                    id_pedido: 'pedido-uuid'
                })
            ]), expect.anything());

            expect(ApiResponse.success).toHaveBeenCalled();
        });

        it('should throw error if insufficient stock', async () => {
            req.body = {
                id_cliente: 'cli-uuid',
                detalles: [
                    { id_variante: 'var-uuid', cantidad: 20, precio_historico: 100 }
                ]
            };

            Clientes.findOne.mockResolvedValue({ id: 'cli-uuid' });

            const mockVariant = {
                id: 'var-uuid',
                stock_actual: 5,
                producto: { nombre_producto: 'Producto 1' },
                sku: 'SKU-1'
            };
            ProductoVariantes.findOne.mockResolvedValue(mockVariant);

            // Since we use catchErrors middleware in real app but here we call static method directly, 
            // the error will be thrown and caught by catchErrors wrapper if we imported it correctly.
            // Wait, catchErrors wraps the async function. So calling PedidosController.store(req, res, next)
            // should call next(error) if it fails.

            // However, depending on how catchErrors is implemented/mocked.
            // In the controller file: `const catchErrors = require('../utils/tryCatch');`
            // If I verify `next` is called with error?

            // Let's assume standard behavior. catchErrors calls next(err).
            // But wait, I didn't mock catchErrors. It's a utility.
            // If it's a simple wrapper: (fn) => (req, res, next) => fn(req, res, next).catch(next)
            // Then the promise rejects if I await it? No, it calls next.

            await PedidosController.store(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(next.mock.calls[0][0].message).toMatch(/Stock insuficiente/);
        });
    });
});
