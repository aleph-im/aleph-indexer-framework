FROM node:16-alpine
WORKDIR /app

# Install deps
COPY ["package.json", "package-lock.json*", "./"]
RUN npm ci

# Copy code
COPY . .

# Compile typescript
RUN npm run postinstall

EXPOSE 8080
ENV NODE_ENV=production

CMD ["./cmd.sh"]