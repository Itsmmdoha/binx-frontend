"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-80 blur-xl"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-400 to-blue-600 rounded-full opacity-70 blur-lg"></div>
      <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-green-300 to-green-500 rounded-full opacity-60 blur-2xl"></div>
      <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-75 blur-xl"></div>
      <div className="absolute top-1/2 left-5 w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-full opacity-50 blur-lg"></div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="font-semibold text-lg">BinX</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a
              href={process.env.NEXT_PUBLIC_HOUNDSEC_URL || "https://houndsec.net"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              HoundSec
            </a>
            <a
              href={process.env.NEXT_PUBLIC_GITHUB_URL || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Github
            </a>
            <a
              href={process.env.NEXT_PUBLIC_API_DOCS_URL || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              API
            </a>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                Log in
              </Button>
            </Link>
            <Link href="/create-account">
              <Button className="bg-black text-white hover:bg-gray-800">Sign up</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          {/* Hero Title */}
          <div className="mb-8">
            <h1 className="text-8xl md:text-9xl font-black text-black mb-4 tracking-tight">
              BIN<span className="text-green-500">X</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12">Secure file storage and vault service.</p>
          </div>

          {/* Description */}
          <div className="max-w-md mx-auto mb-12">
            <p className="text-gray-600 leading-relaxed">
              Store any media files, folders or data archives with your password-protected vaults. Access your files
              from anywhere with owner or guest modes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/create-account">
              <Button size="lg" className="bg-black text-white hover:bg-gray-800 px-8 py-3 text-lg">
                Create vault
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 text-lg"
              >
                Access vault
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Why choose BinX?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Vaults</h3>
              <p className="text-gray-600">Password-protected vaults keep your files safe and organized.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Dual Access</h3>
              <p className="text-gray-600">Owner and guest modes for flexible file sharing and access control.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Upload</h3>
              <p className="text-gray-600">Simple drag-and-drop file uploads with progress tracking.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
