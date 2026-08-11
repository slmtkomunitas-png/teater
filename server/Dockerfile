FROM node:22-slim

WORKDIR /app

COPY server/package.json server/package-lock.json ./
RUN npm install --omit=dev

COPY server/server.js .
COPY server/seed.js .

ENV PORT=3000
ENV DB_PATH=/data/absensi.db

EXPOSE 3000
CMD ["node", "server.js"]