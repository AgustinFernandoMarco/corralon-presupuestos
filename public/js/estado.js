/* =========================================================================
   REGLA 1 - Una sola fuente de verdad.
   El carrito guarda SOLO { id, cantidad }. Nombres, precios, subtotales y
   total NO se guardan: se DERIVAN de estado.materiales cuando hacen falta.
   ========================================================================= */
export const estado = {
  materiales: [], // lo que devolvió la API
  carrito: [],    // [{ id, cantidad }] y NADA más
};

/* =========================================================================
   REGLA 2 - Lo que se puede calcular, no se guarda (funciones derivadas)
   ========================================================================= */
export function buscarMaterial(id) {
  return estado.materiales.find((m) => m.IdMaterial === id);
}

export function cantidadEnCarrito(id) {
  const item = estado.carrito.find((i) => i.id === id);
  return item ? item.cantidad : 0;
}

export function calcularTotal() {
  return estado.carrito.reduce((total, item) => {
    const material = buscarMaterial(item.id);
    return material ? total + material.Precio * item.cantidad : total;
  }, 0);
}

/* =========================================================================
   REGLA 3 - Los eventos transforman el estado (arrays NUEVOS, sin retocar
   el existente). Cada transformación devuelve un texto de aviso si no pudo
   hacerse, o null si salió bien.
   ========================================================================= */
export function agregarAlCarrito(id) {
  const material = buscarMaterial(id);
  if (!material) return "Ese material ya no está en el catálogo.";

  const actual = cantidadEnCarrito(id);
  if (actual >= material.Stock) {
    return `No hay más stock de ${material.Nombre}.`; // el carrito no cambia
  }

  estado.carrito =
    actual === 0
      ? [...estado.carrito, { id, cantidad: 1 }]                       // spread
      : estado.carrito.map((item) =>                                    // map + spread
          item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
  return null;
}

export function restarDelCarrito(id) {
  estado.carrito = estado.carrito
    .map((item) => (item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item))
    .filter((item) => item.cantidad > 0); // restar hasta 0 elimina el item
  return null;
}

export function quitarDelCarrito(id) {
  estado.carrito = estado.carrito.filter((item) => item.id !== id);
  return null;
}

export function vaciarCarrito() {
  estado.carrito = [];
  return null;
}
