const { Usuarios, Empresas, sequelize } = require('../models');
const catchErrors = require('../utils/tryCatch');
const ApiResponse = require('../utils/apiResponse');
const { generateToken } = require('../auth'); // Module with functions: asignarToken, verificarToken
const { comparePassword, encryptPassword } = require('../utils/password'); // Function to compare plain and hashed passwords

class AuthController {
    /**
     * Login endpoint.
     * Expects a JSON body with "email" and "password".
     * Returns a JWT token along with basic user information if the credentials are valid.
     */
    static routes = '/auth/login';
    static login = catchErrors(async (req, res) => {
        const { correo_electronico, clave_acceso } = req.body;

        // Find the user by email
        const user = await Usuarios.findOne({ where: { correo_electronico } });
        if (!user) {
            return ApiResponse.error(res, {
                error: 'Credenciales inválidas', // Translated for consistency
                route: this.routes,
                status: 401,
            });
        }

        // Compare the provided password with the stored hash
        const isValid = await comparePassword(clave_acceso, user.clave_acceso);
        if (!isValid) {
            return ApiResponse.error(res, {
                error: 'Credenciales inválidas',
                route: this.routes,
                status: 401,
            });
        }

        // Generate a JWT token with the user role
        const token = generateToken(
            {
                id: user.id,
                correo_electronico: user.correo_electronico,
                nombre_usuario: user.nombre_usuario,
                rol_usuario: user.rol_usuario, // Changed from rol to rol_usuario
                id_empresa: user.id_empresa // Add tenant ID
            },
            user.rol_usuario
        );

        // Respond with the token and basic user info (excluding the password)
        return ApiResponse.success(
            res,
            {
                data: {
                    token,
                    user: {
                        id: user.id,
                        correo_electronico: user.correo_electronico,
                        nombre_usuario: user.nombre_usuario,
                        rol_usuario: user.rol_usuario,
                        id_empresa: user.id_empresa
                    },
                },
                message: 'Inicio de sesión exitoso',
                status: 200,
                route: this.routes
            },
        );
    });
    /**
     * Register endpoint.
     * Creates a new Company (Empresa) and a main Administrator User.
     */
    static register = catchErrors(async (req, res) => {
        // user details + company details
        const {
            nombre_empresa,
            nombre_usuario,
            correo_electronico,
            clave_acceso
        } = req.body;

        // Check if user already exists
        const existingUser = await Usuarios.findOne({ where: { correo_electronico } });
        if (existingUser) {
            return ApiResponse.error(res, {
                error: 'El correo electrónico ya está registrado',
                route: '/auth/register',
                status: 400
            });
        }

        const result = await sequelize.transaction(async (t) => {
            // 1. Create the Company
            const newEmpresa = await Empresas.create({
                nombre_empresa,
                nit_empresa: req.body.nit_empresa,
                telefono_empresa: req.body.telefono_empresa,
                direccion_empresa: req.body.direccion_empresa,
                correo_empresa: req.body.correo_empresa,
                logo_url: req.body.logo_url
            }, { transaction: t });

            // 2. Create the Admin User}
            const encryptedPassword = await encryptPassword(clave_acceso);

            const newUser = await Usuarios.create({
                id_empresa: newEmpresa.id,
                nombre_usuario,
                correo_electronico,
                clave_acceso: encryptedPassword,
                rol_usuario: 'Administrador',
                estado_usuario: true
            }, { transaction: t });

            return { newEmpresa, newUser };
        });

        // Generate token for immediate login
        const token = generateToken(
            {
                id: result.newUser.id,
                correo_electronico: result.newUser.correo_electronico,
                nombre_usuario: result.newUser.nombre_usuario,
                rol_usuario: result.newUser.rol_usuario,
            },
            result.newUser.rol_usuario
        );

        return ApiResponse.success(res, {
            data: {
                token,
                user: {
                    id: result.newUser.id,
                    correo_electronico: result.newUser.correo_electronico,
                    nombre_usuario: result.newUser.nombre_usuario,
                    rol_usuario: result.newUser.rol_usuario,
                    id_empresa: result.newEmpresa.id
                },
                empresa: result.newEmpresa
            },
            message: 'Registro exitoso. Empresa y Usuario creados.',
            status: 201,
            route: '/auth/register'
        });
    });
}


module.exports = AuthController;