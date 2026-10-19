const { sql, getPool } = require("../config/db");

async function listar() {
  const pool = await getPool();
  const resultado = await pool.request().execute("usp_ListarPresupuestos");
  return resultado.recordset;
}

/**
 * Crea el presupuesto. Recibe el carrito YA saneado: [{ id, cantidad }].
 * Viaja como UN parámetro JSON (nunca se concatena en SQL) y la base
 * devuelve el id y el total por dos parámetros OUTPUT.
 */
async function crear(cliente, items) {
  const pool = await getPool();
  const resultado = await pool
    .request()
    .input("Cliente", sql.NVarChar(100), cliente)
    .input("Items", sql.NVarChar(sql.MAX), JSON.stringify(items))
    .output("IdPresupuesto", sql.Int)
    .output("Total", sql.Decimal(12, 2))
    .execute("usp_CrearPresupuesto");

  return {
    idPresupuesto: resultado.output.IdPresupuesto,
    total: resultado.output.Total,
  };
}

module.exports = { listar, crear };
