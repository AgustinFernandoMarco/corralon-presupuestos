const presupuestosService = require("../services/presupuestosService");
const AppError = require("../utils/AppError");

async function listar(req, res) {
  res.json(await presupuestosService.listar());
}

async function crear(req, res) {
  const { cliente, items } = req.body ?? {};

  if (typeof cliente !== "string" || cliente.trim() === "") {
    throw new AppError(400, "El nombre del cliente es obligatorio.");
  }
  if (!Array.isArray(items)) {
    throw new AppError(400, "El campo items debe ser un arreglo.");
  }

  // Saneo: de cada item se toman SOLO id y cantidad (aunque el cliente mande
  // más campos, como precios, se descartan). Un array vacío pasa: lo rechaza
  // la base con el error 50031.
  const itemsSaneados = items.map((item) => {
    const id = Number(item?.id);
    const cantidad = Number(item?.cantidad);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError(400, "Cada item necesita un id numérico válido.");
    }
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new AppError(400, "Cada item necesita una cantidad entera mayor a cero.");
    }
    return { id, cantidad };
  });

  const resultado = await presupuestosService.crear(cliente.trim(), itemsSaneados);
  res.status(201).json(resultado);
}

module.exports = { listar, crear };
