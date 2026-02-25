FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY .env ./
COPY . .

EXPOSE 8080

CMD ["npm", "start"]