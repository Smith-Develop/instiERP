import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Insti ERP <noreply@insti.dev>";

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured — email not sent");
    return false;
  }

  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  return sendEmail(
    to,
    "Restablecer contraseña — Insti ERP",
    `<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#1E3A5F">Insti ERP</h2>
      <p>Has solicitado restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
      <a href="${resetUrl}" style="display:inline-block;background:#1E3A5F;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0">Restablecer contraseña</a>
      <p style="color:#94A3B8;font-size:13px">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este mensaje.</p>
    </div>`,
  );
}

export async function sendNotificationEmail(to: string, subject: string, body: string): Promise<boolean> {
  return sendEmail(
    to,
    subject,
    `<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#1E3A5F">Insti ERP</h2>
      <p>${body}</p>
      <p style="color:#94A3B8;font-size:13px;margin-top:24px">Este es un mensaje automático de Insti ERP.</p>
    </div>`,
  );
}
