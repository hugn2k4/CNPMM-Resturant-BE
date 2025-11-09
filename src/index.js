import dotenv from "dotenv";
import express from "express";
import connect from "./config/configdb.js";
import viewEngine from "./config/viewEngine.js";
import errorHandler from "./middlewares/errorHandler.js";
import initWebRoutes from "./route/web.js";

dotenv.config();

const app = express();

// built-in body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// view engine, routes and db
viewEngine(app);
initWebRoutes(app);
connect();

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log("Backend nodejs is running on the port: " + port);
});

// error handler (last middleware)
app.use(errorHandler);
