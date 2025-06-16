"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Crown, Users } from "lucide-react"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const requestBody: any = { vault: formData.vault }
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
        localStorage.setItem("vaultName", formData.vault)
        router.push("/vault")
      } else {
        setError(data.detail || "Login failed")
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-purple-400 to-blue-600 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-20 blur-2xl"></div>

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">Access Your Vault</CardTitle>
            <CardDescription>Sign in as owner or guest to access your files</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserType)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="owner" className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Owner
                </TabsTrigger>
                <TabsTrigger value="guest" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Guest
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vault">Vault Name</Label>
                  <Input
                    id="vault"
                    name="vault"
                    type="text"
                    placeholder="Enter vault name"
                    value={formData.vault}
                    onChange={handleChange}
                    required
                    className="bg-white/50"
                  />
                </div>

                <TabsContent value="owner">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter vault password"
                      value={formData.password}
                      onChange={handleChange}
                      required={activeTab === "owner"}
                      className="bg-white/50"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="guest">
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-700">
                      <strong>Guest mode:</strong> You can only view and download public files.
                    </p>
                  </div>
                </TabsContent>

                {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>}

                <Button type="submit" className="w-full bg-black hover:bg-gray-800" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    `Sign in as ${activeTab}`
                  )}
                </Button>
              </form>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have a vault?{" "}
                <Link href="/create-account" className="text-black hover:underline font-medium">
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
