const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/auth.controller');
const validateRequest = require('../utils/validateRequest');
const { loginSchema, registerSchema } = require('../validations/auth.schema.js');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to obtain a JWT token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Login"
 *     responses:
 *       200:
 *         description: Login successful, returns a JWT token and user info.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *       401:
 *         description: Invalid credentials.
 */
router.post('/login', validateRequest(loginSchema), login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new company and initial admin user.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Register"
 *     responses:
 *       201:
 *         description: Registration successful, returns created user and company info.
 *       400:
 *         description: Validation error or email already exists.
 *       500:
 *         description: Internal server error.
 */
router.post('/register', validateRequest(registerSchema), register);

module.exports = router;