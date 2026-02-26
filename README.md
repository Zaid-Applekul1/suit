# AplekUL Orchard Management Platform

ApplekuL is a modern web application for orchard management, built with React, TypeScript, and Vite. It integrates with Supabase for backend services and provides tools for field management, financial ledgers, advisory modules, and more.

## Features
- **User Authentication**: Secure login/signup with session management.
- **Dashboard**: Overview of orchard activities, alerts, and statistics.
- **Fields Management**: Manage orchard fields, view details, and update information.
- **Financial Ledger**: Track expenses, activities, and chemical usage with real-time database access.
- **Advisory Modules**: Skuast and Soil Test advisories for best practices and recommendations.
- **Orchard Doctor**: Diagnostic tools and templates for orchard health.
- **Tree Scouting**: Record and monitor tree scouting activities.
- **Calendar**: Activity calendar for scheduling and tracking.
- **Supabase Integration**: Real-time data storage, authentication, and file storage.
- **KML & GeoJSON Support**: Import/export orchard boundaries and field data.
- **Responsive UI**: Built with TailwindCSS and Lucide icons for a modern look.

## Folder Structure
- `src/` - Main source code
  - `components/` - UI and layout components
  - `contexts/` - React context providers (e.g., Auth)
  - `data/` - Advisory templates and mock data
  - `hooks/` - Custom React hooks
  - `lib/` - Supabase client and DB access modules
  - `pages/` - Main app pages (Dashboard, Fields, Ledger, etc.)
  - `services/` - Business logic and API wrappers
  - `types/` - TypeScript type definitions
- `public/` - Static assets and KML/GeoJSON files
- `supabase/` - Database migration SQL files

## Dependencies
- React 19
- TypeScript 5.9
- Vite 7
- Supabase JS
- TailwindCSS
- Lucide React
- React Router DOM
- ESLint (with recommended configs)

## Setup & Usage
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment:**
   - Create a `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. **Run development server:**
   ```bash
   npm run dev
   ```
4. **Build for production:**
   ```bash
   npm run build
   ```
5. **Lint code:**
   ```bash
   npm run lint
   ```

## Project Structure Example
```shell
src/
  App.tsx
  pages/
    Dashboard.tsx
    Fields.tsx
    FinancialLedger.tsx
    ...
  lib/
    supabaseClient.ts
    financialLedgerDb.ts
  data/
    skaustSprayTemplate2026.ts
public/
  test-jk-boundary.kml
supabase/
  migrations/
    *.sql
```

## License
This project is for SKUAST-K orchard management and advisory. For academic and production use.

---
For more details, see the code and comments in each module.
