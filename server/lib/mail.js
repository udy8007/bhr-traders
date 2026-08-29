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

export function mailMoney(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function mailStatStrip(stats) {
  const list = (stats || []).filter((s) => s && String(s.value || "").trim());
  if (!list.length) return "";
  const width = Math.floor(100 / list.length);
  const cells = list
    .map((s, i) => {
      const edge = i === list.length - 1 ? "" : "border-right:1px solid rgba(201,168,94,0.35);";
      return (
        '<td width="' +
        width +
        '%" style="padding:14px 10px;text-align:center;' +
        edge +
        'font-family:Arial,Helvetica,sans-serif">' +
        '<p style="margin:0 0 4px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:' +
        GOLD +
        '">' +
        escapeHtml(s.label) +
        "</p>" +
        '<p style="margin:0;font-size:16px;font-weight:bold;color:#ffffff">' +
        escapeHtml(s.value) +
        "</p></td>"
      );
    })
    .join("");
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:' +
    FOREST +
    ';border:1px solid ' +
    GOLD_DEEP +
    '">' +
    "<tr>" +
    cells +
    "</tr></table>"
  );
}

export function mailItemsTable(items) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return "";
  const rows = list
    .map((item, i) => {
      const qty = Number(item.qty || 1);
      const price = Number(item.price || 0);
      const line = qty * price;
      const bg = i % 2 ? CREAM : "#ffffff";
      return (
        "<tr>" +
        '<td style="padding:10px 12px;background:' +
        bg +
        ";font-family:Arial,Helvetica,sans-serif;font-size:13px;color:" +
        INK +
        '">' +
        escapeHtml(item.title || "Item") +
        "</td>" +
        '<td align="center" style="padding:10px 8px;background:' +
        bg +
        ";font-family:Arial,Helvetica,sans-serif;font-size:13px;color:" +
        MUTED +
        '">' +
        qty +
        "</td>" +
        '<td align="right" style="padding:10px 12px;background:' +
        bg +
        ";font-family:Arial,Helvetica,sans-serif;font-size:13px;color:" +
        INK +
        '">' +
        escapeHtml(mailMoney(line)) +
        "</td></tr>"
      );
    })
    .join("");
  const total = list.reduce((n, item) => n + Number(item.price || 0) * Number(item.qty || 1), 0);
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;border:1px solid #eadfc8">' +
    "<tr>" +
    '<td style="padding:10px 12px;background:' +
    FOREST +
    ';font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:' +
    GOLD +
    '">Item</td>' +
    '<td align="center" style="padding:10px 8px;background:' +
    FOREST +
    ';font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:' +
    GOLD +
    '">Qty</td>' +
    '<td align="right" style="padding:10px 12px;background:' +
    FOREST +
    ';font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:' +
    GOLD +
    '">Amount</td></tr>' +
    rows +
    "<tr>" +
    '<td colspan="2" style="padding:12px;background:' +
    CREAM +
    ";font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:" +
    INK +
    '">Total</td>' +
    '<td align="right" style="padding:12px;background:' +
    CREAM +
    ";font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:" +
    FOREST +
    '">' +
    escapeHtml(mailMoney(total)) +
    "</td></tr></table>"
  );
}

export function mailSectionLabel(text) {
  return (
    '<p style="margin:16px 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:' +
    GOLD_DEEP +
    ';font-family:Arial,Helvetica,sans-serif;font-weight:bold">' +
    escapeHtml(text) +
    "</p>"
  );
}

export function mailPreviewTable(headers, rows) {
  const cols = Array.isArray(headers) ? headers : [];
  const list = Array.isArray(rows) ? rows : [];
  if (!cols.length || !list.length) return "";
  const head = cols
    .map((h, i) => {
      const align = i === cols.length - 1 ? "right" : "left";
      return (
        '<th align="' +
        align +
        '" style="padding:10px 12px;background:' +
        FOREST +
        ';font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:' +
        GOLD +
        '">' +
        escapeHtml(h) +
        "</th>"
      );
    })
    .join("");
  const body = list
    .map((row, r) => {
      const bg = r % 2 ? CREAM : "#ffffff";
      const cells = cols
        .map((_, i) => {
          const align = i === cols.length - 1 ? "right" : "left";
          return (
            '<td align="' +
            align +
            '" style="padding:10px 12px;background:' +
            bg +
            ";font-family:Arial,Helvetica,sans-serif;font-size:13px;color:" +
            INK +
            '">' +
            escapeHtml(row[i] == null ? "" : row[i]) +
            "</td>"
          );
        })
        .join("");
      return "<tr>" + cells + "</tr>";
    })
    .join("");
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;border:1px solid #eadfc8">' +
    "<tr>" +
    head +
    "</tr>" +
    body +
    "</table>"
  );
}

const TRACK_STEPS = [
  { id: "confirmed", label: "Confirmed", hint: "Order accepted" },
  { id: "packing", label: "Packing", hint: "Being packed" },
  { id: "delivering", label: "Delivering", hint: "Out for delivery" },
  { id: "delivered", label: "Delivered", hint: "Reached customer" }
];

export function mailTrackIndex(status) {
  const s = String(status || "");
  if (/cancelled|pending/i.test(s)) return -1;
  if (/delivered/i.test(s) && !/delivering/i.test(s)) return 3;
  if (/dispatch|delivering/i.test(s)) return 2;
  if (/pack/i.test(s)) return 1;
  return 0;
}

export function mailOrderCopy(status) {
  const s = String(status || "");
  if (/cancelled/i.test(s)) {
    return {
      title: "Order cancelled",
      kicker: "Order update",
      lead: "Your order has been cancelled. If this is unexpected, reply to this email or call us and we will help."
    };
  }
  if (/pending/i.test(s)) {
    return {
      title: "Order pending payment",
      kicker: "Awaiting payment",
      lead: "We have captured your order. Payment is still pending. Complete UPI when you can, or wait for our team to confirm."
    };
  }
  const i = mailTrackIndex(s);
  if (i >= 3) {
    return {
      title: "Order delivered",
      kicker: "Reached you",
      lead: "Your order has been delivered. Thank you for choosing BHR Traders. We hope to supply you again soon."
    };
  }
  if (i === 2) {
    return {
      title: "Out for delivery",
      kicker: "On the way",
      lead: "Your order is out for delivery. Please keep your phone nearby so our team can reach you."
    };
  }
  if (i === 1) {
    return {
      title: "Order packing",
      kicker: "Being packed",
      lead: "Your order is being packed. We will notify you when it is out for delivery."
    };
  }
  return {
    title: "Order confirmed",
    kicker: "Order accepted",
    lead: "Your order has been confirmed. Our team will start packing it shortly."
  };
}

export function mailOrderTrack(status) {
  const cancelled = /cancelled/i.test(String(status || ""));
  const pending = /pending/i.test(String(status || ""));
  const active = mailTrackIndex(status);
  const cells = TRACK_STEPS.map((step, i) => {
    const on = !cancelled && i <= active;
    const now = !cancelled && i === active;
    const bg = now ? FOREST : on ? "#1f4d32" : CREAM;
    const title = now || on ? "#ffffff" : INK;
    const hint = now ? GOLD : on ? "#eadfc8" : MUTED;
    const edge = i === TRACK_STEPS.length - 1 ? "" : "border-right:1px solid #eadfc8;";
    return (
      '<td width="25%" style="padding:12px 6px;text-align:center;background:' +
      bg +
      ";" +
      edge +
      'font-family:Arial,Helvetica,sans-serif">' +
      '<p style="margin:0 0 4px;font-size:12px;font-weight:bold;color:' +
      title +
      '">' +
      escapeHtml(step.label) +
      "</p>" +
      '<p style="margin:0;font-size:10px;color:' +
      hint +
      '">' +
      escapeHtml(step.hint) +
      "</p></td>"
    );
  }).join("");
  const banner = cancelled
    ? '<p style="margin:0 0 10px;padding:10px 12px;background:#fdecea;border:1px solid #f5c2c0;color:#c62828;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold">This order is cancelled</p>'
    : pending
      ? '<p style="margin:0 0 10px;padding:10px 12px;background:#fff6e5;border:1px solid #eadfc8;color:#8a5a00;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold">Payment pending — order is not confirmed yet</p>'
      : "";
  return (
    banner +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border:1px solid #eadfc8">' +
    "<tr>" +
    cells +
    "</tr></table>"
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
