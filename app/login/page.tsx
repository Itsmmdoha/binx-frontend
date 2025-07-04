"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Crown, Users, AlertCircle } from "lucide-react"
import type { UserType } from "@/types"

interface FormData {
  vault: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<UserType>("owner")
  const [formData, setFormData] = useState<FormData>({
    vault: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Function to clear authentication data
  const clearAuthData = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userType")
    localStorage.removeItem("vaultName")
  }

  // Function to verify token validity
  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/vault/fetch`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        // Token is invalid/expired, clear auth data
        clearAuthData()
        return false
      }

      return response.ok
    } catch (error) {
      console.error("Token verification failed:", error)
      return false
    }
  }

  // Redirect to /vault if already logged in and token is valid
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("token")
      const userType = localStorage.getItem("userType")
      const vaultName = localStorage.getItem("vaultName")

      if (token && userType && vaultName) {
        const isTokenValid = await verifyToken(token)
        if (isTokenValid) {
          router.replace("/vault")
        }
        // If token is invalid, auth data is already cleared by verifyToken
      }
    }

    checkAuthStatus()
  }, [router])

  // Add this useEffect after the existing useEffect
  useEffect(() => {
    // Handle Firefox autofill detection
    const handleAutofill = () => {
      const vaultInput = document.getElementById("vault") as HTMLInputElement
      const passwordInput = document.getElementById("password") as HTMLInputElement

      if (vaultInput?.value && vaultInput.value !== formData.vault) {
        setFormData((prev) => ({ ...prev, vault: vaultInput.value }))
      }
      if (passwordInput?.value && passwordInput.value !== formData.password) {
        setFormData((prev) => ({ ...prev, password: passwordInput.value }))
      }
    }

    // Check for autofilled values periodically (Firefox workaround)
    const interval = setInterval(handleAutofill, 100)

    // Also check on focus events
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"]')
    inputs.forEach((input) => {
      input.addEventListener("focus", handleAutofill)
      input.addEventListener("blur", handleAutofill)
    })

    // Cleanup
    return () => {
      clearInterval(interval)
      inputs.forEach((input) => {
        input.removeEventListener("focus", handleAutofill)
        input.removeEventListener("blur", handleAutofill)
      })
    }
  }, [formData.vault, formData.password])

  // Update the handleChange function to also handle onInput events
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement
    setFormData((prev) => ({
      ...prev,
      [target.name]: target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const requestBody: any = { vault: formData.vault.trim().toLowerCase() }
      if (activeTab === "owner") {
        requestBody.password = formData.password
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/vault/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.access_token)
        localStorage.setItem("userType", activeTab)
        localStorage.setItem("vaultName", formData.vault.trim().toLowerCase())
        router.push("/vault")
      } else {
        // Handle 401 and other errors
        if (response.status === 401) {
          clearAuthData()
          setError("Invalid credentials. Please check your vault name and password.")
        } else {
          setError(data.detail || "Login failed")
        }
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as UserType)
    setError("") // Clear error when switching tabs
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-purple-400 to-blue-600 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-20 blur-2xl"></div>
      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-md p-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Access Your Vault</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Sign in as owner or guest to access your files
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-gray-700" role="tablist">
                <TabsTrigger
                  value="owner"
                  className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100"
                  aria-label="Sign in as vault owner"
                >
                  <Crown className="w-4 h-4" />
                  Owner
                </TabsTrigger>
                <TabsTrigger
                  value="guest"
                  className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100"
                  aria-label="Sign in as guest user"
                >
                  <Users className="w-4 h-4" />
                  Guest
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="vault" className="text-gray-900 dark:text-gray-100">
                    Vault Name
                  </Label>
                  <Input
                    id="vault"
                    name="vault"
                    type="text"
                    placeholder="Enter vault name"
                    value={formData.vault}
                    onChange={handleChange}
                    onInput={handleInput}
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    inputMode="text"
                    aria-describedby="vault-description"
                    aria-invalid={error ? "true" : "false"}
                    disabled={loading}
                    className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <p id="vault-description" className="text-xs text-gray-500 dark:text-gray-500">
                    Enter the name of your vault
                  </p>
                </div>

                <TabsContent value="owner" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-900 dark:text-gray-100">
                      Password
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter vault password"
                      value={formData.password}
                      onChange={handleChange}
                      onInput={handleInput}
                      required={activeTab === "owner"}
                      autoComplete="current-password"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      aria-describedby="password-description"
                      aria-invalid={error ? "true" : "false"}
                      disabled={loading}
                      className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <p id="password-description" className="text-xs text-gray-500 dark:text-gray-500">
                      Enter your vault password
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="guest" className="mt-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Guest Access</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          You can view and download public files without a password.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {error && (
                  <div
                    className="flex items-start space-x-3 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800"
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium mb-1">Sign In Failed</h4>
                      <p>{error}</p>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !formData.vault.trim() || (activeTab === "owner" && !formData.password)}
                  aria-describedby={loading ? "loading-description" : undefined}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span id="loading-description">Signing in...</span>
                    </>
                  ) : (
                    `Sign in as ${activeTab}`
                  )}
                </Button>
              </form>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have a vault?{" "}
                <Link
                  href="/create-account"
                  className="text-gray-900 dark:text-gray-100 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-sm"
                >
                  Create one
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
