import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "Clinicomatic <onboarding@resend.dev>";

/** Envía un email. NUNCA lanza: el email no debe romper el flujo de negocio. */
export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<{ sent: boolean; error?: string }> {
  if (!resend) return { sent: false, error: "RESEND_API_KEY no configurada" };
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return { sent: !error, error: error?.message };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "error" };
  }
}

/** Plantilla HTML de marca Clinicomatic (teal). Reutilizable para todos los correos. */
export function brandEmail(opts: {
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  footer?: string;
}): string {
  const cta =
    opts.ctaText && opts.ctaUrl
      ? `<a href="${opts.ctaUrl}" style="display:inline-block;margin-top:18px;background:#0e9f8e;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:700;font-size:14px">${opts.ctaText}</a>`
      : "";
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8f8;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e0e7e6">
      <tr><td style="background:linear-gradient(135deg,#06322c,#0a7c6f);padding:22px 28px">
        <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.01em">Clinicomatic</span>
      </td></tr>
      <tr><td style="padding:28px">
        <h1 style="font-size:19px;color:#15292b;margin:0 0 10px">${opts.title}</h1>
        <p style="font-size:14px;color:#5e7379;line-height:1.65;margin:0">${opts.body}</p>
        ${cta}
      </td></tr>
      <tr><td style="padding:16px 28px;border-top:1px solid #eef2f1;font-size:11px;color:#9fb0b3">
        ${opts.footer ?? "© Clinicomatic · Si no esperabas este correo, ignóralo."}
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

export function welcomeEmail(clinicName: string): { subject: string; html: string } {
  return {
    subject: `Te damos la bienvenida a Clinicomatic`,
    html: brandEmail({
      title: `¡${clinicName} ya está en Clinicomatic!`,
      body: "Tu clínica está lista. Empieza añadiendo pacientes, configurando tu agenda y activando los recordatorios por WhatsApp. Tienes 14 días de prueba por delante.",
      ctaText: "Ir a mi clínica",
      ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard`,
    }),
  };
}

export function inviteEmail(clinicName: string, inviteUrl: string): { subject: string; html: string } {
  return {
    subject: `Te han invitado a ${clinicName} en Clinicomatic`,
    html: brandEmail({
      title: `Únete a ${clinicName}`,
      body: `Te han invitado a colaborar en la gestión de la clínica <strong>${clinicName}</strong>. Acepta la invitación para crear tu acceso.`,
      ctaText: "Aceptar invitación",
      ctaUrl: inviteUrl,
    }),
  };
}
