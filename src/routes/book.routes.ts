/**
 * @swagger
 * tags:
 *   name: Book
 *   description: The books managing API
 */

import express, { type NextFunction, type Response, type Request } from "express";

// Modelos
import { Book } from "../models/mongo/Book";

// Router propio de libros
export const bookRouter = express.Router();

// Middleware de paginación
bookRouter.get("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Estamos en el middleware /car que comprueba parámetros");

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
 * /book:
 *   get:
 *     summary: Obtener lista de libros con paginación
 *     description: Obtiene una lista de libros con paginación.
 *     tags: [Book]
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
 *         description: Lista de libros obtenida exitosamente. Devuelve información de paginación y los libros.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */

bookRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit }: any = req.query;
    const books = await Book.find()
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("author");

    // Número total de elementos
    const totalElements = await Book.countDocuments();
    const response = {
      pagination: {
        totalItems: totalElements,
        totalPages: Math.ceil(totalElements / limit),
        currentPage: page,
      },
      data: books,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /book/{id}:
 *   get:
 *     summary: Obtener libro por ID
 *     description: Obtiene un libro según su ID.
 *     tags: [Book]
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID del libro.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Libro encontrado. Devuelve los detalles del libro.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Libro no encontrado. No se encontró ningún libro con el ID proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

bookRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const book = await Book.findById(id).populate("author");
    if (book) {
      res.json(book);
    } else {
      res.status(404).json({ error: "Libro no encontrado." });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /book/title/{title}:
 *   get:
 *     summary: Buscar libro por título
 *     description: Busca un libro según su título.
 *     tags: [Book]
 *     parameters:
 *       - in: path
 *         name: title
 *         description: Título del libro.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Libro encontrado. Devuelve los detalles del libro.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Libro no encontrado. No se encontró ningún libro con el título proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

bookRouter.get("/title/:title", async (req: Request, res: Response, next: NextFunction) => {
  const title = req.params.title;

  try {
    const book = await Book.find({ title: new RegExp("^" + title.toLowerCase(), "i") }).populate("author");
    if (book?.length) {
      res.json(book);
    } else {
      res.status(404).json({ error: "Libro no encontrado." });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /book:
 *   post:
 *     summary: Crear libro
 *     description: Crea un nuevo libro.
 *     tags: [Book]
 *     requestBody:
 *       required: true
 *       description: Datos del libro a crear.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       201:
 *         description: Libro creado exitosamente. Devuelve los detalles del libro creado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 */

bookRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const book = new Book(req.body);

    const createdBook = await book.save();
    return res.status(201).json(createdBook);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /book/{id}:
 *   delete:
 *     summary: Eliminar libro
 *     description: Elimina un libro según su ID.
 *     tags: [Book]
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID del libro.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Libro eliminado exitosamente. Devuelve los detalles del libro eliminado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Libro no encontrado. No se encontró ningún libro con el ID proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

bookRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const bookDeleted = await Book.findByIdAndDelete(id);
    if (bookDeleted) {
      res.json(bookDeleted);
    } else {
      res.status(404).json({ error: "Libro no encontrado." });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /book/{id}:
 *   put:
 *     summary: Actualizar libro
 *     description: Actualiza un libro según su ID.
 *     tags: [Book]
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID del libro.
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       description: Datos actualizados del libro.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       200:
 *         description: Libro actualizado exitosamente. Devuelve los detalles del libro actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Libro no encontrado. No se encontró ningún libro con el ID proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

bookRouter.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const bookUpdated = await Book.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (bookUpdated) {
      res.json(bookUpdated);
    } else {
      res.status(404).json({ error: "Libro no encontrado." });
    }
  } catch (error) {
    next(error);
  }
});
