// Envuelve un controlador async: si falla, el error va al manejador central.
// Así los controladores no necesitan try/catch.
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
