export const ORDER_STATUSES = [
  "Confirmed — cash on delivery",
  "Confirmed — awaiting payment",
  "Confirmed — payment received",
  "Packing",
  "Packed",
  "Delivering",
  "Dispatched",
  "Delivered",
  "Cancelled"
];

export const FLOW_STEPS = [
  { id: "confirmed", label: "Confirmed", hint: "Order accepted" },
  { id: "packing", label: "Packing", hint: "Being packed" },
  { id: "delivering", label: "Delivering", hint: "Out for delivery" },
  { id: "delivered", label: "Delivered", hint: "Reached customer" }
];

export function flowIndex(status) {
  const s = String(status || "");
  if (/cancelled/i.test(s)) return -1;
  if (/delivered/i.test(s) && !/delivering/i.test(s)) return 3;
  if (/dispatch|delivering/i.test(s)) return 2;
  if (/pack/i.test(s)) return 1;
  return 0;
}

export function statusForFlow(stepId, order) {
  if (stepId === "packing") return "Packing";
  if (stepId === "delivering") return "Delivering";
  if (stepId === "delivered") return "Delivered";
  if (/cod|cash/i.test(order?.pay || "")) return "Confirmed — cash on delivery";
  if (/awaiting/i.test(order?.status || "")) return "Confirmed — awaiting payment";
  return "Confirmed — payment received";
}

export function statusTone(status) {
  const s = String(status || "");
  if (/cancelled/i.test(s)) return "danger";
  if (/delivered/i.test(s) && !/delivering/i.test(s)) return "success";
  if (/dispatch|delivering/i.test(s)) return "info";
  if (/pack/i.test(s)) return "warning";
  if (/awaiting/i.test(s)) return "warning";
  return "primary";
}

export function formatInr(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatWhen(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function itemCount(order) {
  return (order.items || []).reduce((n, i) => n + Number(i.qty || 1), 0);
}

export function itemLabel(order) {
  return (order.items || []).map((i) => (i.title || "Item") + " × " + (i.qty || 1)).join(", ");
}

export function waNumber(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.length === 10) return "91" + d;
  return d;
}

export function isPendingPay(status) {
  return /awaiting payment/i.test(String(status || ""));
}
