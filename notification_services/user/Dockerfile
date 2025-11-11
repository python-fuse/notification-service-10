FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx dotenv -e .env -- npx prisma generate


RUN npm run build

EXPOSE 3001

CMD ["npm", "npx prisma migrate deploy && npm run start:prod"]