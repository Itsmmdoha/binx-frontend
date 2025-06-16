# BinX Frontend

A clean, modern React frontend for the BinX file storage API, built with **Next.js** and **TypeScript**.

## 🚀 Features

* 🔐 Secure vault creation with real-time validation
* 👑 Owner and Guest access modes
* 📁 Google Drive-like file management interface
* ⬆️ File uploads with progress tracking
* 🔗 Direct vault access via URL (`/my-vault`)
* 📱 Fully responsive, modern UI
* 🎨 Circular progress indicators for uploads
* 🛡️ Built-in TypeScript support

## ⚡ Quick Start

```bash
# Recommended: Clean installation script
chmod +x clean-install.sh
./clean-install.sh

# Or install dependencies manually
npm install --legacy-peer-deps

# Start the development server
npm run dev
```

## 🔧 Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_BINX_API_URL=http://localhost:8000
NEXT_PUBLIC_HOUNDSEC_URL=https://houndsec.net
NEXT_PUBLIC_GITHUB_URL=https://github.com/your-username/binx
NEXT_PUBLIC_API_DOCS_URL=http://localhost:8000/docs
```

## ✨ Notable Features

### 🔗 Direct Vault Access

Access vaults directly via URL:

* Example: `/my-vault` attempts guest login automatically
* If guest login fails, redirects to login page
* Ideal for sharing public vaults

### ✅ Vault Name Validation

Real-time vault name checks:

* Length: 3–30 characters
* Allowed: letters, numbers, hyphens, underscores
* Disallowed: starting/ending with special characters
* Protected: reserved names

## 🗂 Project Structure

```
binx-frontend/
├── app/
│   ├── [vaultName]/        # Dynamic vault route (guest access)
│   ├── create-account/     # Vault creation with validation
│   ├── login/              # Login page with pre-filled vault names
│   ├── vault/              # Main file manager interface
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles
├── components/ui/          # Custom UI components
├── types/                  # TypeScript definitions
├── utils/                  # Utility functions & validation
└── .env.local              # Environment variables
```

## 📄 License

MIT
