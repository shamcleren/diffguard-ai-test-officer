FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL=http://localhost:3001/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY . .
RUN npm install
RUN npm run build -w apps/demo-shop-frontend

FROM nginx:1.27-alpine
COPY --from=build /app/apps/demo-shop-frontend/dist /usr/share/nginx/html
EXPOSE 80
