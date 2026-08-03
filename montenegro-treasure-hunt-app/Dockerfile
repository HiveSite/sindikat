FROM node:22-alpine
WORKDIR /app
COPY . .
RUN mkdir -p /app/data
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0 DATABASE_FILE=/app/data/mth.sqlite
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["node","server.mjs"]
