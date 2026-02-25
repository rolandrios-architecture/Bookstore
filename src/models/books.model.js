import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import { Author } from "./author.model.js";

export const Book = sequelize.define("Book", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
});

// 1️⃣ Define relationships
Author.hasMany(Book, {
  foreignKey: "authorId",
  onDelete: "CASCADE",
});
Book.belongsTo(Author, {
  foreignKey: "authorId",
});
