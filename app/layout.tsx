import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import type { Metadata } from "next"
import VaultRedirectHandler from "@/components/VaultRedirectHandler"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BinX - Secure File Storage",
  description: "Secure file storage and vault service with password-protected vaults.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <VaultRedirectHandler />
        {children}
      </body>
    </html>
  )
}
