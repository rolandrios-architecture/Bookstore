import { gql } from "graphql-tag";

const typeDefs = gql`
  type Author {
    id: ID!
    name: String!
    books: [Book]
  }

  type Book {
    id: ID!
    title: String!
    description: String
    price: Float!
    author: Author
  }

  type Query {
    books: [Book]
    book(id: ID!): Book
  }

  input BookInput {
    title: String!
    description: String
    price: Float!
    authorName: String!
  }

  type Mutation {
    addBook(input: BookInput!): Book
    updateBook(id: ID!, input: BookInput!): Book
    deleteBook(id: ID!): String
  }
`;

export default typeDefs;
