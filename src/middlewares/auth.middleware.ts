import { Author } from "../models/mongo/Author";
import { verifyToken } from "../utils/token";
import { type NextFunction, type Response } from "express";

export const isAuth = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new Error("No tienes autorización para realizar esta operación");
    }

    // Descodificamos el token
    const decodedInfo = verifyToken(token);
    const author = await Author.findOne({ email: decodedInfo.authorEmail }).select("+password");
    if (!author) {
      throw new Error("No tienes autorización para realizar esta operación");
    }
    console.log(typeof decodedInfo, decodedInfo);
    req.author = author;
    next();
  } catch (error) {
    res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
    next(error);
  }
};
