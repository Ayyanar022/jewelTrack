FROM node:20-alpine AS builder
RUN apk add --no-cache openssl

# 2. Set working directory inside container
WORKDIR /app

# 3. Copy package files and install dependencies 
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# 4. Generate Prisma client
RUN npx prisma generate

# 5. Copy all API source code and build NestJS
COPY . . 
RUN npm run build

# 6. Production Runner Stage (keeps image lightweight)
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose backend port (NestJS listens on PORT env, default 3002 in docker)
EXPOSE 3002

# Command to start NestJS backend
CMD ["sh", "-c", "npx prisma migrate deploy && (node dist/prisma/seed.js || true) && node dist/src/main.js"]
