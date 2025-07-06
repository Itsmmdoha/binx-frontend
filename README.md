# Binx Frontend

A Next.js frontend for [binx](https://github.com/itsmmdoha/binx), built with TypeScript and Tailwind CSS. 

![image](https://github.com/user-attachments/assets/4c0535a8-6abb-4f27-9abe-8ef136c08e2e)



## Prerequisites

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Itsmmdoha/binx-frontend.git
   cd binx-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   *Note: The project uses legacy peer deps handling for compatibility.*

3. **Set up environment variables**
   
   Set these environment variables or make a `.env` files
   
   Create a `.env` file in the root directory:
   ```env
   NEXT_PUBLIC_BINX_API_URL=http://localhost:8000
   NEXT_PUBLIC_HOUNDSEC_URL=https://houndsec.net
   NEXT_PUBLIC_GITHUB_URL=https://github.com/Itsmmdoha/binx 
   NEXT_PUBLIC_API_DOCS_URL=https://github.com/Itsmmdoha/BinX/blob/main/API_Docs.md
   ```
   
   *Replace with your actual API endpoints and URLs.*

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Next.js** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

## Project Structure

```
├── app/           # Next.js app directory (pages and layouts)
├── components/    # Reusable React components
├── lib/          # utility functions
├── public/       # Static assets
├── styles/       # Global styles
└── types/        # TypeScript type definitions
```

## Environment Variables

The application uses the following environment variables:

- `NEXT_PUBLIC_BINX_API_URL` - Backend API endpoint
- `NEXT_PUBLIC_HOUNDSEC_URL` -  HoundSec.net website URL
- `NEXT_PUBLIC_GITHUB_URL` - GitHub repository URL  
- `NEXT_PUBLIC_API_DOCS_URL` - API documentation URL

All variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.
