
import nodemailer from "nodemailer";

// --- CONFIGURACIÓN DEL TRANSPORTADOR SMTP ---

export const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: { ciphers: "SSLv3" },
  });
};

// --- FUNCIONALIDAD 1: EMAIL DE AUTENTICACIÓN (OTP) ---

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
              <p>Usa el siguiente código para completar tu inicio de sesión. Este código es válido por 15 minutos.</p>
              <div style="background-color: #f5f5f5; text-align: center; padding: 15px; border-radius: 8px; margin: 25px 0;">
                  <p style="font-size: 32px; font-weight: bold; color: #e10022; letter-spacing: 5px; margin: 0;">${otp}</p>
              </div>
              <p>Si no solicitaste este código, puedes ignorar este mensaje de forma segura.</p>
          </div>
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
              <p>&copy; ${new Date().getFullYear()} Universidad La Salle Nezahualcóyotl</p>
          </div>
      </div>
  </div>
  `;
};

export const sendAdminOtpEmail = async (adminEmail: string, otp: string) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Acceso La Salle Admin" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `Tu código de acceso: ${otp}`,
      html: createOtpHtmlBody(otp),
    });
    console.log("[SUCCESS] Correo OTP enviado a:", adminEmail);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("🔴 Falló sendAdminOtpEmail:", error);
    return { success: false, error };
  }
};

// --- FUNCIONALIDAD 2: EMAIL DE PRÉSTAMO VENCIDO ---

interface OverdueLoanEmailDetails {
  studentName: string;
  studentEmail: string;
  materialName: string;
  loanDate: Date;
  returnDate: Date;
}

const createOverdueLoanHtmlBody = ({ studentName, materialName, loanDate, returnDate }: OverdueLoanEmailDetails): string => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #ddd;">
              <h1 style="color: #d9534f;">Alerta de Préstamo Vencido</h1>
          </div>
          <div style="padding: 20px 0;">
              <p>Hola ${studentName},</p>
              <p>Te informamos que se ha generado un adeudo debido a que el siguiente material no fue devuelto a tiempo:</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Material:</strong> ${materialName}</p>
                  <p><strong>Fecha de Préstamo:</strong> ${loanDate.toLocaleDateString('es-MX')}</p>
                  <p><strong>Fecha de Devolución Esperada:</strong> <span style="color: #d9534f; font-weight: bold;">${returnDate.toLocaleDateString('es-MX')}</span></p>
              </div>
              <p>Puedes ver los detalles de este adeudo y proceder con el pago en el portal de estudiantes.</p>
              <div style="text-align: center; margin-top: 30px;">
                  <a href="${baseUrl}/dashboard/adeudos" style="background-color: #005A9C; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">Ir a Mis Adeudos</a>
              </div>
          </div>
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888;">
              <p>Este es un aviso automático. Por favor, no respondas a este correo.</p>
              <p>Universidad La Salle Nezahualcóyotl</p>
          </div>
      </div>
  </div>
  `;
};

export const sendOverdueLoanEmail = async (details: OverdueLoanEmailDetails) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Notificaciones La Salle" <${process.env.EMAIL_USER}>`,
      to: details.studentEmail,
      subject: "Notificación de Préstamo Vencido",
      html: createOverdueLoanHtmlBody(details),
    });
    console.log("[SUCCESS] Correo de adeudo enviado a:", details.studentEmail);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("🔴 Falló sendOverdueLoanEmail:", error);
    return { success: false, error };
  }
};
