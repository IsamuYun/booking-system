# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A consulting room booking system for managing appointments between counselors and clients. The system handles booking creation, recurring schedules, room allocation, fee calculation, and reporting.

## Repository Structure

This is a monorepo with two separate apps:
- `server/` — Node.js/Express REST API backend with SQLite database
- `miniprogram/` — WeChat Mini Program frontend (requires WeChat Developer Tools to run)

## Backend Commands

All commands run from the `server/` directory:

```bash
npm start          # Start production server (node app.js)
npm run dev        # Start with auto-reload via nodemon
npm run seed       # Seed database with initial counselor/room data
```

```bash
# Docker
docker-compose up --build   # Build and start containerized server on port 3000
```

No test framework is configured (`npm test` will error).

## Backend Architecture

**Entry point:** `app.js` — sets up Express, CORS, JSON body parsing, and mounts all routes.

**Database:** SQLite file at `./data/database.sqlite` (locally) or `/app/data/database.sqlite` (Docker). Uses Sequelize ORM. Models are defined in `models/init.js` and the database connection is established in `models/index.js`. Sequelize runs `sync()` on startup.

**Core models:**
- `User` — phone-based auth, roles: `admin` / `user` / `guest`
- `Counselor` — consultant profiles with type (`内部`/`外部`/`合作`) and pricing
- `Room` — consultation rooms (`咨询室`) and multi-function rooms (`多功能室`)
- `Booking` — appointments; status values: `booked` / `cancelled` / `completed` / `scheduled`
- `RecurringRule` — weekly recurring schedule templates

**Routes** are all defined in `routes/index.js` and map to controllers in `controllers/`.

**Auth:** Phone-number-based login, JWT tokens. The JWT secret is currently hardcoded as `'YOUR_JWT_SECRET'` in `authController.js` — it should be moved to an environment variable.

**Time slots:** Bookings use slot numbers (2 slots per hour = 30-minute increments).

## Mini Program Architecture

**Entry point:** `app.js` — handles WeChat login on launch, stores JWT token and user info in `globalData`.

**HTTP requests** go through `utils/request.js`, which attaches the JWT token from storage and handles 401 responses. The base URL is hardcoded to `http://192.168.0.22:3000` — update this for different environments.

**Pages** are registered in `app.json`. Key pages: `login`, `register`, `home`, `booking`, `quick-booking`, `recurring`, `admin`, `import`.

The mini program uses WeChat's Skyline renderer with the glass-easel component framework (configured in `project.config.json`).

## Environment Variables

Set via Docker environment or process environment:
- `DB_PATH` — SQLite file path
- `PORT` — server port (default `3000`)
- `HOST` — bind host (default `0.0.0.0`)

WeChat API credentials (`WECHAT_APP_ID`, `WECHAT_APP_SECRET`) are currently hardcoded in `authController.js` and should be moved to environment variables.

## Language

All code comments, variable names in domain logic, and database seed data are in Chinese. This is intentional — the system serves a Chinese-language consulting practice.
