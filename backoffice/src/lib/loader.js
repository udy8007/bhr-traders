let pending = 1;

function el() {
  return document.getElementById("loader");
}

export function showLoader() {
  pending += 1;
  const loader = el();
  if (!loader) return;
  loader.style.display = "grid";
  loader.style.opacity = "1";
}

export function hideLoader() {
  pending = Math.max(0, pending - 1);
  if (pending > 0) return;
  const loader = el();
  if (!loader) return;

  let opacity = Number(loader.style.opacity || 1);
  function fade() {
    if (pending > 0) {
      loader.style.display = "grid";
      loader.style.opacity = "1";
      return;
    }
    if (opacity <= 0) {
      loader.style.display = "none";
      return;
    }
    opacity -= 0.05;
    loader.style.opacity = String(opacity);
    window.setTimeout(fade, 50);
  }
  fade();
}
