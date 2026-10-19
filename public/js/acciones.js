import {
  agregarAlCarrito,
  restarDelCarrito,
  quitarDelCarrito,
  vaciarCarrito,
} from "./estado.js";

// Mapa de acciones: el data-accion del botón elige la transformación.
// Acción nueva = una función + una línea acá. Sin if/else en cadena.
export const ACCIONES = {
  agregar: agregarAlCarrito,
  sumar: agregarAlCarrito,
  restar: restarDelCarrito,
  quitar: quitarDelCarrito,
  vaciar: vaciarCarrito,
};
