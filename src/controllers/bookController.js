import { Book } from "../models/books.model.js";
import { Author } from "../models/author.model.js";

export const getAllBooks = async (req, res) => {
  try {
    const books = await Book.findAll({ include: Author });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBookById = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id, { include: Author });
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createBook = async (req, res) => {
  try {
    const { title, description, price, authorName } = req.body;
    let author = await Author.findOne({ where: { name: authorName } });
    if (!author) author = await Author.create({ name: authorName });

    const newBook = await Book.create({
      title,
      description,
      price,
      authorId: author.id,
    });

    res.status(201).json(newBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const { title, description, price, authorName } = req.body;
    let author = await Author.findOne({ where: { name: authorName } });
    if (!author) author = await Author.create({ name: authorName });

    await book.update({ title, description, price, authorId: author.id });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const deleted = await Book.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Book not found" });
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
