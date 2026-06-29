FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build -w apps/demo-shop-backend
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["node", "apps/demo-shop-backend/dist/index.js"]
