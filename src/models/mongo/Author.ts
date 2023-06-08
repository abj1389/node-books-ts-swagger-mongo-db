/**
 * @swagger
 * definitions:
 *   Author:
 *     type: object
 *     properties:
 *       _id:
 *         type: string
 *         example: 60bdfe8c12b724001fcd4c68
 *       email:
 *         type: string
 *         example: example@example.com
 *       name:
 *         type: string
 *         example: John Doe
 *       country:
 *         type: string
 *         example: COLOMBIA
 *       profileImage:
 *         type: string
 *         example: https://example.com/profile.jpg
 *       createdAt:
 *         type: string
 *         format: date-time
 *         example: 2023-06-07T10:30:00Z
 *       updatedAt:
 *         type: string
 *         format: date-time
 *         example: 2023-06-07T11:15:00Z
 */

import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import { type IBook } from "./Book";
const Schema = mongoose.Schema;

const allowedCountries = ["COLOMBIA", "ENGLAND", "RUSSIA", "UNITED STATES", "ARGENTINA", "CZECHOSLOVAKIA", "JAPAN", "NIGERIA"];

export interface IAuthor {
  email: string;
  password: string;
  name: string;
  country: string;
  profileImage: string;
  books?: IBook[];
}

// Creamos el schema del autor
const authorSchema = new Schema<IAuthor>(
  {
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: "Email incorrecto",
      },
    },
    password: {
      type: String,
      trim: true,
      required: true,
      minLength: [8, "La contraseña debe tener al menos 8 caracteres"],
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: [3, "El nombre debe tener 3 caracteres como minimo..."],
      maxLength: [30, "El nombre no puede tener mas de 20 caracteres..."],
    },
    country: {
      type: String,
      required: true,
      trim: true,
      enum: allowedCountries,
      uppercase: true,
    },
    profileImage: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

authorSchema.pre("save", async function (next) {
  try {
    // Si la contraseña ya estaba encriptada, no la encriptamos de nuevo
    if (this.isModified("password")) {
      const saltRounds: number = 10;
      const passwordEncrypted: string = await bcrypt.hash(this.password, saltRounds);
      this.password = passwordEncrypted;
    }

    next();
  } catch (error: any) {
    next(error);
  }
});

export const Author = mongoose.model<IAuthor>("Author", authorSchema);
