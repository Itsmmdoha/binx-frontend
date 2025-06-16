"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Users, AlertCircle, FolderOpen } from "lucide-react"
import Link from "next/link"

export default function VaultAccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const vaultName = searchParams.get("vault")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attempting, setAttempting] = useState(false)

  useEffect(() => {
    if (vaultName) {
      attemptGuestLogin()
    } else {
      setError("No vault name provided")
      setLoading(false)
    }
  }, [vaultName])

  const attemptGuestLogin = async () => {
    setAttempting(true)
    setError("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/vault/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vault: vaultName,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token and user type
        localStorage.setItem("token", data.access_token)
        localStorage.setItem("userType", "guest")
        localStorage.setItem("vaultName", vaultName!)

        // Redirect to vault
        router.push("/vault")
      } else {
        setError(data.detail || "Vault not found or access denied")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
      setAttempting(false)
    }
  }

  const handleRetry = () => {
    setLoading(true)
    attemptGuestLogin()
  }

  if (loading || attempting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Accessing Vault</h2>
            <p className="text-gray-600 mb-4">Attempting guest access to vault "{vaultName}"...</p>
            <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
              <Users className="w-4 h-4" />
              <span>Guest Mode</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-red-400 to-red-600 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-gradient-to-br from-orange-400 to-red-600 rounded-full opacity-20 blur-2xl"></div>

        <div className="relative z-10 w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
              <CardDescription>Unable to access vault "{vaultName}"</CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="bg-red-50 p-4 rounded-md mb-6">
                <p className="text-red-700 text-sm">{error}</p>
              </div>

              <div className="space-y-3">
                <Button onClick={handleRetry} className="w-full" variant="outline">
                  <Loader2 className="w-4 h-4 mr-2" />
                  Try Again
                </Button>

                <Link href={`/login?vault=${vaultName}`}>
                  <Button className="w-full bg-black hover:bg-gray-800">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Login as Owner
                  </Button>
                </Link>

                <Link href="/">
                  <Button variant="ghost" className="w-full">
                    Back to Home
                  </Button>
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  This vault may be private or doesn't exist.
                  <br />
                  Contact the vault owner for access.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
