const { getPool } = require("../config/db");

async function listar() {
  const pool = await getPool();
  const resultado = await pool.request().execute("usp_ListarMateriales");
  return resultado.recordset;
}

module.exports = { listar };
