/**
 * @swagger
 * tags:
 *   name: Author
 *   description: The authors managing API
 */

import { generateToken } from "../utils/token";
import { isAuth } from "../middlewares/auth.middleware";
import { Author } from "../models/mongo/Author";
import { Book } from "../models/mongo/Book";
import express, { type NextFunction, type Response, type Request } from "express";
import fs from "fs";
import bcrypt from "bcrypt";
import multer from "multer";
const upload = multer({ dest: "public" });

// Router propio de libros
export const authorRouter = express.Router();

authorRouter.get("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Estamos en el middleware /author que comprueba parámetros");

    const page: number = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit: number = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (!isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
      req.query.page = page as any;
      req.query.limit = limit as any;
      next();
    } else {
      console.log("Parámetros no válidos:");
      console.log(JSON.stringify(req.query));
      res.status(400).json({ error: "Params page or limit are not valid" });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /author:
 *   get:
 *     summary: Lists all the authors
 *     tags: [Author]
 *     parameters:
 *       - in: query
 *         name: page
 *         description: Número de página.
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         description: Límite de resultados por página.
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: The list of the authors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Author'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
authorRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit }: any = req.query;
    const authors = await Author.find()
      .limit(limit)
      .skip((page - 1) * limit);

    // Número total de elementos
    const totalElements = await Author.countDocuments();
    const response = {
      pagination: {
        totalItems: totalElements,
        totalPages: Math.ceil(totalElements / limit),
        currentPage: page,
      },
      data: authors,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /author/{id}:
 *   get:
 *     summary: Get author by ID
 *     tags: [Author]
 *     description: Retrieves detailed information about an author based on their ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the author to retrieve.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Author found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Author'
 *       404:
 *         description: No author found with the specified ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authorRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const author = await Author.findById(id).select("+password");

    if (author) {
      const temporalAuthor = author.toObject();
      const includeBooks = req.query.includeBooks === "true";
      if (includeBooks) {
        const books = await Book.find({ author: id });
        temporalAuthor.books = books;
      }

      res.json(temporalAuthor);
    } else {
      res.status(404).json({ error: "Autor no encontrado" });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /author/name/{name}:
 *   get:
 *     summary: Obtener autores por nombre
 *     tags: [Author]
 *     description: Obtiene una lista de autores que coinciden con el nombre proporcionado.
 *     parameters:
 *       - name: name
 *         in: path
 *         description: Nombre para filtrar los autores.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de autores encontrados.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IAuthor'
 *       404:
 *         description: No se encontraron autores que coincidan con el nombre proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

authorRouter.get("/name/:name", async (req: Request, res: Response, next: NextFunction) => {
  const name = req.params.name;

  try {
    const author = await Author.find({ name: new RegExp("^" + name.toLowerCase(), "i") });
    if (author?.length) {
      res.json(author);
    } else {
      res.status(404).json({ error: "No se encontraron autores que coincidan con el nombre proporcionado" });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /author/login:
 *   post:
 *     summary: Iniciar sesión de autor
 *     tags: [Author]
 *     description: Inicia sesión de un autor utilizando su dirección de correo electrónico y contraseña.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Dirección de correo electrónico del autor.
 *               password:
 *                 type: string
 *                 description: Contraseña del autor.
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso. Se devuelve un token JWT.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Error de solicitud. No se especificaron los campos de correo electrónico y contraseña.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Error de autenticación. El correo electrónico y/o la contraseña son incorrectos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

authorRouter.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // const email = req.body.email;
    // const password = req.body.password;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Se deben especificar los campos email y password" });
    }

    const author = await Author.findOne({ email }).select("+password");
    if (!author) {
      // return res.status(404).json({ error: "No existe un usuario con ese email" });
      // Por seguridad mejor no indicar qué usuarios no existen
      return res.status(401).json({ error: "Email y/o contraseña incorrectos" });
    }

    // Comprueba la pass
    const match = await bcrypt.compare(password, author.password);
    if (match) {
      // Quitamos password de la respuesta
      const authorWithoutPass: any = author.toObject();
      delete authorWithoutPass.password;

      // Generamos token JWT
      const jwtToken = generateToken(author._id.toString(), author.email);

      return res.status(200).json({ token: jwtToken });
    } else {
      return res.status(401).json({ error: "Email y/o contraseña incorrectos" });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /author:
 *   post:
 *     summary: Crear autor
 *     tags: [Author]
 *     description: Crea un nuevo autor con la información proporcionada.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Author'
 *     responses:
 *       201:
 *         description: Autor creado exitosamente. Devuelve los detalles del autor creado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Author'
 */

authorRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const author = new Author(req.body);

    const createdAuthor = await author.save();
    return res.status(201).json(createdAuthor);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /author/{id}:
 *   delete:
 *     summary: Eliminar autor
 *     tags: [Author]
 *     description: Elimina un autor existente según el ID proporcionado.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del autor a eliminar.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Autor eliminado exitosamente. Devuelve los detalles del autor eliminado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Author'
 *       401:
 *         description: No autorizado. El usuario no tiene permisos para realizar esta operación.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Autor no encontrado. No se encontró ningún autor con el ID proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

authorRouter.delete("/:id", isAuth, async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;

    if (req.author.id !== id && req.author.email !== "admin@gmail.com") {
      return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
    }

    const authorDeleted = await Author.findByIdAndDelete(id);
    if (authorDeleted) {
      res.json(authorDeleted);
    } else {
      res.status(404).json({ error: "Autor no encontrado" });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /author/{id}:
 *   put:
 *     summary: Actualizar autor
 *     tags: [Author]
 *     description: Actualiza un autor existente según el ID proporcionado.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del autor a actualizar.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       description: Datos del autor a actualizar.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Author'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Autor actualizado exitosamente. Devuelve los detalles del autor actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Author'
 *       401:
 *         description: No autorizado. El usuario no tiene permisos para realizar esta operación.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Autor no encontrado. No se encontró ningún autor con el ID proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

authorRouter.put("/:id", isAuth, async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;

    if (req.author.id !== id && req.author.email !== "admin@gmail.com") {
      return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
    }

    const authorToUpdate = await Author.findById(id);
    if (authorToUpdate) {
      Object.assign(authorToUpdate, req.body);
      await authorToUpdate.save();
      // Quitamos pass de la respuesta
      const authorToSend: any = authorToUpdate.toObject();
      delete authorToSend.password;
      res.json(authorToSend);
    } else {
      res.status(404).json({ error: "Autor no encontrado." });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /author/logo-upload:
 *   post:
 *     summary: Cargar logo de autor
 *     tags: [Author]
 *     description: Carga el logo de un autor.
 *     requestBody:
 *       required: true
 *       description: Archivo de imagen del logo a cargar.
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *             required:
 *               - logo
 *     responses:
 *       200:
 *         description: Logo cargado exitosamente. Devuelve los detalles del autor actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Author'
 *       404:
 *         description: Autor no encontrado. No se encontró ningún autor con el ID proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

authorRouter.post("/logo-upload", upload.single("logo"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Renombrado de la imagen
    const originalName = req.file?.originalname as string;
    const path = req.file?.path as string;
    const newPath = path + "_" + originalName;
    fs.renameSync(path, newPath);

    // Busqueda de la marca
    const authorId = req.body.authorId;
    const author = await Author.findById(authorId);

    if (author) {
      author.profileImage = newPath;
      await author.save();
      res.json(author);

      console.log("Autor modificado correctamente!");
    } else {
      fs.unlinkSync(newPath);
      res.status(404).send({ error: "Autor no encontrado." });
    }
  } catch (error) {
    next(error);
  }
});
