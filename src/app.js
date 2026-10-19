const path = require("path");
const express = require("express");
const logger = require("./middlewares/logger");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const routes = require("./routes");

const app = express();

app.use(logger);
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api", routes);
app.use("/api", notFound);

app.use(errorHandler); // siempre al final

module.exports = app;
