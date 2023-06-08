import swaggerJSDoc from "swagger-jsdoc";
import { swaggerOptions } from "../swagger-options";
import fs from "fs";

const specs = swaggerJSDoc(swaggerOptions);
const data = JSON.stringify(specs);
fs.writeFileSync("./swagger.json", data);

console.log("Swagger json generado correctamente");
