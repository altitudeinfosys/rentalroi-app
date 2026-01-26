# RentalROI

Next-generation rental property investment calculator with web and mobile apps.

## Project Structure

```
rentalroi.app/
├── apps/
│   ├── web/          # Next.js 14 web application
│   └── mobile/       # Expo mobile application
├── packages/
│   ├── ui/           # Shared UI components
│   ├── calculations/ # Business logic & formulas
│   ├── database/     # Supabase client & queries
│   ├── validation/   # Zod schemas
│   └── config/       # Shared configs
└── supabase/         # Supabase project files
```

## Tech Stack

- **Web:** Next.js 14 (App Router), React, Tailwind CSS
- **Mobile:** Expo (React Native), NativeWind
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Monorepo:** Turborepo + pnpm
- **Payments:** RevenueCat + Stripe
- **LLM:** OpenAI API

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Run development servers
pnpm dev
```

### Development

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all packages
- `pnpm test` - Run tests
- `pnpm type-check` - TypeScript type checking

## Apps

### Web App (`apps/web`)

```bash
cd apps/web
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Mobile App (`apps/mobile`)

```bash
cd apps/mobile
pnpm dev
```

Scan QR code with Expo Go app.

## License

Proprietary
