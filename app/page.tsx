"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"

export default function LandingPage() {
  const currentYear = new Date().getFullYear()

  // Get URLs from environment variables
  const houndSecUrl = process.env.NEXT_PUBLIC_HOUNDSEC_URL || "https://houndsec.net"
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/houndsec"
  const apiDocsUrl = process.env.NEXT_PUBLIC_API_DOCS_URL || "https://docs.binx.houndsec.net"

  return (
    <>
      <ServiceWorkerRegistration />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 relative overflow-hidden">
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "BinX",
              description:
                "Secure file storage and vault service. Store any media files or data archives with password-protected vaults.",
              url: "https://binx.houndsec.net",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              creator: {
                "@type": "Organization",
                name: "HoundSec",
                url: "https://houndsec.net",
              },
              featureList: [
                "Secure file storage",
                "Password-protected vaults",
                "Owner and guest access modes",
                "File upload and download",
                "Access control",
              ],
            }),
          }}
        />

        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-80 dark:opacity-20 blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-400 to-blue-600 rounded-full opacity-70 dark:opacity-20 blur-lg"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-green-300 to-green-500 rounded-full opacity-60 dark:opacity-20 blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-75 dark:opacity-20 blur-xl"></div>
        <div className="absolute top-1/2 left-5 w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-full opacity-50 dark:opacity-20 blur-lg"></div>

        {/* Header */}
        <header className="relative z-10 px-6 py-4">
          <nav className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 720 718" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="m231.84 688.06c0.045013-22.461 0.099334-44.923 0.11136-67.384 7.18e-4 -1.314-0.34038-2.6282-0.64407-4.7568-0.20554-3.8494-0.28941-6.8841-0.37329-9.9188 0.12756-0.74579 0.25511-1.4915 0.44681-2.8727 0.048996-1.4688 0.033844-2.3022 0.018707-3.1357 1.6475-3.8445-0.64397-4.1588-3.5865-4.1524-17.315 0.037537-34.63 0.014588-51.944 0.01947-11.654 0.003296-23.308 0.018738-35.505-0.13654-0.83595-0.34314-1.1295-0.52094-1.423-0.69867 0.067749-29.469 0.083176-58.939 0.2648-88.407 0.024673-4.0044-2.3502-3.601-4.8965-3.5993-28.809 0.019378-57.617 0.021667-86.946-0.17355-0.78448-0.42175-1.049-0.64142-1.3136-0.86105 0.08582-1.4904 0.2466-2.9807 0.24676-4.4711 0.009335-90.455 0.005486-180.91 0.33427-271.99 2.1442-0.74617 3.9569-0.96739 5.7698-0.96887 27.117-0.022156 54.234 0.011749 81.351-0.081284 1.6591-0.005692 3.3149-0.96146 4.9722-1.4752 0.14076-1.8091 0.40238-3.6181 0.40416-5.4273 0.026352-26.662 0.018173-53.325 0.018173-79.987 0-1.7825-1.5e-5 -3.565-1.5e-5 -5.9664 29.786 0 58.902 0 88.835-0.096832 1.6816-2.5732 2.5462-5.0496 3.4109-7.526 0.19545-1.7909 0.55843-3.5815 0.56111-5.3726 0.037292-24.97 0.086578-49.941-0.043946-74.911-0.018554-3.5467 0.72673-4.9388 4.6434-4.9334 90.892 0.12544 181.78 0.12271 273.21 0.62743 0.59021 27.731 0.63727 54.979 0.72769 82.226 0.00708 2.1279 0.31692 4.2548 0.48602 6.3822-1.0779 4.2786 1.9731 3.6709 4.4098 3.6731 18.465 0.017105 36.93 0.009598 55.395 0.00972 8.8167 6.1e-5 17.655 0.37399 26.442-0.1387 5.3652-0.31303 6.2313 1.6223 6.1967 6.4578-0.20099 28.111-0.065796 56.225 0.19183 85.122 1.8403 0.98998 3.444 1.3692 5.0488 1.3745 14.32 0.046569 28.639-0.00882 42.959 0.037124 14.814 0.047531 29.627 0.17458 44.44 0.26683 0.029968 47.294 0.070618 94.589 0.08667 141.88 0.014831 43.631-0.064941 87.263 0.10638 130.89 0.017517 4.4616-1.2242 5.5681-5.5985 5.5356-27.143-0.20136-54.289-0.10129-81.433-0.10126h-5.8976c0 2.3978 2.44e-4 4.1901 0 5.9824-0.00409 27.311-0.095337 54.623 0.082458 81.933 0.026367 4.0568-1.2258 5.0142-5.0937 4.9967-28.476-0.1283-56.953-0.040894-86.258-0.10132-1.0738-2.1777-1.5318-4.2755-1.5324-6.3734-0.034302-119.47-0.030548-238.94-0.030518-358.41 0-2.0803 3.1e-5 -4.1606 3.1e-5 -6.5263-11.338 0-21.826-0.15006-32.302 0.15628-1.6353 0.047806-4.0652 1.8345-4.6835 3.3908-8.5668 21.565-16.817 43.255-25.277 64.863-7.0099 17.903-14.252 35.715-21.281 53.611-4.1286 10.51-6.8705 21.47-4.583 32.681 1.8447 9.0412 4.7592 17.953 8.0636 26.591 10.483 27.404 21.402 54.641 32.095 81.965 13.108 33.497 26.224 66.992 39.151 100.56 1.667 4.3286 2.5422 8.7617 8.5144 7.7532 0.26633 5.0256 0.50238 9.4797 0.73843 13.934-0.096192 1.3877-0.19238 2.7753-0.31021 4.9267-0.063538 23.207-0.087738 45.65-0.17832 68.093-0.007873 1.9537-0.45312 3.9057-0.69519 5.8585-0.82507-0.070801-1.6501-0.20361-2.4752-0.20355-91.111 0.003234-182.22 0.016479-273.9-0.10193-0.88763-0.26837-1.2059-0.40558-1.5241-0.54285m40.032-186c4.5101-10.781 9.1692-21.502 13.499-32.355 8.844-22.168 17.702-44.334 26.146-66.655 2.9339-7.7552 6.5435-15.595 4.9465-25.149 0.034759-1.304 0.069488-2.6081 0.62888-4.3004-0.16782-1.192-0.33566-2.3841-0.51633-4.3947-0.045257-1.6317-0.090545-3.2634 0.26193-5.7612-0.15851-2.8206 0.28851-5.8442-0.57745-8.4277-4.4062-13.145-8.8743-26.283-13.847-39.221-6.812-17.724-14.181-35.234-21.158-52.896-7.8272-19.815-15.439-39.714-23.228-59.544-6.394-16.279-12.897-32.515-19.379-48.759-2.1134-5.2957-4.3152-10.556-6.4766-15.833-0.29407 0.082947-0.58815 0.16588-0.88223 0.24882v16.181c0 113.48 0 226.96 1.6e-5 340.44 0 1.1665 0.10223 2.3436-0.01854 3.4974-0.36385 3.4763 1.1221 4.6977 4.6014 4.6433 10.329-0.16147 20.663-8.85e-4 30.993-0.12808 1.4341-0.017639 2.8571-0.9473 4.2206-1.5574 0 0 0.1026 0.064606 0.78592-0.028351m108.25-272.4c12.028-32.392 24.057-64.783 36.251-97.622h-92.392c0.28348 1.0284 0.40768 1.6339 0.61523 2.2094 7.8777 21.842 15.664 43.717 23.69 65.505 3.894 10.572 8.1546 21.011 12.416 31.443 1.8044 4.4166 4.7919 7.7058 10.126 7.3883 5.1753-0.30811 7.2199-4.1417 9.2939-8.9232m-36.515 323.32c-5.0266 13.949-10.053 27.897-15.322 42.518h82.363c-0.38132-1.697-0.54346-2.9927-0.96283-4.1989-6.5337-18.792-12.963-37.622-19.719-56.335-3.2594-9.0276-6.5905-18.11-10.908-26.652-4.3023-8.5115-13.723-8.0279-18.304 0.35996-0.71277 1.3049-1.3475 2.6663-1.877 4.0554-5.0178 13.166-10.005 26.344-15.27 40.253z"
                    fill="currentColor"
                    className="text-gray-900 dark:text-gray-100"
                  />
                </svg>
              </div>
              <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">BinX</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href={houndSecUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                HoundSec
              </a>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Github
              </a>
              <a
                href={apiDocsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                API
              </a>
              <Link
                href="/privacy-terms"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Privacy & Terms
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/create-account">
                <Button className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200">
                  Sign up
                </Button>
              </Link>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="relative z-10 px-6 py-20">
          <div className="max-w-7xl mx-auto text-center">
            {/* Hero Title */}
            <div className="mb-8">
              <h1 className="text-8xl md:text-9xl font-black text-gray-900 dark:text-gray-100 mb-4 tracking-tight font-sans">
                BIN<span className="text-green-500">X</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">Secure file storage and vault service.</p>
            </div>

            {/* Description */}
            <div className="max-w-md mx-auto mb-12">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Store any media files or data archives with your password-protected vaults. Access your files from
                anywhere with owner or guest modes.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/create-account">
                <Button
                  size="lg"
                  className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 px-8 py-3 text-lg"
                >
                  Create vault
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-3 text-lg bg-transparent"
                >
                  Access vault
                </Button>
              </Link>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section id="features" className="relative z-10 px-6 py-20 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-900 dark:text-gray-100">Why choose BinX?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Secure Storage</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your files are protected with password-based encryption and secure vaults.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Easy Upload</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload multiple files with drag-and-drop support and progress tracking.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Access Control</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Control who can access your files with owner and guest modes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>&copy; {currentYear} HoundSec. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
