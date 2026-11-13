FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate \
  && npm run build \
  && mkdir -p dist/docs \
  && cp docs/openapi.yaml dist/docs/openapi.yaml

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && exec npm start"]
