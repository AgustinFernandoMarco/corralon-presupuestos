const materialesService = require("../services/materialesService");

async function listar(req, res) {
  res.json(await materialesService.listar());
}

module.exports = { listar };
