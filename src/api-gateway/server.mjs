import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";
import { verifyToken } from "./middleware/authVerify.js";

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
// JSON body parser moved below proxy mounts so proxy can stream raw requests

// 🔒 Auth API (JWT required)
// Note: only keep verifyToken if this route *must* be protected
app.use(
  "/api/v1/authentication",
  createProxyMiddleware({
    target: process.env.BOOKSTORE_API_URL,
    changeOrigin: true,
    pathRewrite: (path) => {
      const rewritten = `/api/v1/auth${path === "/" ? "/" : path}`;
      console.log(`Auth rewrite: ${path} → ${rewritten}`);
      return rewritten;
    },
    logLevel: "debug",
    onProxyReq(proxyReq, req, res) {
      console.log(`➡️  Proxying ${req.method} ${req.originalUrl}`);
    },
    onProxyRes(proxyRes, req, res) {
      console.log(`✅ proxyRes: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
    },
    onError(err, req, res) {
      console.error("❌ proxy error:", err.message);
      if (!res.headersSent) res.status(502).send("Bad gateway");
    },
  })
);

// parse JSON for any local handlers (keep after proxies so proxy can stream raw requests)
// 📚 Bookstore API (unprotected for now)
app.use(
  "/api/v1/bookstore",
  createProxyMiddleware({
    target: process.env.BOOKSTORE_API_URL,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      console.log(`Path rewrite: ${path} → /api/v1/books${path === "/" ? "/" : path}`);
      return `/api/v1/books${path === "/" ? "/" : path}`;
    },
    logLevel: "debug",
    // rely on streaming proxy for request bodies
    onProxyRes(proxyRes, req, res) {
      console.log(`✅ proxyRes: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
    },
    onError(err, req, res) {
      console.error('❌ proxy error', err && err.message);
      try {
        if (!res.headersSent) res.statusCode = 502;
        res.end('Bad gateway');
      } catch (e) {
        console.error('❌ error sending 502 response', e && e.message);
      }
    },
  })
);
// parse JSON for any local handlers (keep after proxies so proxy can stream raw requests)
app.use(express.json());

app.listen(PORT, () => {
  console.log(`🚪 API Gateway running on port ${PORT}`);
  console.log(`📚 Proxy /api/v1/bookstore/* → ${process.env.BOOKSTORE_API_URL}/api/v1/books/*`);
});
