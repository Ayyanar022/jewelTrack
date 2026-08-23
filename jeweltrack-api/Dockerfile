# 1. Base Node.js Linux image
FROM node:20-alpine AS builder

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
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose backend port (NestJS listens on 4000)
EXPOSE 4000

# Command to start NestJS backend
CMD ["node", "dist/main.js"]