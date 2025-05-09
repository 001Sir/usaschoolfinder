# Build frontend
FROM node:20-alpine as frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build backend
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./
COPY --from=frontend /app/frontend/build ./build
EXPOSE 4000
CMD ["node", "index.js"] 