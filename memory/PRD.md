# Quality Metals Limited — Website (PRD)

## Original Problem
"I need to build a website for my steel trading business" — user provided 9-page company catalog (Quality Metals Limited, NZ) with full product range, services, certifications, and contact details.

## User Personas
1. **Procurement engineer** at an EPC / fabricator searching for a specific grade (e.g., Duplex 2205, Inconel 625) and ready to send a BOM.
2. **Project manager** evaluating supplier credibility — quality programme, certifications, track record.
3. **Admin (sales desk)** managing the product catalog and quote inbox.

## Tech Stack
- Backend: FastAPI + Motor (MongoDB), JWT (PyJWT) + bcrypt, UUID ids
- Frontend: React 19, react-router-dom, axios, Tailwind, shadcn/ui (sonner toasts), @phosphor-icons/react
- Design: Swiss high-contrast, cobalt #002FA7 + white, Cabinet Grotesk + IBM Plex Sans/Mono, no rounded corners, "Control Room" tables, dark footer flip with massive CTA

## Implemented (Dec 2025)
- **Public site (9 pages)**: Home, Products (catalog), Products by category (`/products/:slug`), Industries, Services, Quality, About, Contact, Request Quote (form → DB)
- **Admin** (`/admin/login`, `/admin`): Overview dashboard with KPIs + by-category breakdown; Products CRUD; Inquiries inbox with status workflow (new → in_review → quoted → closed)
- **Backend**: 
  - Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` (Bearer + httpOnly cookie)
  - Public: `GET /api/categories`, `GET /api/products` (filterable by category/featured), `GET /api/products/{id}`, `POST /api/inquiries`
  - Admin (auth-gated): Products CRUD, Inquiries list/patch/delete, `GET /api/admin/stats`
  - Brute-force lockout (X-Forwarded-For aware) — 5 fails / 15 min
- **Seed**: 25 sample products covering Carbon Steel, Mild Steel, Stainless Steel, Duplex/Super Duplex, High Nickel Alloys, Titanium, Fasteners. Admin seeded from `.env` (idempotent).

## Tests
- 23/23 backend pytest tests pass (`/app/backend/tests/test_api.py`)
- Frontend Playwright critical flows pass (Home, Products, Quote submit, Admin login + dashboard + logout)
- Test credentials: `/app/memory/test_credentials.md`

## Backlog (P1/P2)
- **P1** Email notifications for new inquiries (Resend/SendGrid)
- **P1** Public product detail pages with downloadable PDF datasheet
- **P1** Image upload for products (currently text-only)
- **P2** Multi-admin support / RBAC
- **P2** Live steel price ticker (manual admin update)
- **P2** Multilingual (EN + simplified Chinese for sourcing partners)
- **P2** Sitemap + structured data (SEO)
