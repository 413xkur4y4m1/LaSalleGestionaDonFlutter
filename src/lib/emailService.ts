import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // true para 465, false para otros puertos
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
        ciphers: 'SSLv3'
    }
});

export async function sendAdminCredentials(
    email: string, 
    adminOTAccount: string, 
    temporaryPassword: string
) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Credenciales de Administrador - Sistema',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
                <h2 style="color: #dc2626;">¡Bienvenido como Administrador!</h2>
                <p>Has sido agregado como administrador del sistema.</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Tu ID de Administrador:</strong></p>
                    <code style="background-color: #fff; padding: 8px 12px; border-radius: 4px; display: block; font-size: 16px;">
                        ${adminOTAccount}
                    </code>
                </div>

                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Contraseña Temporal:</strong></p>
                    <code style="background-color: #fff; padding: 8px 12px; border-radius: 4px; display: block; font-size: 16px;">
                        ${temporaryPassword}
                    </code>
                </div>

                <p style="color: #ef4444; font-weight: bold;">⚠️ Por favor, cambia tu contraseña después del primer inicio de sesión.</p>
                
                <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
                    Este es un correo automático, por favor no respondas a este mensaje.
                </p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
}