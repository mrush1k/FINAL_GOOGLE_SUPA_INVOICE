# Invoice Easy - Professional Invoice Management

A modern, full-stack invoice management application built specifically for solo operators, contractors, tradesmen, and small business owners. Built with Next.js 14, TypeScript, Tailwind CSS, Prisma, and Supabase.

## 🚀 Features

### ✅ Completed Features

#### Authentication & User Management
- **User Registration** - Sign up with email, username, password, country, and currency
- **Secure Login** - JWT-based authentication with Supabase
- **Password Reset** - Email-based password recovery
- **Multi-device Support** - Sessions persist across browsers and devices
- **User Profiles** - Complete user profile management

#### Customer Management
- **Add/Edit/Delete Customers** - Full CRUD operations for customer management
- **Dynamic Country Fields** - Business registration fields adapt based on selected country:

  ## 🏗 Project structure (clean, hierarchical)

  Below is a concise, developer-friendly tree of the repository. Each entry includes representative files and a short description.

  ./
  ├─ .env.example              # Example env file (copy to .env and fill in)
  ├─ package.json              # npm scripts and dependencies
  ├─ tsconfig.json             # TypeScript configuration
  ├─ next.config.js            # Next.js configuration
  ├─ tailwind.config.ts        # Tailwind CSS config
  ├─ postcss.config.js         # PostCSS config
  ├─ README.md                 # This file
  ├─ WEBSOCKET.md              # Local WebSocket test & configuration notes
  ├─ docker-compose.yml        # Optional local services
  ├─ scripts/                  # Utility scripts for maintenance
  │  └─ fix-supabase-routes.sh
  ├─ backups/                  # (Optional) DB dumps
  ├─ docs/                     # Project documentation and guides
  ├─ public/                   # Public assets (served statically)
  │  ├─ favicon.svg
  │  └─ scripts/               # Small client scripts
  ├─ prisma/                   # Prisma schema + migrations
  │  ├─ schema.prisma
  │  └─ migrations/
  ├─ tests/                    # Small test helpers (DB/env checks)
  │  ├─ test-db-connection.js
  │  └─ test-current-env.js
  └─ app/                      # Next.js App Router (UI + API routes)
    ├─ globals.css            # Global styles
    ├─ layout.tsx             # Root layout (providers, fonts)
    ├─ page.tsx               # Public landing page
    ├─ env-check/             # /env-check page to validate .env values
    ├─ login/                 # Auth pages (login UI)
    ├─ signup/                # Signup pages
    ├─ reset-password/        # Password reset pages
    ├─ dashboard/             # Protected app (authenticated UI)
    │  ├─ layout.tsx
    │  ├─ page.tsx
    │  └─ invoices/           # Invoices UI and pages
    └─ api/                   # API routes (server handlers)
      ├─ auth/
      ├─ users/
      ├─ customers/
      ├─ invoices/
      ├─ email/
      └─ websocket/

  components/                  # Reusable React components
  ├─ ai-chatbot.tsx            # AI assistant UI
  ├─ optimized-image.tsx       # Lazy / responsive image wrapper
  ├─ protected-route.tsx       # Client-side route protection
  └─ ui/                       # Design system primitives (shadcn/ui)
    ├─ button.tsx
    ├─ card.tsx
    ├─ sheet.tsx
    └─ icons.tsx

  lib/                         # Shared utilities, clients, and services
  ├─ supabase.ts               # Server-side Supabase helpers
  ├─ supabaseClient.ts         # Client-side Supabase instance
  ├─ prisma.ts                 # Prisma client wrapper
  ├─ websocket-client.ts       # WebSocket client wrapper for realtime updates
  ├─ websocket-diagnostics.ts  # Diagnostics adapter for WS client
  ├─ pdf-generator.ts          # Invoice PDF generation helpers
  └─ utils.ts                  # Misc helpers

  hooks/
  └─ use-toast.ts              # Toast helper hook

  types/
  └─ payments.d.ts             # Global type definitions (example)

  Notes:
  - Use `./.env.example` as the starting point for `.env` (if present). If no `.env.example` exists, check `app/env-check` to see required env vars.
  - API routes live under `app/api/*` (each folder contains Next.js route handlers).
  - `lib/` contains the business logic and integrations (Supabase, Prisma, WebSocket client).
  - `components/ui/` holds the design primitives used across the app (buttons, dialogs, cards).

│   └── protected-route.tsx      # Route protection wrapper
├── lib/                         # Utilities and configurations
│   ├── auth-context.tsx         # Authentication context
│   ├── supabase.ts             # Supabase client
│   ├── types.ts                # TypeScript interfaces
│   └── utils.ts                # Helper functions
├── prisma/                      # Database schema and migrations
│   └── schema.prisma           # Database models
└── .env                        # Environment configuration
```

## � Detailed File & Folder Map

The list below maps important files and folders in this repository to their paths and a short description. Use this as a quick reference to find code, configuration, and utilities.

Top-level files and folders
- `app/` - Next.js App Router (pages and API routes; main application UI)
- `backups/` - Database dump backups (example dumps for recovery/testing)
- `components/` - Reusable React components and UI building blocks
- `components.json` - Component metadata/config used by the project
- `docker-compose.yml` - Docker compose for local services (if used)
- `docs/` - Documentation files (guides, rules, migration notes)
- `fix-supabase-routes.sh` - Helper script for fixing Supabase-related routes or permissions
- `hooks/` - React hooks used across the app (e.g., `use-toast.ts`)
- `lib/` - App utilities, clients, and shared logic (Supabase, prisma helpers, websocket client)
# Invoice Easy - Professional Invoice Management

Short description
-----------------

Invoice Easy is a full-stack invoice management application aimed at solo operators, contractors and small businesses. It uses Next.js (App Router), TypeScript, Tailwind CSS, Prisma and Supabase for auth and persistence.

This README focuses on a clear, developer-friendly project structure to help you quickly find code and contribute.

## Project structure (clean hierarchical map)

Below is a navigable tree of the most relevant files and folders. Paths are relative to the repository root.

./
├─ .env.example                # Example environment variables (copy to .env)
├─ package.json                # NPM scripts and dependency manifest
├─ package-lock.json           # Generated lockfile
├─ tsconfig.json               # TypeScript config
├─ next.config.js              # Next.js configuration
├─ tailwind.config.ts          # Tailwind CSS config
├─ postcss.config.js           # PostCSS pipeline config
├─ README.md                   # Project README (this file)
├─ WEBSOCKET.md                # WebSocket testing and notes
├─ docker-compose.yml          # Optional local stack (Postgres, etc.)
├─ scripts/                    # Maintenance and helper scripts
│  └─ fix-supabase-routes.sh
├─ backups/                    # (Optional) DB dumps
├─ docs/                       # Detailed documentation and guides
├─ public/                     # Public/static assets (served at /)
│  ├─ favicon.svg
│  └─ scripts/                 # Small client scripts used by the UI
├─ prisma/                     # Prisma schema and migration history
│  ├─ schema.prisma
│  └─ migrations/
├─ tests/                      # Quick test scripts and dev utilities
│  ├─ test-db-connection.js
│  └─ test-current-env.js
├─ components/                 # Reusable React components
│  ├─ ai-chatbot.tsx
│  ├─ optimized-image.tsx
│  ├─ protected-route.tsx
│  └─ ui/                      # Design primitives (shadcn/ui wrappers)
│     ├─ button.tsx
│     ├─ card.tsx
│     ├─ sheet.tsx
│     └─ icons.tsx
├─ lib/                        # Application logic, clients, and helpers
│  ├─ supabase.ts
│  ├─ supabaseClient.ts
│  ├─ prisma.ts
│  ├─ websocket-client.ts
│  ├─ websocket-diagnostics.ts
│  ├─ pdf-generator.ts
│  └─ utils.ts
├─ hooks/                      # Custom React hooks
│  └─ use-toast.ts
├─ types/                      # Global TypeScript declarations
│  └─ payments.d.ts
└─ app/                        # Next.js App Router (UI + API routes)
   ├─ globals.css
   ├─ layout.tsx               # Root layout (providers, fonts)
   ├─ page.tsx                 # Public landing page
   ├─ env-check/               # Route that validates environment variables
   ├─ login/                   # Login UI
   ├─ signup/                  # Signup UI
   ├─ reset-password/          # Password reset UI
   ├─ dashboard/               # Protected dashboard area (authenticated)
   │  ├─ layout.tsx
   │  ├─ page.tsx
   │  └─ invoices/             # Invoices UI & pages
   └─ api/                     # Server API route folders (Next.js handlers)
      ├─ auth/
      ├─ users/
      ├─ customers/
      ├─ invoices/
      ├─ email/
      └─ websocket/

## Folder descriptions (short)

- app/: UI and server routes. Top-level React components and API routes live here. Use this as your starting point for UI changes.
- components/: Shared UI components and design primitives. `components/ui/` contains building blocks used across the app.
- lib/: Integrations and business logic. Supabase and Prisma helpers, WebSocket client, PDF helpers and other utilities.
- prisma/: Database schema and migration history. Edit `schema.prisma` for model changes and run migrations.
- public/: Static assets (images, fonts, client-side scripts) available under `/` at runtime.
- scripts/: Small maintenance scripts (database helpers, route fixes, etc.).
- tests/: Tiny scripts to validate DB connectivity and environment variables.

## Quick developer setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Create `.env` from `.env.example` and fill values (DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SMTP, etc.)

3. Generate Prisma client and run migrations:

   ```powershell
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. Run dev server:

   ```powershell
   npm run dev
   ```

Visit `http://localhost:3000`.

## Notes for contributors

- Keep changes scoped: modify `lib/` for business logic and `app/` for UI & routes.
- When adding new API routes, create a folder under `app/api/` and add route handlers there.
- If you add or modify Prisma models, run `npx prisma migrate dev` and commit the migration files.

---

If you'd like, I can now expand the `app/api/` section into a file-by-file map (showing specific route files), or generate a short CONTRIBUTING.md with coding conventions and PR checklist.

---

## 🔧 Setup (developer)

1. Install

```powershell
npm install
```

2. Create `.env` from `.env.example` and fill in credentials (Supabase, DATABASE_URL, SMTP, etc.).

3. Generate Prisma client and run migrations (after `.env`):

```powershell
npx prisma generate
npx prisma migrate dev --name init
```

4. Run dev server:

```powershell
npm run dev
```

Visit `http://localhost:3000`.

---

## 🚀 Deployment notes

- For Vercel builds, ensure Prisma client is generated during build. Add a `postinstall` script to `package.json`:

```json
"postinstall": "prisma generate"
```

- If you deploy in an environment without a persistent WS server, point `NEXT_PUBLIC_WS_URL` to your WebSocket provider or remove real-time features.

---

If you'd like, I can now:
- expand the `app/api/` section with a file-by-file list,
- add a CONTRIBUTING.md with dev conventions, or
- generate a short developer quickstart (one-liner commands and env checklist).
