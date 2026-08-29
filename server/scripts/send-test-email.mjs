import { readFileSync } from "fs";
import { createTransport } from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env.local");
const env = {};
for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) continue;
  let v = m[2];
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[m[1]] = v;
}

const to = process.argv[2] || "udyilangovan@gmail.com";
const user = env.SMTP_USER;
const pass = env.SMTP_PASS;
const tries = [
  { host: env.SMTP_HOST || "smtp.hostinger.com", port: Number(env.SMTP_PORT || 465), secure: Number(env.SMTP_PORT || 465) === 465 },
  { host: "smtp.hostinger.com", port: 465, secure: true },
  { host: "smtp.hostinger.com", port: 587, secure: false },
  { host: "smtp.crackaro.in", port: 465, secure: true }
];

let ok = null;
for (const t of tries) {
  process.stdout.write("Trying " + t.host + ":" + t.port + " ... ");
  const tx = createTransport({
    ...t,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000
  });
  try {
    await tx.verify();
    console.log("OK");
    ok = t;
    break;
  } catch (e) {
    console.log(e.response || e.code || e.message);
  }
}

if (!ok) {
  console.error("Could not connect to SMTP.");
  process.exit(1);
}

const tx = createTransport({ ...ok, auth: { user, pass } });
const info = await tx.sendMail({
  from: env.SMTP_FROM || user,
  to,
  subject: "BHR Traders — SMTP test",
  text: "This is a test email from BHR Traders (" + user + ").",
  html:
    "<div style='font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2a1a'>" +
    "<h2 style='color:#1f4d32;margin:0 0 8px'>BHR Traders</h2>" +
    "<p>This is a test email from the backoffice SMTP setup.</p>" +
    "<p>Sent from <strong>" +
    user +
    "</strong> via " +
    ok.host +
    ":" +
    ok.port +
    ".</p>" +
    "<p style='color:#5e6b57;font-size:13px'>No. 66 Kannagi Nagar, Anna Nagar West, Chennai 600040</p>" +
    "</div>"
});

console.log("SENT to " + to);
console.log("id " + (info.messageId || "ok"));
if (info.accepted) console.log("accepted " + info.accepted.join(", "));
if (ok.host !== env.SMTP_HOST || String(ok.port) !== String(env.SMTP_PORT)) {
  console.log("Use SMTP_HOST=" + ok.host + " SMTP_PORT=" + ok.port);
}
