# BinX Frontend

Modern React frontend for the BinX file storage API. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

* 🔐 Secure vault creation with validation
* 👑 Owner and Guest access modes
* 📁 File management with upload progress
* 📱 Responsive design
* 📦 Static export ready

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development
npm run dev

# Build for production
npm run build
```

## Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_BINX_API_URL=http://localhost:8000
NEXT_PUBLIC_HOUNDSEC_URL=https://houndsec.net
NEXT_PUBLIC_GITHUB_URL=https://github.com/your-username/binx
NEXT_PUBLIC_API_DOCS_URL=http://localhost:8000/docs
```

## Static Export

Export as a static website for CDN deployment:

```bash
# Build static files
npm run build

# Static files are generated in the 'out' folder
# Upload the 'out' folder contents to your hosting provider
```

### Hosting Options

* **Vercel**: `vercel --prod` (automatic)
* **Netlify**: Drag & drop `out` folder
* **GitHub Pages**: Upload `out` contents to `gh-pages` branch
* **AWS S3**: Upload `out` folder to an S3 bucket
* **Any web server**: Serve `out` folder as static files

### Important Notes

* All environment variables must be prefixed with `NEXT_PUBLIC_`
* The app is fully client-side – no server required
* Configure your hosting to serve `index.html` for 404s (SPA routing)

## License

MIT

