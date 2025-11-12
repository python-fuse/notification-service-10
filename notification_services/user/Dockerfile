FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN ls -la

RUN npx dotenv -e .env -- npx prisma generate


RUN npm run build

RUN ls -la dist

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]