
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { get } from 'http';

// NOTE: This configuration uses OAuth2 for Microsoft's SMTP service.
// It's more secure than basic authentication.

/**
 * Creates a Nodemailer transporter configured with Microsoft OAuth2.
 */
const createTransporter = async () => {
    // Although we are using googleapis, the OAuth2 flow is standardized.
    // We manually configure it for Microsoft's endpoints.
    const oauth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize" // Redirect URI not used for server-side flow
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN
    });

    try {
        // Get a new access token from the refresh token
        const { token } = await oauth2Client.getAccessToken();

        if (!token) {
            throw new Error("Failed to create access token.");
        }

        // Create and return the transporter
        return nodemailer.createTransport({
            host: "smtp.office365.com",
            port: 587,
            secure: false,
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_USER,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: token,
            },
            tls: {
                ciphers: 'SSLv3',
            },
        });
    } catch (error) {
        console.error("Error creating OAuth2 transporter:", error);
        throw new Error("Could not configure email service.");
    }
};

/**
 * Creates the HTML body for the admin OTP email.
 */
const createOtpHtmlBody = (otp: string): string => {
    const appName = "Sistema de Administración La Salle";
    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-width: 560px; margin: 30px auto; padding: 20px; border: 1px solid #ddd; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                <h1 style="color: #0a1c65; font-size: 24px;">${appName}</h1>
            </div>
            <div style="padding: 25px 5px;">
                <h2 style="color: #333; font-size: 20px;">Tu Código de Acceso Único</h2>
                <p>Hola,</p>
                <p>Usa el siguiente código para completar tu inicio de sesión. Este código es válido por 15 minutos.</p>
                <div style="background-color: #f5f5f5; text-align: center; padding: 15px; border-radius: 8px; margin: 25px 0;">
                    <p style="font-size: 32px; font-weight: bold; color: #e10022; letter-spacing: 5px; margin: 0;">${otp}</p>
                </div>
                <p>Si no solicitaste este código, puedes ignorar este mensaje de forma segura.</p>
            </div>
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                <p>Este es un correo automático, por favor no respondas.</p>
                <p>&copy; ${new Date().getFullYear()} Universidad La Salle Nezahualcóyotl</p>
            </div>
        </div>
    </div>
    `;
};

/**
 * Sends a one-time password to a given admin email address.
 */
export const sendAdminOtpEmail = async (adminEmail: string, otp: string) => {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: `"Acceso La Salle Admin" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `Tu código de acceso: ${otp}`,
      html: createOtpHtmlBody(otp),
    });

    console.log("OTP email sent successfully to: %s", adminEmail);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    // The error is already logged in createTransporter if it fails there
    console.error("Failed to send OTP email:", error);
    // Return a failure status to the calling API route
    return { success: false, error };
  }
};
