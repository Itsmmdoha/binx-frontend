# BinX Frontend (TypeScript)

A modern React frontend for the BinX file storage API built with Next.js and TypeScript.

## Features

- 🔐 Secure vault creation and authentication
- 👑 Owner and Guest access modes
- 📁 Google Drive-like file management interface
- ⬆️ File uploads with progress tracking
- 📱 Responsive design with modern UI
- 🎨 Beautiful design with circular progress indicators
- 🔒 Full TypeScript support for type safety

## Prerequisites

- Node.js 18+ installed
- BinX API running on localhost:8000

## Getting Started

### 1. Clean Installation

\`\`\`bash
# Remove any existing dependencies
rm -rf node_modules package-lock.json

# Install dependencies
npm install
\`\`\`

### 2. Environment Setup

Create a `.env.local` file in the root directory:

\`\`\`env
NEXT_PUBLIC_BINX_API_URL=http://localhost:8000
NEXT_PUBLIC_HOUNDSEC_URL=https://houndsec.net
NEXT_PUBLIC_GITHUB_URL=https://github.com/your-username/binx
NEXT_PUBLIC_API_DOCS_URL=http://localhost:8000/docs
\`\`\`

### 3. Start the Development Server

\`\`\`bash
npm run dev
\`\`\`

The app will be available at [http://localhost:3000](http://localhost:3000)

## TypeScript Features

- **Type Safety**: Full TypeScript coverage with proper interfaces
- **API Types**: Strongly typed API responses and requests
- **Component Props**: Type-safe component properties
- **Event Handlers**: Properly typed event handlers
- **State Management**: Type-safe state management

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

\`\`\`
binx-frontend/
├── app/
│   ├── create-account/
│   │   └── page.tsx         # Vault creation page
│   ├── login/
│   │   └── page.tsx         # Login page with owner/guest tabs
│   ├── vault/
│   │   └── page.tsx         # Main vault file management page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   └── globals.css          # Global styles
├── components/
│   └── ui/                  # Reusable UI components
├── types/
│   └── index.ts             # TypeScript type definitions
├── utils/
│   ├── fileIcons.ts         # File icon utilities
│   └── formatters.ts        # Formatting utilities
├── .env.local               # Environment variables
├── tsconfig.json            # TypeScript configuration
└── package.json
\`\`\`

## Dependency Resolution

This version eliminates the previous dependency conflicts by:

- ✅ Removing unused `date-fns` and `react-day-picker` dependencies
- ✅ Using native JavaScript Date methods for formatting
- ✅ Clean TypeScript setup with proper type definitions
- ✅ No conflicting peer dependencies

## License

MIT License
# binx-frontend
