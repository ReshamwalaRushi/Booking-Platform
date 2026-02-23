# BookEase — Global Booking & Appointment Platform

A production-ready, full-stack booking and appointment platform that any business (salon, clinic, consultant, fitness studio, etc.) can use to manage their scheduling, clients, and payments.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **Backend** | Node.js, NestJS, TypeScript |
| **Database** | MongoDB (Mongoose ODM) |
| **Auth** | JWT + Passport.js (local + JWT strategies) |
| **Payments** | Stripe |
| **Notifications** | Nodemailer (email) + Twilio (SMS) |
| **Calendar** | Google Calendar API (OAuth2) |
| **Video** | Zoom API (server-to-server OAuth) |
| **Docs** | Swagger / OpenAPI |
| **Containers** | Docker + Docker Compose |

---

## Features

- 🔐 **Authentication** – JWT-based register/login with role support (client, business owner, admin)
- 🏢 **Business Management** – Create and manage multi-category businesses with working hours
- 🛎️ **Service Management** – Define bookable services with duration, pricing, and capacity
- 📅 **Booking System** – Full booking lifecycle (pending → confirmed → completed/cancelled) with conflict detection
- ⏰ **Available Slots** – Real-time slot availability based on service duration and existing bookings
- 📆 **Calendar View** – Interactive monthly calendar with color-coded booking status dots
- 💳 **Payments** – Stripe payment intents with webhook support
- 📧 **Notifications** – Email (Nodemailer) and SMS (Twilio) notifications with HTML templates
- 🗓️ **Google Calendar** – OAuth2 integration to sync appointments to Google Calendar
- 🎥 **Zoom Integration** – Auto-create Zoom meetings for online appointments
- 🔔 **Reminders** – Configurable booking reminders
- 📊 **Dashboard** – Stats, upcoming bookings, quick actions

---

## Project Structure

```
booking-platform/
├── backend/                    # NestJS REST API
│   ├── src/
│   │   ├── auth/               # JWT auth, Passport strategies
│   │   ├── users/              # User management
│   │   ├── businesses/         # Business profiles
│   │   ├── services/           # Bookable services
│   │   ├── bookings/           # Booking CRUD + availability
│   │   ├── notifications/      # Email + SMS
│   │   ├── payments/           # Stripe integration
│   │   ├── calendar/           # Google Calendar OAuth2
│   │   ├── zoom/               # Zoom meeting management
│   │   └── common/             # Shared decorators, filters
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                   # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Layout/         # Navbar, Sidebar, Layout
│   │   │   ├── Booking/        # BookingCard, BookingForm, BookingList
│   │   │   ├── Business/       # BusinessCard, BusinessList
│   │   │   ├── Service/        # ServiceCard
│   │   │   ├── Calendar/       # BookingCalendar
│   │   │   └── common/         # Button, Input, Modal, Badge, Spinner
│   │   ├── pages/              # Route pages
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── dashboard/      # Dashboard
│   │   │   ├── bookings/       # Bookings list, New booking wizard
│   │   │   ├── businesses/     # Business directory, detail page
│   │   │   └── calendar/       # Calendar view
│   │   ├── contexts/           # AuthContext
│   │   ├── hooks/              # useAuth, useBookings
│   │   ├── services/           # API client (Axios)
│   │   └── types/              # TypeScript interfaces & enums
│   ├── Dockerfile
│   └── nginx.conf
│
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Docker & Docker Compose (optional, for containerized setup)

---

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/ReshamwalaRushi/Booking-Platform
cd Booking-Platform

# 2. Copy and configure environment variables
cp backend/.env.example .env
# Edit .env with your API keys (Stripe, Twilio, Google, Zoom)

# 3. Start all services
docker-compose up -d

# Frontend → http://localhost:3000
# Backend API → http://localhost:3001/api/v1
# Swagger Docs → http://localhost:3001/api/docs
```

---

### Option 2: Local Development

#### Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run start:dev
# API: http://localhost:3001/api/v1
# Docs: http://localhost:3001/api/docs
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
# App: http://localhost:3000
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/booking-platform
JWT_SECRET=your-super-secret-key

# Email notifications (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS notifications (Twilio) - optional
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+1234567890

# Stripe payments - optional
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx

# Google Calendar - optional
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx

# Zoom - optional
ZOOM_ACCOUNT_ID=xxxx
ZOOM_CLIENT_ID=xxxx
ZOOM_CLIENT_SECRET=xxxx
```

> **Note:** The platform works without optional integrations. Features that require them (Stripe, Twilio, Google Calendar, Zoom) will return appropriate errors if not configured.

---

## API Documentation

Swagger UI is available at **`http://localhost:3001/api/docs`** when the backend is running.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Login |
| `GET` | `/api/v1/businesses` | List all businesses |
| `POST` | `/api/v1/businesses` | Create business |
| `GET` | `/api/v1/services?businessId=` | List services |
| `POST` | `/api/v1/bookings` | Create booking |
| `GET` | `/api/v1/bookings` | Get my bookings |
| `GET` | `/api/v1/bookings/available-slots` | Get time slots |
| `DELETE` | `/api/v1/bookings/:id` | Cancel booking |
| `POST` | `/api/v1/payments/create-intent` | Create Stripe payment intent |
| `GET` | `/api/v1/calendar/auth-url` | Get Google Calendar OAuth URL |
| `POST` | `/api/v1/zoom/meetings` | Create Zoom meeting |

---

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/login` | Sign in page |
| `/register` | Create account (client or business owner) |
| `/dashboard` | Stats, upcoming bookings, quick actions |
| `/bookings` | All bookings with status filters |
| `/bookings/new` | 3-step booking wizard |
| `/businesses` | Business directory with search & filter |
| `/businesses/:id` | Business detail + inline booking |
| `/calendar` | Monthly calendar view |

---

## Booking Flow

```
Browse Businesses → Select Service → Choose Date/Time → Confirm Booking
                                           ↓
                              Conflict check (backend)
                                           ↓
                          Email confirmation sent (optional)
                                           ↓
                        Google Calendar event created (optional)
                                           ↓
                           Zoom meeting created (if online)
```

---

## Business Categories

`salon` · `clinic` · `consultant` · `fitness` · `spa` · `dental` · `veterinary` · `other`

---

## Booking Status Lifecycle

```
PENDING → CONFIRMED → COMPLETED
    └──→ CANCELLED
    └──→ NO_SHOW
```

---

## Development

```bash
# Backend tests
cd backend && npm test

# Backend lint
cd backend && npm run lint

# Frontend tests
cd frontend && npm test

# Build for production
cd backend && npm run build
cd frontend && npm run build
```

---

## License

MIT
