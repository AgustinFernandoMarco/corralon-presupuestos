const express = require("express");
const asyncHandler = require("../middlewares/asyncHandler");
const materiales = require("../controllers/materialesController");
const presupuestos = require("../controllers/presupuestosController");

const router = express.Router();

router.get("/materiales", asyncHandler(materiales.listar));
router.get("/presupuestos", asyncHandler(presupuestos.listar));
router.post("/presupuestos", asyncHandler(presupuestos.crear));

module.exports = router;
