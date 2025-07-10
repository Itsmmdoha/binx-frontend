"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, X } from "lucide-react"

export function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    const handleAppInstalled = () => {
      setShowBanner(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        console.log("User accepted the install prompt")
      } else {
        console.log("User dismissed the install prompt")
      }

      setDeferredPrompt(null)
      setShowBanner(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    // Remember user dismissed the banner
    localStorage.setItem("pwa-install-dismissed", "true")
  }

  if (!showBanner || localStorage.getItem("pwa-install-dismissed")) {
    return null
  }

  return (
    <div id="install-banner" className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="shadow-lg border-2 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Download className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Install BinX App</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Get quick access to your files and share directly from your device
              </p>
              <div className="flex gap-2 mt-3">
                <Button onClick={handleInstall} size="sm" className="text-xs">
                  Install
                </Button>
                <Button onClick={handleDismiss} variant="outline" size="sm" className="text-xs bg-transparent">
                  Not now
                </Button>
              </div>
            </div>
            <Button onClick={handleDismiss} variant="ghost" size="sm" className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
