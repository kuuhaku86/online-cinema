# frontend/Dockerfile
FROM node:slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5173

CMD [ "yarn", "dev" ]