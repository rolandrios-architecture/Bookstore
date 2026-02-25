import { Book } from "../models/books.model.js";
import { Author } from "../models/author.model.js";

const resolvers = {
  Query: {
    books: async () => await Book.findAll({ include: Author }),
    book: async (_, { id }) => await Book.findByPk(id, { include: Author }),
  },

  Mutation: {
    addBook: async (_, { input }) => {
      const { title, description, price, authorName } = input;
      let author = await Author.findOne({ where: { name: authorName } });
      if (!author) author = await Author.create({ name: authorName });

      const book = await Book.create({
        title,
        description,
        price,
        authorId: author.id,
      });

      return book;
    },

    updateBook: async (_, { id, input }) => {
      const book = await Book.findByPk(id);
      if (!book) throw new Error("Book not found");

      const { title, description, price, authorName } = input;
      let author = await Author.findOne({ where: { name: authorName } });
      if (!author) author = await Author.create({ name: authorName });

      await book.update({
        title,
        description,
        price,
        authorId: author.id,
      });

      return book;
    },

    deleteBook: async (_, { id }) => {
      const deleted = await Book.destroy({ where: { id } });
      return deleted ? "Book deleted successfully." : "Book not found.";
    },
  },

  Book: {
    author: async (parent) => await Author.findByPk(parent.authorId),
  },

  Author: {
    books: async (parent) => await Book.findAll({ where: { authorId: parent.id } }),
  },
};

export default resolvers;
