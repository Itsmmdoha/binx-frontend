"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, Copy, Check } from "lucide-react"
import { validateVaultName, sanitizeVaultName } from "@/utils/validation"

interface FormData {
  vault: string
  password: string
  confirmPassword: string
}

export default function CreateAccountPage() {
  const [formData, setFormData] = useState<FormData>({
    vault: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [vaultNameError, setVaultNameError] = useState("")
  const [copied, setCopied] = useState(false)

  const handleVaultNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, vault: value }))

    // Real-time validation
    if (value.trim()) {
      const validation = validateVaultName(value)
      setVaultNameError(validation.isValid ? "" : validation.error || "")
    } else {
      setVaultNameError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate vault name
    const vaultValidation = validateVaultName(formData.vault)
    if (!vaultValidation.isValid) {
      setVaultNameError(vaultValidation.error || "Invalid vault name")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setLoading(true)

    try {
      const sanitizedVaultName = sanitizeVaultName(formData.vault)

      const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/vault/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vault: sanitizedVaultName,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Update form data with sanitized name for display
        setFormData((prev) => ({ ...prev, vault: sanitizedVaultName }))
      } else {
        setError(data.detail || "Failed to create vault")
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  if (success) {
    const guestUrl = `${window.location.origin}/${formData.vault}`

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Vault Created!</h2>
            <p className="text-gray-600 mb-4">Your vault "{formData.vault}" has been created successfully.</p>

            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <p className="text-sm text-blue-700 mb-2">
                <strong>Quick Guest Access URL:</strong>
              </p>
              <div className="flex items-center space-x-2 bg-white p-2 rounded border">
                <code className="text-xs flex-1 text-left">{guestUrl}</code>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(guestUrl)} className="h-6 w-6 p-0">
                  {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              <p className="text-xs text-blue-600 mt-2">Share this URL for guest access to your vault</p>
            </div>

            <Link href="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-purple-400 to-blue-600 rounded-full opacity-20 blur-2xl"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        {/* Floating card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">Create Your Vault</CardTitle>
            <CardDescription>Set up a secure vault to store your files</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vault">Vault Name</Label>
                <Input
                  id="vault"
                  name="vault"
                  type="text"
                  placeholder="Enter vault name (e.g., my-vault)"
                  value={formData.vault}
                  onChange={handleVaultNameChange}
                  required
                  className={`bg-white/50 ${vaultNameError ? "border-red-300 focus:border-red-500" : ""}`}
                />
                {vaultNameError && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{vaultNameError}</span>
                  </div>
                )}
                {formData.vault && !vaultNameError && (
                  <div className="flex items-center space-x-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Vault name is available</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  3-30 characters, letters, numbers, hyphens, and underscores only
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="bg-white/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="bg-white/50"
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800"
                disabled={loading || !!vaultNameError}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Vault...
                  </>
                ) : (
                  "Create Vault"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have a vault?{" "}
                <Link href="/login" className="text-black hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
