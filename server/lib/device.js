const LABELS = { mobile: "Mobile", tablet: "Tablet", desktop: "Desktop" };

function cap(value) {
  const k = String(value || "").trim().toLowerCase();
  return LABELS[k] || "";
}

export function classifyDevice({ device, screen, userAgent } = {}) {
  const fromClient = cap(device);
  if (fromClient) return fromClient;

  const ua = String(userAgent || "");
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "Tablet";
  if (/Mobi|iPhone|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return "Mobile";

  const width = Number(String(screen || "").split(/[x×]/i)[0]);
  if (width > 0 && width <= 768) return "Mobile";
  if (width > 0 && width <= 1024) return "Tablet";
  if (width > 0) return "Desktop";
  if (ua) return "Desktop";
  return "Unknown";
}

export function visitDevice(row) {
  const labeled = cap(row?.device);
  if (labeled) return labeled;
  const screen = String(row?.screen || "");
  const inScreen = screen.match(/\b(mobile|tablet|desktop)\b/i);
  if (inScreen) return cap(inScreen[1]);
  return classifyDevice({ screen, userAgent: row?.ua || "" });
}
