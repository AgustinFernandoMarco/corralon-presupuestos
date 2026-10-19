// Códigos que lanza usp_CrearPresupuesto (THROW) -> status HTTP
const STATUS_POR_CODIGO_SQL = {
  50020: 400, // cantidad <= 0
  50029: 400, // material inexistente
  50030: 409, // stock insuficiente
  50031: 400, // items vacíos
};

function notFound(req, res, next) {
  res.status(404).json({ mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`, codigo: null });
}

// Único lugar donde se traducen los errores a respuestas HTTP.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const codigo = err.number ?? err.originalError?.info?.number ?? null;

  let status = err.status || STATUS_POR_CODIGO_SQL[codigo] || 500;
  let mensaje = err.message;
  mensaje = mensaje.replace(/^(\[[^\]]*\])+/, "");

  if (err.type === "entity.parse.failed") {
    status = 400;
    mensaje = "El cuerpo del pedido no es un JSON válido.";
  }

  if (status >= 500) {
    console.error("[ERROR]", err); // el detalle técnico se queda en el log
    mensaje = "Error interno del servidor.";
  } else {
    console.warn(`[AVISO] ${status} ${mensaje}${codigo ? ` (SQL ${codigo})` : ""}`);
  }

  res.status(status).json({ mensaje, codigo });
}

module.exports = { notFound, errorHandler };
