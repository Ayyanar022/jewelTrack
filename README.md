# Important 
1. npx prisma migrate dev --name your-change-name  - prisma command
2. npx prisma generate - to gerate prisma client
3. npx shadcn@latest add button card dialog - shadcn

login = 8248834603, shop00

# JewelTrack

A SaaS application for individual jewellery shop owners in India to manage billing, stock distribution, and gold loans.

## Tech Stack

- **Frontend:** Next.js 14, Tailwind CSS, Shadcn UI
- **Backend:** NestJS, Prisma ORM (v5)
- **Database:** PostgreSQL
- **Auth:** JWT
- **Payments:** Razorpay (planned)

## Modules

| Module                      | Status         |
| --------------------------- | -------------- |
| Billing (Estimate + Actual) | 🔨 In Progress |
| Stock Distribution          | 📋 Planned     |
| Gold Rate Management        | 📋 Planned     |
| Jewel Loan                  | 📋 Planned     |

## Architecture

- Multi-tenant — each shop owner has isolated data via `shop_id`
- 13 table PostgreSQL schema
- JWT authentication with refresh tokens
- Feature gating based on subscription plan

## Local Setup

### API

cd jeweltrack-api
npm install
npx prisma migrate dev
npm run start:dev

### Web

cd jeweltrack-web
npm install
npm run dev

## Domain Logic

**Customer billing:**
Amount = (Gold Rate × (Weight + Wastage)) + Making Charge

**Stock distribution (touch calculation):**
Metal Owed = Weight × (Purity + Touch + Hallmark Rate)


22-03-2026 what we build so far 

- NestJS project setup
- Prisma 5 + PostgreSQL — 13 tables migrated
- PrismaModule — global, available everywhere
- JWT auth — register and login working
- ValidationPipe — global DTO validation
- bcrypt — password hashing




