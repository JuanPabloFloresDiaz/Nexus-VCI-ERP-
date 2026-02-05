const nodemailer = require('nodemailer');
const transporter = require('../config/mailer');

async function sendMail({ recipient, subject, text, html, from }) {
    // Message object
    const message = {
        from: from || process.env.MAIL_FROM,
        to: recipient,
        subject,
        text,
        html,
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        if (process.env.NODE_ENV !== 'production') {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
        return info;
    } catch (err) {
        console.error(
            'Error occurred when a mail was tried to be sent. ' + err.message
        );
        throw err;
    }
}

module.exports = { sendMail };
