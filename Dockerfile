# Build Stage for Frontend
FROM node:20-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Final Stage for Backend
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production
COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

EXPOSE 5000
WORKDIR /app/backend
CMD ["node", "server.js"]
