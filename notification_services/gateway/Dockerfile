FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN npm install -g pnpm && pnpm install --prod

COPY . .

EXPOSE 3000



CMD ["pnpm", "start"]