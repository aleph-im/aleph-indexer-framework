FROM node:16-alpine
WORKDIR /app

COPY . .
RUN npm ci

EXPOSE 8080
ENV NODE_ENV=production

CMD ["./cmd.sh"]