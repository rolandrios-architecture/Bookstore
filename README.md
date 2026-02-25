# RESTful API for Online Bookstore

A sample project providing:
- REST endpoints for books (MySQL + Sequelize)
- Authentication (MongoDB + Mongoose + JWT)
- GraphQL API via Apollo Server
- Docker Compose setup for local development

## Requirements
- Node.js v18+ (tested on v20)
- MySQL server
- MongoDB server (or use Docker Compose)
- npm or yarn

## Quick start (local)
1. Install deps:
```bash
npm install
```

2. Create `.env` in project root:
```env
PORT=4001
GRAPHQL_PATH=/graphql

# MySQL (Sequelize)
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASS=example
DB_NAME=bookstore

# MongoDB
MONGO_URI=mongodb://mongo:27017/bookstore

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

3. Run:
```bash
node server.mjs
# or with nodemon
npx nodemon server.mjs
```

## REST endpoints (base: /api/v1)
Books
- GET    /api/v1/books
- GET    /api/v1/books/:id
- POST   /api/v1/books
- PUT    /api/v1/books/:id
- DELETE /api/v1/books/:id

Auth
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- GET  /api/v1/auth/me      (requires Authorization: Bearer <token>)
- POST /api/v1/auth/logout

Example:
```bash
curl -H "Authorization: Bearer <YOUR_TOKEN>" http://localhost:4001/api/v1/auth/me
```

## GraphQL
- Default path: `/graphql` (see GRAPHQL_PATH)
- Open Apollo playground at: `http://localhost:4001/graphql` after server starts

## Docker Compose (recommended for dev)
Add these files to run MySQL, Mongo and the app together.

`docker-compose.yml`
```yaml
version: "3.8"
services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: example
      MYSQL_DATABASE: bookstore
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  app:
    build: .
    ports:
      - "4001:4001"
    environment:
      - PORT=4001
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASS=example
      - DB_NAME=bookstore
      - MONGO_URI=mongodb://mongo:27017/bookstore
      - JWT_SECRET=your_jwt_secret
    depends_on:
      - mysql
      - mongo

volumes:
  mysql-data:
  mongo-data:
```

`Dockerfile`
```dockerfile
FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4001
CMD ["node", "server.mjs"]
```

To build and run:
```bash
docker compose up --build
```

## Troubleshooting
- Ensure `config/mongo.js` exports `connectMongo` and uses `await mongoose.connect(process.env.MONGO_URI)` without deprecated options.
- If you see `Cannot POST /api/v1/auth/me`, call GET `/api/v1/auth/me` or add a POST route for `/me` in `routes/auth.routes.js`.
- Verify `JWT_SECRET` is set and tokens are sent as `Authorization: Bearer <token>`.
- Sequelize uses `sequelize.sync({ alter: true })` — back up DB before running in production.

## License
MIT


## Architecture
<img width="1109" height="427" alt="image" src="https://github.com/user-attachments/assets/4eb25c5b-2bec-42df-ace2-edc8f39841b0" />

