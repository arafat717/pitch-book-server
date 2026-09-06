# Pitch Book Server

Backend API for a turf and sports-ground booking platform. Players can discover available slots, create bookings, pay through bKash, and receive booking confirmation details by email as a PDF. Owners manage grounds and payouts, while admins manage platform operations.

## Stack

Node.js, Express, TypeScript, PostgreSQL, Prisma, Redis, JWT, bKash, Nodemailer, and PDFKit.

## Features

- Player registration, email verification, login, Google authentication, and password reset
- Ground, photo, schedule, pricing-rule, and slot management
- Player slot booking and cancellation
- bKash payment initiation and callback handling
- Booking confirmation email with a PDF attachment after successful payment
- Owner payout requests and admin payout approval/payment
- Role-based authentication for `PLAYER`, `OWNER`, and `ADMIN`

## Requirements

- Node.js 20+
- PostgreSQL 14+
- Redis
- bKash merchant credentials for payment testing
- SMTP credentials for email and PDF confirmation testing

## Setup

```bash
npm install
copy .env.example .env
npx prisma generate
npx prisma migrate dev
npm run dev
```

The API runs at `http://localhost:5000` by default. Check the server with:

```bash
curl http://localhost:5000/
```

Configure the database, JWT, Redis, Google, SMTP, frontend, and bKash values in `.env`. Never commit real credentials or production secrets.

## Main API routes

Base path: `/api/v1`

| Module        | Base route         | Purpose                                                |
| ------------- | ------------------ | ------------------------------------------------------ |
| Auth          | `/auth`            | Register, verify email, login, profile, password reset |
| Grounds       | `/ground`          | Create and manage sports grounds                       |
| Ground photos | `/ground-photo`    | Manage ground images                                   |
| Schedules     | `/ground-schedule` | Configure opening hours                                |
| Pricing       | `/ground-price`    | Configure pricing rules                                |
| Slots         | `/ground-slots`    | Create and manage bookable slots                       |
| Bookings      | `/book-slot`       | Book, pay, cancel, and process payment callbacks       |
| Payouts       | `/payout`          | Owner balance and payout workflows                     |
| Admin         | `/admin`           | Administrative operations                              |

Booking flow:

1. Log in as a player and use the returned `data.accessToken` as a Bearer token.
2. `POST /api/v1/book-slot` with `{ "slotId": "..." }`.
3. Follow the returned bKash payment URL.
4. The payment callback confirms the booking and sends the player a PDF email.

## Useful commands

```bash
npm run dev       # development server with reload
npm run build     # TypeScript build
npm run start     # start the compiled server
npx prisma studio # inspect database records
```

## Project files

- `src/app/module/` - feature modules with routes, controllers, and services
- `prisma/schema/` - split Prisma schema files
- `prisma/migrations/` - database migrations
- `postman/pitch-book-api.postman_collection.json` - importable API collection
- `drawsql_pitch_book.sql` - PostgreSQL schema export for DrawSQL

## Response format

Most API responses use:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "data": {}
}
```
