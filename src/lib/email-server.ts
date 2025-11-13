
import nodemailer from 'nodemailer';

// 1. Configuración del "Transportador" de correo
// Utiliza los datos del archivo .env.local
// La configuración es para un servicio de Microsoft (Office 365/Outlook)
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false, // true para 465, false para otros puertos como 587 con STARTTLS
  auth: {
    user: process.env.EMAIL_USER,       // Tu variable de entorno
    pass: process.env.EMAIL_PASSWORD,  // Tu variable de entorno
  },
  tls: {
    ciphers:'SSLv3' // Necesario para la compatibilidad con algunos servicios de Microsoft
  }
});


interface EmailDetails {
    studentName: string;
    studentEmail: string;
    materialName: string;
    loanDate: Date;
    returnDate: Date;
}

// 2. Plantilla HTML para el cuerpo del correo
const createHtmlBody = ({ studentName, materialName, loanDate, returnDate }: EmailDetails): string => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #ddd;">
                <h1 style="color: #d9534f;">Alerta de Préstamo Vencido</h1>
            </div>
            <div style="padding: 20px 0;">
                <p>Hola ${studentName},</p>
                <p>Te escribimos para informarte que se ha generado un adeudo debido a que el siguiente material no fue devuelto a tiempo:</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Material:</strong> ${materialName}</p>
                    <p style="margin: 0;"><strong>Fecha de Préstamo:</strong> ${loanDate.toLocaleDateString('es-MX')}</p>
                    <p style="margin: 0;"><strong>Fecha de Devolución Esperada:</strong> <span style="color: #d9534f; font-weight: bold;">${returnDate.toLocaleDateString('es-MX')}</span></p>
                </div>
                <p>Como resultado, se ha creado un adeudo en tu cuenta. Puedes ver los detalles de este adeudo y proceder con el pago ingresando al portal de estudiantes.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${baseUrl}/dashboard/adeudos" style="background-color: #005A9C; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">Ir a Mis Adeudos</a>
                </div>
            </div>
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888;">
                <p>Por favor, no respondas a este correo. Es un aviso automático.</p>
                <p>Universidad La Salle Nezahualcóyotl</p>
            </div>
        </div>
    </div>
    `;
};


// 3. Función principal para enviar el correo
export const sendOverdueLoanEmail = async (details: EmailDetails) => {
  try {
    const info = await transporter.sendMail({
      from: `"Notificaciones La Salle" <${process.env.EMAIL_USER}>`,
      to: details.studentEmail,
      subject: "Notificación de Préstamo Vencido",
      html: createHtmlBody(details),
    });

    console.log("Correo de adeudo enviado a: %s", details.studentEmail);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error("Error al enviar correo de adeudo:", error);
    // Devolvemos un fallo para que el proceso principal sepa que algo salió mal
    return { success: false, error };
  }
};
