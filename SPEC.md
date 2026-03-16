# Media Waffle Dashboard - Build Spec

## Overview
Build a Remix monolith deployed on Vercel with Supabase auth. Two user types:
1. **Admin (Agency)** - Maxim logs in, sees all clients, all reports, the agency hub
2. **Client** - Each client gets their own login, sees only their own dashboard/reports

## Tech Stack
- **Framework:** Remix (React)
- **Hosting:** Vercel
- **Auth:** Supabase (email/password)
- **Database:** Supabase Postgres
- **Styling:** Tailwind CSS

## Supabase Project
- Reference ID: lavpnfluvywcjeiyuash
- Region: ap-southeast-2 (Sydney)
- URL: https://lavpnfluvywcjeiyuash.supabase.co
- Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDEzODcsImV4cCI6MjA4OTE3NzM4N30.X_GTCS1TY8aA9UeF7s76KtMYFymii_gLRceqLP09Ep0
- Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g

## Vercel
- Team: atlasmw

## Database Schema

### profiles table
- id (uuid, FK to auth.users)
- role (text: 'admin' or 'client')
- display_name (text)
- client_slug (text, nullable - used for client users to link to their data)
- created_at (timestamptz)

### clients table
- id (uuid, primary key)
- name (text) - e.g. "Living Skin Clinic"
- slug (text, unique) - e.g. "living-skin-clinic"
- google_sheet_id (text, nullable) - links to existing Google Sheet data
- ghl_location_id (text, nullable)
- created_at (timestamptz)

## Auth Flow
- Supabase email/password auth
- On signup, a profile is created with role='client' by default
- Admin creates client users and assigns them to a client via client_slug
- Row Level Security (RLS): clients can only see their own data

## Pages

### Public
- /login - Email/password login form

### Admin Only (role='admin')
- /admin - Dashboard hub, list all clients
- /admin/clients - Manage clients (add, edit)
- /admin/clients/:slug - View specific client dashboard (same view the client sees)
- /admin/clients/:slug/report - Generate/view client report

### Client (role='client')
- /dashboard - Their own dashboard (ad performance, leads, reports)
- /dashboard/report - Their latest report

## Design
- Clean, modern, dark theme (charcoal primary)
- Beige/cream accent colour
- Responsive (works on mobile)
- Simple sidebar navigation

## Phase 1 (Build Now)
1. Remix project setup with Tailwind
2. Supabase auth integration (login/logout)
3. Database schema (profiles, clients tables with RLS)
4. Admin hub page (list clients)
5. Client dashboard page (placeholder content for now)
6. Role-based routing (admin vs client)
7. Deploy to Vercel

## Important
- Use @supabase/ssr for Remix integration (NOT @supabase/auth-helpers-remix which is deprecated)
- Configure Vercel project and link to GitHub repo AtlasMW/media-waffle-dashboard
- The GitHub repo already exists, push to it
- Use environment variables for all Supabase keys
- Australian spelling in all UI copy
