import { escapar, formatearPrecio } from "./formato.js";

// Fila del catálogo. NO muestra stock. El botón muestra la cantidad ya elegida.
export function filaMaterial(material, cantidadElegida) {
  const etiqueta = cantidadElegida > 0 ? `Agregar (${cantidadElegida})` : "Agregar";
  return `
    <tr>
      <td>${escapar(material.Nombre)}</td>
      <td>${escapar(material.Unidad)}</td>
      <td class="num">${formatearPrecio(material.Precio)}</td>
      <td class="num">
        <button type="button" data-accion="agregar" data-id="${material.IdMaterial}">${etiqueta}</button>
      </td>
    </tr>`;
}

// Fila del carrito. Recibe el item { id, cantidad } y el material DERIVADO.
// El subtotal se calcula acá, no se guarda.
export function itemCarrito(item, material) {
  const subtotal = material.Precio * item.cantidad;
  return `
    <tr>
      <td>${escapar(material.Nombre)} <small>(${escapar(material.Unidad)})</small></td>
      <td class="num">
        <span class="cantidad">
          <button type="button" class="mini secundario" data-accion="restar" data-id="${item.id}" aria-label="Restar uno">−</button>
          ${item.cantidad}
          <button type="button" class="mini secundario" data-accion="sumar" data-id="${item.id}" aria-label="Sumar uno">+</button>
        </span>
      </td>
      <td class="num">${formatearPrecio(subtotal)}</td>
      <td class="num">
        <button type="button" class="mini secundario" data-accion="quitar" data-id="${item.id}" aria-label="Quitar del presupuesto">✕</button>
      </td>
    </tr>`;
}

export function filaHistorial(p, formatearFecha) {
  return `
    <tr>
      <td>${p.IdPresupuesto}</td>
      <td>${escapar(p.Cliente)}</td>
      <td>${formatearFecha(p.Fecha)}</td>
      <td class="num">${p.CantidadItems}</td>
      <td class="num">${formatearPrecio(p.Total)}</td>
    </tr>`;
}
