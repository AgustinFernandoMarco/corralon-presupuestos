import { estado, buscarMaterial, cantidadEnCarrito, calcularTotal, vaciarCarrito } from "./estado.js";
import { ACCIONES } from "./acciones.js";
import { obtenerMateriales, obtenerPresupuestos, crearPresupuesto } from "./api.js";
import { filaMaterial, itemCarrito, filaHistorial } from "./componentes.js";
import { formatearPrecio, formatearFecha } from "./formato.js";

const $ = (id) => document.getElementById(id);

/* ---------------- RENDER: todo sale del estado ---------------- */
function renderTodo() {
  $("catalogo").innerHTML = estado.materiales
    .map((m) => filaMaterial(m, cantidadEnCarrito(m.IdMaterial)))
    .join("");

  $("carrito").innerHTML =
    estado.carrito.length === 0
      ? `<tr><td colspan="4" class="vacio">Todavía no agregaste materiales.</td></tr>`
      : estado.carrito
          .map((item) => {
            const material = buscarMaterial(item.id);
            return material ? itemCarrito(item, material) : "";
          })
          .join("");

  // Datos derivados: total y botones se calculan acá, nunca se guardan.
  $("total").textContent = formatearPrecio(calcularTotal());
  const vacio = estado.carrito.length === 0;
  $("btn-guardar").disabled = vacio;
  $("btn-vaciar").disabled = vacio;
}

function mostrarMensaje(texto, tipo = "") {
  const caja = $("mensaje");
  caja.textContent = texto;
  caja.className = tipo;
}

function renderHistorial(presupuestos) {
  $("historial").innerHTML =
    presupuestos.length === 0
      ? `<tr><td colspan="5" class="vacio">Todavía no hay presupuestos guardados.</td></tr>`
      : presupuestos.map((p) => filaHistorial(p, formatearFecha)).join("");
}

/* ---------------- EVENTOS: UN manejador con delegación ---------------- */
function manejarAccion(evento) {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;

  const accion = ACCIONES[boton.dataset.accion];
  if (!accion) return;

  const aviso = accion(Number(boton.dataset.id)); // transforma el estado
  renderTodo();                                    // y se vuelve a dibujar
  mostrarMensaje(aviso ?? "", aviso ? "aviso" : "");
}

/* ---------------- CARGA DE DATOS ---------------- */
async function cargarMateriales() {
  estado.materiales = await obtenerMateriales();
  renderTodo();
}

async function cargarHistorial() {
  renderHistorial(await obtenerPresupuestos());
}

/* ---------------- GUARDAR ---------------- */
async function guardar(evento) {
  evento.preventDefault();

  const cliente = $("cliente").value.trim();
  if (!cliente) return mostrarMensaje("Escribí el nombre del cliente.", "aviso");
  if (estado.carrito.length === 0) return mostrarMensaje("El presupuesto está vacío.", "aviso");

  try {
    // Solo viaja [{ id, cantidad }]: los precios los pone la base.
    const { idPresupuesto, total } = await crearPresupuesto(cliente, estado.carrito);

    vaciarCarrito();
    $("cliente").value = "";
    await cargarMateriales(); // el stock bajó
    await cargarHistorial();

    // El total que se muestra es el que DEVOLVIÓ LA BASE (OUTPUT), no el estimado.
    mostrarMensaje(
      `Presupuesto N° ${idPresupuesto} guardado para ${cliente}. Total: ${formatearPrecio(total)}`,
      "ok"
    );
  } catch (error) {
    mostrarMensaje(error.message, "error");
    cargarMateriales().catch(() => {}); // por si cambió stock o precios
  }
}

/* ---------------- ARRANQUE ---------------- */
async function iniciar() {
  $("app").addEventListener("click", manejarAccion);
  $("form-guardar").addEventListener("submit", guardar);
  renderTodo();

  try {
    await Promise.all([cargarMateriales(), cargarHistorial()]);
  } catch (error) {
    mostrarMensaje(`No se pudieron cargar los datos: ${error.message}`, "error");
  }
}

iniciar();
