const formateadorPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

export function formatearPrecio(valor) {
  return formateadorPrecio.format(Number(valor) || 0);
}

// La base guarda la fecha en UTC; acá se muestra en hora local.
export function formatearFecha(valor) {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

// Los textos vienen de la base: se escapan antes de meterlos en innerHTML.
export function escapar(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
