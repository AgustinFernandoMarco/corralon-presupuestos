require("dotenv").config();

const app = require("./src/app");
const { getPool } = require("./src/config/db");

const PORT = process.env.PORT || 3000;

getPool()
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor listo en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("No se pudo conectar a la base de datos:", err);
    process.exit(1);
  });
