import mongoose from "mongoose";
import request from "supertest";
import { app, server } from "../src/index";
import { mongoConnect } from "../src/databases/mongo-db";
import { Book, IBook } from "../src/models/mongo/Book";

describe("Book Test", () => {
  const bookMock: IBook = {
    title: "Título 1",
    pages: 100,
    publisher: {
      name: "Pétalo S.A.",
      country: "SPAIN",
    },
  };

  let bookId: string;

  beforeAll(async () => {
    await mongoConnect();
    await Book.collection.drop();
    console.log("Eliminados todos los libros.");
  });

  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });

  it("POST /book - this should create an book", async () => {
    const response = await request(app).post("/book").send(bookMock).expect(201);

    expect(response.body).toHaveProperty("_id");
    expect(response.body.title).toBe(bookMock.title);

    bookId = response.body._id;
    console.log(bookId);
  });

  it("GET /book - returns a list with the books", async () => {
    const response = await request(app).get("/book").expect(200);

    expect(response.body.data).toBeDefined();
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].title).toBe(bookMock.title);
    expect(response.body.pagination.totalItems).toBe(1);
    expect(response.body.pagination.totalPages).toBe(1);
    expect(response.body.pagination.currentPage).toBe(1);
  });

  it("PUT /book/id - Modify book", async () => {
    const updatedData = {
      title: "Título 2",
      pages: 50,
    };

    const response = await request(app).put(`/book/${bookId}`).send(updatedData).expect(200);

    expect(response.body.title).toBe(updatedData.title);
    expect(response.body.pages).toBe(updatedData.pages);
    expect(response.body.publisher.name).toBe(bookMock.publisher.name);
    expect(response.body.publisher.country).toBe(bookMock.publisher.country);
    expect(response.body._id).toBe(bookId);
  });

  it("DELETE /book/id -  Delete book", async () => {
    const response = await request(app).delete(`/book/${bookId}`).expect(200);

    expect(response.body._id).toBe(bookId);
  });
});
