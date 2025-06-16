# BinX Frontend

A clean, modern React frontend for the BinX file storage API built with Next.js and TypeScript. **Fully static exportable** - no server-side rendering required!

## Features

- 🔐 Secure vault creation with username validation
- 👑 Owner and Guest access modes  
- 📁 Google Drive-like file management interface
- ⬆️ File uploads with progress tracking
- 🔗 Direct vault access via URL (e.g., `/my-vault`) - **Client-side only!**
- 📱 Responsive design with modern UI
- 🎨 Circular progress indicators
- 🔒 Full TypeScript support
- 📦 **Static export ready** - can be deployed to any CDN

## Quick Start

\`\`\`bash
# Clean installation (recommended)
chmod +x clean-install.sh
./clean-install.sh

# Or standard installation
npm install --legacy-peer-deps

# Development
npm run dev

# Build for production (static export)
npm run build
\`\`\`

## Static Export

This app is fully static and can be exported:

\`\`\`bash
npm run build
# Creates 'out' folder with static files
# Deploy the 'out' folder to any static hosting service
\`\`\`

## Environment Setup

Create `.env.local`:

\`\`\`env
NEXT_PUBLIC_BINX_API_URL=http://localhost:8000
NEXT_PUBLIC_HOUNDSEC_URL=https://houndsec.net
NEXT_PUBLIC_GITHUB_URL=https://github.com/your-username/binx
NEXT_PUBLIC_API_DOCS_URL=http://localhost:8000/docs
\`\`\`

## How Direct Vault Access Works (Client-Side)

Instead of server-side dynamic routes, we use:

1. **Client-side redirect handler** - Detects vault names in URL
2. **Static route** - `/vault-access?vault=name` handles the logic
3. **URL parsing** - Pure JavaScript, no server required

### URL Flow:
- User visits: `/my-vault`
- Client detects vault name pattern
- Redirects to: `/vault-access?vault=my-vault`
- Attempts guest login via API
- Success → Vault page | Failure → Login page

## Project Structure

\`\`\`
binx-frontend/
├── app/
│   ├── vault-access/          # Static route for vault access
│   ├── create-account/        # Vault creation with validation
│   ├── login/                # Login with pre-filled vault names
│   ├── vault/                # Main file management page
│   ├── layout.tsx            # Root layout with redirect handler
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # Custom UI components
│   └── VaultRedirectHandler.tsx # Client-side URL handler
├── utils/
│   ├── validation.ts         # Vault name validation
│   └── vaultRedirect.ts      # URL parsing logic
└── .env.local               # Environment variables
\`\`\`

## Deployment

Works with any static hosting:
- **Vercel**: `vercel --prod`
- **Netlify**: Upload `out` folder
- **GitHub Pages**: Deploy `out` folder
- **AWS S3**: Upload `out` folder
- **Any CDN**: Upload `out` folder

## License

MIT
