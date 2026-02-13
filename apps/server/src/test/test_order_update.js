const dotenv = require('dotenv');
dotenv.config();

// Override for local host access to Docker DB
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = process.env.DB_EXTERNAL_PORT;

const { Pedidos, DetallesPedidos, Productos, Clientes, sequelize, Empresas } = require('../models');
const PedidosController = require('../controllers/pedidos.controller');

async function testOrderUpdate() {
    const t = await sequelize.transaction();
    try {
        console.log('Starting Order Update Test...');

        // 0. Fetch a valid Company ID
        let company = await Empresas.findOne({ transaction: t });
        if (!company) {
            // Create dummy company if needed (though usually seeded)
            company = await Empresas.create({
                nombre_empresa: 'Test Company',
                direccion_empresa: 'Test Address',
                telefono_empresa: '1234567890',
                correo_empresa: 'test@company.com'
            }, { transaction: t });
        }
        const COMPANY_ID = company.id;
        console.log(`Using Company ID: ${COMPANY_ID}`);

        // 1. Fetch Dependencies
        const { Subcategorias, Categorias, Usuarios } = require('../models');

        let user = await Usuarios.findOne({ where: { id_empresa: COMPANY_ID }, transaction: t });
        if (!user) {
            // Create dummy user if needed
            user = await Usuarios.create({
                nombre_usuario: 'Test User',
                correo_usuario: 'test@user.com',
                password_usuario: 'password', // hashing skipped for test
                id_empresa: COMPANY_ID,
                id_rol: 1 // Assuming 1 exists or is not FK constrained to Roles table? usually Roles exists.
                // If role constraint exists, we might fail here. Let's hope execution environment has data.
            }, { transaction: t });
        }

        let cat = await Categorias.findOne({ where: { id_empresa: COMPANY_ID }, transaction: t });
        if (!cat) {
            cat = await Categorias.create({ nombre_categoria: 'Test Cat', id_empresa: COMPANY_ID, descripcion_categoria: 'Test' }, { transaction: t });
        }

        let subcat = await Subcategorias.findOne({ where: { id_categoria: cat.id }, transaction: t });
        if (!subcat) {
            subcat = await Subcategorias.create({
                nombre_subcategoria: 'Test Sub',
                id_categoria: cat.id,
                descripcion_subcategoria: 'Test'
            }, { transaction: t });
        }

        const product = await Productos.create({
            nombre_producto: 'Test Product Update',
            descripcion_producto: 'Test Description',
            precio_unitario: 100,
            stock_actual: 50,
            id_empresa: COMPANY_ID,
            codigo_barras: 'TEST-UPDATE-' + Date.now(),
            id_subcategoria: subcat.id,
            id_usuario_gestor: user.id
        }, { transaction: t });

        console.log(`Created Product: ${product.nombre_producto} (ID: ${product.id}) - Stock: ${product.stock_actual}`);

        // 2. Create a Test Client
        const client = await Clientes.findOne({ where: { id_empresa: COMPANY_ID } }) || await Clientes.create({
            nombre_cliente: 'Test Client',
            apellido_cliente: 'Test Apellido',
            id_empresa: COMPANY_ID,
            correo_cliente: 'test@example.com'
        }, { transaction: t });

        // 3. Create an Initial Order via Controller Logic (simulated)
        const initialOrder = await Pedidos.create({
            id_empresa: COMPANY_ID,
            id_cliente: client.id,
            id_usuario_creador: user.id,
            total_pedido: 200,
            estado_pedido: 'Pendiente'
        }, { transaction: t });

        await DetallesPedidos.create({
            id_pedido: initialOrder.id,
            id_producto: product.id,
            cantidad: 2,
            precio_historico: 100,
            subtotal: 200
        }, { transaction: t });

        // Decrement stock manually to simulate initial state
        await product.decrement('stock_actual', { by: 2, transaction: t });

        console.log(`Created Initial Order (ID: ${initialOrder.id}) with 2 units.`);

        await t.commit(); // Commit setup

        // Verify Stock
        const pAfter = await Productos.findByPk(product.id);
        console.log(`Stock after order creation: ${pAfter.stock_actual} (Expected: 48)`);
        if (pAfter.stock_actual !== 48) throw new Error('Initial stock incorrect');

        // 4. Perform Update via Controller (Mock req/res)
        // We want to change quantity to 5.
        // Logic: Restore 2 -> Stock 50. Deduct 5 -> Stock 45.

        const req = {
            params: { id: initialOrder.id },
            body: {
                id_cliente: client.id,
                estado_pedido: 'Pendiente',
                detalles: [
                    {
                        id_producto: product.id,
                        cantidad: 5,
                        precio_historico: 100
                    }
                ]
            },
            user: { id: user.id, id_empresa: COMPANY_ID }
        };

        const res = {
            status: (code) => ({
                json: (data) => {
                    console.log(`Response Status: ${code}`);
                    return data;
                },
                send: (data) => console.log('Response Send:', data)
            })
        };

        console.log('Executing Update...');
        // We need to mock sendMail to avoid actual email sending if possible
        await PedidosController.update(req, res);

        // 5. Verify Final Stock
        const pFinal = await Productos.findByPk(product.id);
        console.log(`Stock after update: ${pFinal.stock_actual} (Expected: 45)`);

        if (pFinal.stock_actual !== 45) {
            throw new Error(`Stock verification failed! Expected 45, got ${pFinal.stock_actual}`);
        } else {
            console.log('SUCCESS: Stock logic verified correctly.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
        if (!t.finished) await t.rollback();
    } finally {
        await sequelize.close();
    }
}

testOrderUpdate();
