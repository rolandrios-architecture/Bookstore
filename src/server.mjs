import express from "express";
import http from "node:http";
import cors from "cors";
import dotenv from "dotenv";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import client, { collectDefaultMetrics } from "prom-client"
import  typeDefs  from "./graphql/typeDefs.js";
import  resolvers from "./graphql/resolvers.js";
import { connectDB, sequelize } from "./config/db.js";
import "./models/author.model.js";
import "./models/books.model.js";
import bookRoutes from "./routes/bookRoutes.js";
import { connectMongo }  from "./config/mongo.js";     // path you used
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const PORT = process.env.PORT || 4001;
const GRAPHQL_PATH = process.env.GRAPHQL_PATH || "/graphql";

const app = express();
const httpServer = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use("/api/v1/books", bookRoutes); 
app.use("/api/v1/auth", authRoutes);

const register = new client.Registry();
collectDefaultMetrics({ register });

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await connectDB();            // ✅ connect to MySQL first
await sequelize.sync({ alter: true }); // ✅ ensures tables match models
await connectMongo();             // ensure Mongo is connected


const httpRequestCounter = new client.Counter({
  name: 'http_request_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => { 
    const duration = (Date.now() - start) / 1000;
    httpRequestCounter.inc({ method: req.method, route: req.path, status_code: res.statusCode });
    httpRequestDuration.observe({ method: req.method, route: req.path }, duration);
  });
  next();
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

await server.start();
app.use(GRAPHQL_PATH, expressMiddleware(server));

await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));

app.use((req, res, next) => {
  console.log(`Backend recibió: ${req.method} ${req.url}`);
  next();
});

console.log(`🚀 Server ready at http://localhost:${PORT}${GRAPHQL_PATH}`);
