export function customerToCheckoutInfo(customer) {
  if (!customer) return null;
  return {
    name: String(customer.name || "").trim(),
    phone: String(customer.phone || "").trim(),
    email: String(customer.email || "").trim(),
    address: String(customer.address || "").trim(),
    city: String(customer.city || "").trim(),
    pincode: String(customer.pincode || "").trim(),
    notes: ""
  };
}

export function isCheckoutProfileComplete(info) {
  if (!info) return false;
  return getMissingCheckoutFields(info).length === 0;
}

export function getMissingCheckoutFields(info) {
  if (!info) return ["name", "phone", "email", "address", "city", "pincode"];
  const missing = [];
  if (!info.name) missing.push("name");
  if (!info.phone) missing.push("phone");
  if (!info.email) missing.push("email");
  if (!info.address) missing.push("address");
  if (!info.city) missing.push("city");
  if (!info.pincode || !/^[0-9]{6}$/.test(String(info.pincode))) missing.push("pincode");
  return missing;
}

export function mergeCheckoutInfo(saved, patch) {
  return {
    name: patch.name ?? saved?.name ?? "",
    phone: patch.phone ?? saved?.phone ?? "",
    email: patch.email ?? saved?.email ?? "",
    address: patch.address ?? saved?.address ?? "",
    city: patch.city ?? saved?.city ?? "",
    pincode: patch.pincode ?? saved?.pincode ?? "",
    notes: patch.notes ?? saved?.notes ?? ""
  };
}
