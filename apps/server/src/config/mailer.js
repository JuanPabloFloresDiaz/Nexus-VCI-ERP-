const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  pool: true, // Use pooled connections
  maxConnections: 1, // Limit concurrent connections to avoid server limits
  rateLimit: 5, // Limit messages per second
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE === 'true' || process.env.MAIL_PORT === '465',
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false
  },
  // Increase timeouts
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000, // 10 seconds
  socketTimeout: 30000, // 30 seconds
});

module.exports = transporter;
