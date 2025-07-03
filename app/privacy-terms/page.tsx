"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function PrivacyTermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-900 dark:bg-gray-100 rounded flex items-center justify-center">
              <span className="text-white dark:text-gray-900 font-bold text-lg">B</span>
            </div>
            <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">BinX</span>
          </Link>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/">
              <Button variant="ghost" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                Back to Home
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">Privacy Policy & Terms of Service</h1>
          
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-lg p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Privacy Policy</h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  <strong>We don't track you.</strong> BinX is designed with your privacy in mind. We do not collect, store, or analyze any personal tracking data about your browsing habits or usage patterns.
                </p>
                <p>
                  <strong>We don't keep information on who owns a vault.</strong> Your vault ownership information is not stored in a way that can be linked back to your personal identity. We maintain anonymity in our storage system.
                </p>
                <p>
                  <strong>We technically have the files, but we don't know who owns them.</strong> While your files are stored on our servers for the service to function, our system is designed so that we cannot associate files with specific users or identities.
                </p>
                <p>
                  <strong>We have the right to remove any unlawful activity.</strong> While we respect your privacy, we reserve the right to remove content that violates applicable laws or our terms of service, including but not limited to illegal content, copyright infringement, or content that poses security risks.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Terms of Service</h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  By using BinX, you agree to use the service responsibly and in accordance with all applicable laws and regulations.
                </p>
                <p>
                  You are responsible for the content you upload and store. You must ensure that you have the legal right to store and share any files you upload to the service.
                </p>
                <p>
                  We provide this service "as is" without warranties of any kind. While we strive to maintain high availability and security, we cannot guarantee uninterrupted service.
                </p>
                <p>
                  We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of any changes.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Contact Information</h2>
              <div className="text-gray-700 dark:text-gray-300">
                <p>
                  If you have any questions about this Privacy Policy or Terms of Service, please contact us at:{" "}
                  <a 
                    href="mailto:contact@houndsec.net" 
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    contact@houndsec.net
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} HoundSec. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
