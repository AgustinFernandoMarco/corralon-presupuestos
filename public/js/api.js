// Todos los fetch de la aplicación viven acá.
const BASE = "/api";

async function pedir(ruta, opciones) {
  const respuesta = await fetch(BASE + ruta, opciones);
  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new Error(datos?.mensaje || `Error ${respuesta.status} al consultar el servidor.`);
  }
  return datos;
}

export function obtenerMateriales() {
  return pedir("/materiales");
}

export function obtenerPresupuestos() {
  return pedir("/presupuestos");
}

// Se manda SOLO { id, cantidad } por item: nunca precios ni totales.
export function crearPresupuesto(cliente, carrito) {
  return pedir("/presupuestos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cliente, items: carrito }),
  });
}
