# Build the frontend, then serve it + the API from one Node process.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY server ./server
COPY --from=build /app/dist ./dist
ENV PORT=8787 DB_FILE=/data/ship2h.db TRUST_PROXY=1
VOLUME /data
EXPOSE 8787
CMD ["node", "--no-warnings", "server/index.mjs"]
