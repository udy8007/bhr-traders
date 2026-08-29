import { readFileSync } from "fs";
import { createTransport } from "nodemailer";
import { findPdfLogo } from "./pdfAssets.js";

export const MAIL_LOGO_CID = "bhr-logo";

const FOREST = "#0b351a";
const GREEN = "#1a3e2e";
const GOLD = "#c9a85e";
const GOLD_DEEP = "#b08d3e";
const CREAM = "#f9f8f3";
const INK = "#1a2418";
const MUTED = "#5e6b57";

export const MAIL_BRAND = {
  name: "BHR Traders",
  kicker: "Wholesale rice · Chennai",
  address: "No. 66, Kannagi Nagar, Puthagaram Road, Anna Nagar West, Chennai 600040",
  phone: "+91 99403 38654",
  phone2: "+91 99403 39654",
  email: "info@bhrtraders.com",
  gstin: "33BDJPB0270L2ZT"
};

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

export function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function logoAttachment() {
  const file = findPdfLogo();
  if (!file) return null;
  try {
    return {
      filename: "bhr-logo.png",
      content: readFileSync(file),
      cid: MAIL_LOGO_CID,
      contentType: "image/png",
      contentDisposition: "inline"
    };
  } catch {
    return null;
  }
}

export async function sendMail({ to, subject, text, html, attachments }) {
  const tx = getTransporter();
  if (!tx) throw new Error("SMTP is not configured.");
  if (!to) throw new Error("Missing email recipient.");
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const logo = logoAttachment();
  const files = Array.isArray(attachments) ? attachments.slice() : [];
  if (logo && !files.some((a) => a && a.cid === MAIL_LOGO_CID)) files.unshift(logo);
  const info = await tx.sendMail({ from, to, subject, text, html, attachments: files });
  return info.messageId || "ok";
}

export function mailFacts(rows) {
  const list = (rows || []).filter((r) => r && String(r.value || "").trim());
  if (!list.length) return "";
  const cells = list
    .map((r, i) => {
      const border = i === list.length - 1 ? "none" : "1px solid #eadfc8";
      return (
        '<tr>' +
        '<td style="padding:10px 14px;border-bottom:' +
        border +
        ';font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:' +
        GOLD_DEEP +
        ';width:38%;font-family:Arial,Helvetica,sans-serif">' +
        escapeHtml(r.label) +
        "</td>" +
        '<td style="padding:10px 14px;border-bottom:' +
        border +
        ";font-size:14px;color:" +
        INK +
        ';font-family:Arial,Helvetica,sans-serif;font-weight:bold">' +
        escapeHtml(r.value) +
        "</td></tr>"
      );
    })
    .join("");
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;border:1px solid #eadfc8;background:' +
    CREAM +
    '">' +
    cells +
    "</table>"
  );
}

function ctaButton(href, label) {
  if (!href || !label) return "";
  return (
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px">' +
    "<tr><td align=\"center\" bgcolor=\"" +
    FOREST +
    '" style="border-radius:6px">' +
    '<a href="' +
    escapeHtml(href) +
    '" style="display:inline-block;padding:12px 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;letter-spacing:0.02em">' +
    escapeHtml(label) +
    "</a></td></tr></table>"
  );
}

export function wrapHtml(title, bodyHtml, opts = {}) {
  const kicker = opts.kicker || MAIL_BRAND.kicker;
  const preheader = opts.preheader || title || MAIL_BRAND.name;
  const button = opts.button && opts.button.href ? ctaButton(opts.button.href, opts.button.label || "Open") : "";
  const safeTitle = escapeHtml(title || MAIL_BRAND.name);
  const safeKicker = escapeHtml(kicker);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#e8ebe4;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e8ebe4;padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e2ddd0">
          <tr>
            <td style="height:6px;background:${GOLD};font-size:0;line-height:0">&nbsp;</td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 28px 16px;background:#ffffff">
              <img src="cid:${MAIL_LOGO_CID}" alt="BHR Traders" width="240" style="display:block;margin:0 auto;max-width:240px;width:240px;height:auto;border:0"/>
            </td>
          </tr>
          <tr>
            <td style="height:3px;background:${GOLD};font-size:0;line-height:0">&nbsp;</td>
          </tr>
          <tr>
            <td style="background:${FOREST};padding:22px 28px">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${GOLD}">${safeKicker}</p>
              <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.3;color:#ffffff;font-weight:bold">${safeTitle}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${INK}">
              ${bodyHtml || ""}
              ${button}
            </td>
          </tr>
          <tr>
            <td style="background:${GREEN};padding:22px 28px">
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${GOLD}">BHR Traders</p>
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:#d7e4d4">${escapeHtml(MAIL_BRAND.address)}</p>
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#d7e4d4">
                ${escapeHtml(MAIL_BRAND.phone)} &nbsp;·&nbsp; ${escapeHtml(MAIL_BRAND.phone2)}
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${GOLD}">
                ${escapeHtml(MAIL_BRAND.email)} &nbsp;·&nbsp; GSTIN ${escapeHtml(MAIL_BRAND.gstin)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="height:6px;background:${GOLD};font-size:0;line-height:0">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
