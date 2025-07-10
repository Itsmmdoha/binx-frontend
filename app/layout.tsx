import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://binx.houndsec.net"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "BinX - Secure File Storage",
  description:
    "Secure file storage and vault service. Store any media files or data archives with password-protected vaults. Access your files from anywhere with owner or guest modes.",
  generator: "v0.dev",
  manifest: "/manifest.json",
  keywords: ["file storage", "secure storage", "vault", "cloud storage", "file sharing", "encrypted storage"],
  authors: [{ name: "HoundSec" }],
  creator: "HoundSec",
  publisher: "HoundSec",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "BinX",
    title: "BinX - Secure File Storage",
    description:
      "Secure file storage and vault service. Store any media files or data archives with password-protected vaults. Access your files from anywhere with owner or guest modes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BinX - Secure File Storage",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@houndsec",
    creator: "@houndsec",
    title: "BinX - Secure File Storage",
    description:
      "Secure file storage and vault service. Store any media files or data archives with password-protected vaults.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BinX",
  },
  alternates: {
    canonical: siteUrl,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="canonical" href={siteUrl} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
