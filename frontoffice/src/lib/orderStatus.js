export const TRACK_STEPS = ["Confirmed", "Packing", "Delivering", "Delivered"];

export function orderStepIndex(status) {
  const s = String(status || "");
  if (/cancelled|pending/i.test(s)) return -1;
  if (/delivered/i.test(s) && !/delivering/i.test(s)) return 3;
  if (/dispatch|delivering/i.test(s)) return 2;
  if (/pack/i.test(s)) return 1;
  return 0;
}

export function statusTone(status) {
  const s = String(status || "");
  if (/cancelled/i.test(s)) return "danger";
  if (/delivered/i.test(s) && !/delivering/i.test(s)) return "success";
  if (/dispatch|delivering/i.test(s)) return "info";
  if (/pack/i.test(s)) return "warning";
  if (/pending|awaiting/i.test(s)) return "warning";
  return "primary";
}
