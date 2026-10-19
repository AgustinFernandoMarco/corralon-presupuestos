// Servidor normal / Express (TCP): DB_SERVER=localhost -> driver "mssql"
// LocalDB: DB_SERVER=(localdb)\MSSQLLocalDB -> driver "msnodesqlv8" (ODBC)
const server = process.env.DB_SERVER || "localhost";
const usaLocalDB = server.toLowerCase().startsWith("(localdb)");

const sql = usaLocalDB ? require("mssql/msnodesqlv8") : require("mssql");

let poolPromise = null;

function armarConfig() {
  const database = process.env.DB_NAME || "CorralonDB";
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;

  if (usaLocalDB) {
    const driverOdbc = process.env.DB_ODBC_DRIVER || "ODBC Driver 18 for SQL Server";
    const credenciales = user
      ? `UID=${user};PWD=${password};`
      : "Trusted_Connection=Yes;";
    return {
      connectionString:
        `Driver={${driverOdbc}};Server=${server};Database=${database};` +
        `${credenciales}TrustServerCertificate=yes;`,
    };
  }

  return {
    server,
    port: Number(process.env.DB_PORT) || 1433,
    database,
    user,
    password,
    options: {
      encrypt: process.env.DB_ENCRYPT === "true",
      trustServerCertificate: process.env.DB_TRUST_CERT !== "false",
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  };
}

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(armarConfig())
      .connect()
      .catch((err) => {
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

module.exports = { sql, getPool };