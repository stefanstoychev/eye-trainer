FROM node:12.7-alpine AS build
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build && find . -type f -exec gzip -k {} \;

FROM nginx:1.17.1-alpine
COPY default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

LABEL traefik.enable="true" \
      traefik.http.services.eye-trainer.loadbalancer.server.port="80"

EXPOSE 80

