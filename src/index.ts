import { bookRouter } from "./routes/book.routes";
import { authorRouter } from "./routes/author.routes";
import { fileUploadRouter } from "./routes/file-upload.routes";
import { type Request, type Response, type NextFunction, type ErrorRequestHandler } from "express";
import express from "express";
import cors from "cors";
import { mongoConnect } from "./databases/mongo-db";
import { swaggerOptions } from "./swagger-options";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUiExpress from "swagger-ui-express";

// Configuración del app
const PORT = 3000;
export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: "http://localhost:3000" }));

// Swagger
const specs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUiExpress.serve, swaggerUiExpress.setup(specs));

//  Middlewares de aplicación
app.use((req: Request, res: Response, next: NextFunction) => {
  const date = new Date();
  console.log(`Petición de tipo ${req.method} a la url ${req.originalUrl} el ${date.toString()}`);
  next();
});
// Rutas
const router = express.Router();
router.get("/", (req: Request, res: Response) => {
  res.send(`
      <h3>Esta es la home de nuestra API.</h3>
    `);
});
router.get("*", (req: Request, res: Response) => {
  res.status(404).send({ error: "Lo sentimos :( No hemos encontrado la página solicitada." });
});

app.use(async (req: Request, res: Response, next: NextFunction) => {
  await mongoConnect();
  next();
});

// Usamos las rutas
app.use("/book", bookRouter);
app.use("/author", authorRouter);
app.use("/public", express.static("public"));
app.use("/file-upload", fileUploadRouter);
app.use("/", router);

// Middleware de gestión de errores
app.use((err: ErrorRequestHandler, req: Request, res: Response, next: NextFunction) => {
  console.log("*** INICIO DE ERROR ***");
  console.log(`PETICIÓN FALLIDA: ${req.method} a la url ${req.originalUrl}`);
  console.log(err);
  console.log("*** FIN DE ERROR ***");

  // Truco para quitar el tipo a una variable
  const errorAsAny: any = err as unknown as any;

  if (err?.name === "ValidationError") {
    res.status(400).json(err);
  } else if (errorAsAny.errmsg && errorAsAny.errmsg?.indexOf("duplicate key") !== -1) {
    res.status(400).json({ error: errorAsAny.errmsg });
  } else if (errorAsAny?.code === "ER_NO_DEFAULT_FOR_FIELD") {
    res.status(400).json({ error: errorAsAny?.sqlMessage });
  } else {
    res.status(500).json(err);
  }
});

export const server = app.listen(PORT, () => {
  console.log(`app levantado en el puerto ${PORT}`);
});
