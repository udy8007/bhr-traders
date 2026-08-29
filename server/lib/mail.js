import { createTransport } from "nodemailer";

let transporter;

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function getTransporter() {
  if (!mailConfigured()) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html, attachments }) {
  const tx = getTransporter();
  if (!tx) throw new Error("SMTP is not configured.");
  if (!to) throw new Error("Missing email recipient.");
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const info = await tx.sendMail({ from, to, subject, text, html, attachments });
  return info.messageId || "ok";
}

export function wrapHtml(title, bodyHtml) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2a1a">
      <h2 style="margin:0 0 8px;color:#1f4d32">BHR Traders</h2>
      <p style="margin:0 0 16px;color:#5e6b57;font-size:14px">${title}</p>
      ${bodyHtml}
      <p style="margin-top:24px;font-size:13px;color:#5e6b57">No. 66 Kannagi Nagar, Anna Nagar West, Chennai 600040<br/>info@bhrtraders.com</p>
    </div>
  `;
}
