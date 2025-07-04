"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Check, X } from "lucide-react"

interface FormData {
  vault: string
  password: string
  confirmPassword: string
}

interface ValidationState {
  vault: {
    isValid: boolean
    message: string
  }
  password: {
    isValid: boolean
    message: string
    strength: number
  }
  confirmPassword: {
    isValid: boolean
    message: string
  }
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
  const [validation, setValidation] = useState<ValidationState>({
    vault: { isValid: false, message: "" },
    password: { isValid: false, message: "", strength: 0 },
    confirmPassword: { isValid: false, message: "" },
  })
  const [showValidation, setShowValidation] = useState({
    vault: false,
    password: false,
    confirmPassword: false,
  })

  const validateVaultName = (vault: string) => {
    const trimmed = vault.trim()
    if (!trimmed) {
      return { isValid: false, message: "" }
    }
    if (trimmed.length < 3) {
      return { isValid: false, message: "Vault name must be at least 3 characters" }
    }
    if (trimmed.length > 30) {
      return { isValid: false, message: "Vault name must be less than 30 characters" }
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return { isValid: false, message: "Only letters, numbers, hyphens, and underscores allowed" }
    }
    if (/^[-_]|[-_]$/.test(trimmed)) {
      return { isValid: false, message: "Cannot start or end with hyphens or underscores" }
    }
    return { isValid: true, message: "Vault name looks good!" }
  }

  const validatePassword = (password: string) => {
    if (!password) {
      return { isValid: false, message: "", strength: 0 }
    }

    let strength = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    strength = Object.values(checks).filter(Boolean).length

    if (password.length < 8) {
      return { isValid: false, message: "Password must be at least 8 characters", strength }
    }
    if (strength < 3) {
      return { isValid: false, message: "Password should include uppercase, lowercase, numbers, or symbols", strength }
    }
    return { isValid: true, message: "Strong password!", strength }
  }

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword) {
      return { isValid: false, message: "" }
    }
    if (confirmPassword !== password) {
      return { isValid: false, message: "Passwords do not match" }
    }
    return { isValid: true, message: "Passwords match!" }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Final validation
    const vaultValidation = validateVaultName(formData.vault)
    const passwordValidation = validatePassword(formData.password)
    const confirmPasswordValidation = validateConfirmPassword(formData.confirmPassword, formData.password)

    if (!vaultValidation.isValid || !passwordValidation.isValid || !confirmPasswordValidation.isValid) {
      setError("Please fix the validation errors before submitting")
      setLoading(false)
      return
    }

    try {
      // Only lowercase the vault name, don't replace underscores
      const sanitizedVaultName = formData.vault.trim().toLowerCase()

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
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Real-time validation
    if (name === "vault") {
      const vaultValidation = validateVaultName(value)
      setValidation((prev) => ({ ...prev, vault: vaultValidation }))
      setShowValidation((prev) => ({ ...prev, vault: value.length > 0 }))
    } else if (name === "password") {
      const passwordValidation = validatePassword(value)
      setValidation((prev) => ({ ...prev, password: passwordValidation }))
      setShowValidation((prev) => ({ ...prev, password: value.length > 0 }))

      // Also revalidate confirm password if it exists
      if (formData.confirmPassword) {
        const confirmPasswordValidation = validateConfirmPassword(formData.confirmPassword, value)
        setValidation((prev) => ({ ...prev, confirmPassword: confirmPasswordValidation }))
      }
    } else if (name === "confirmPassword") {
      const confirmPasswordValidation = validateConfirmPassword(value, formData.password)
      setValidation((prev) => ({ ...prev, confirmPassword: confirmPasswordValidation }))
      setShowValidation((prev) => ({ ...prev, confirmPassword: value.length > 0 }))
    }
  }

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 2) return "bg-red-500"
    if (strength <= 3) return "bg-yellow-500"
    if (strength <= 4) return "bg-blue-500"
    return "bg-green-500"
  }

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 2) return "Weak"
    if (strength <= 3) return "Fair"
    if (strength <= 4) return "Good"
    return "Strong"
  }

  const isFormValid = validation.vault.isValid && validation.password.isValid && validation.confirmPassword.isValid

  // Add this useEffect after the existing useState declarations
  useEffect(() => {
    // Handle Firefox autofill detection
    const handleAutofill = () => {
      const vaultInput = document.getElementById("vault") as HTMLInputElement
      const passwordInput = document.getElementById("password") as HTMLInputElement
      const confirmPasswordInput = document.getElementById("confirmPassword") as HTMLInputElement

      if (vaultInput?.value && vaultInput.value !== formData.vault) {
        const newValue = vaultInput.value
        setFormData((prev) => ({ ...prev, vault: newValue }))

        // Trigger validation
        const vaultValidation = validateVaultName(newValue)
        setValidation((prev) => ({ ...prev, vault: vaultValidation }))
        setShowValidation((prev) => ({ ...prev, vault: newValue.length > 0 }))
      }

      if (passwordInput?.value && passwordInput.value !== formData.password) {
        const newValue = passwordInput.value
        setFormData((prev) => ({ ...prev, password: newValue }))

        // Trigger validation
        const passwordValidation = validatePassword(newValue)
        setValidation((prev) => ({ ...prev, password: passwordValidation }))
        setShowValidation((prev) => ({ ...prev, password: newValue.length > 0 }))
      }

      if (confirmPasswordInput?.value && confirmPasswordInput.value !== formData.confirmPassword) {
        const newValue = confirmPasswordInput.value
        setFormData((prev) => ({ ...prev, confirmPassword: newValue }))

        // Trigger validation
        const confirmPasswordValidation = validateConfirmPassword(newValue, formData.password)
        setValidation((prev) => ({ ...prev, confirmPassword: confirmPasswordValidation }))
        setShowValidation((prev) => ({ ...prev, confirmPassword: newValue.length > 0 }))
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
  }, [formData.vault, formData.password, formData.confirmPassword])

  // Add handleInput function
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement
    handleChange({ target } as React.ChangeEvent<HTMLInputElement>)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl dark:bg-gray-800/80 backdrop-blur-sm border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Vault Created!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your vault "{formData.vault}" has been created successfully.
            </p>
            <Link href="/login">
              <Button className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-purple-400 to-blue-600 rounded-full opacity-20 blur-2xl"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-md p-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        {/* Floating card */}
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Your Vault</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Set up a secure vault to store your files
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="vault" className="text-gray-900 dark:text-gray-100">
                  Vault Name
                </Label>
                <Input
                  id="vault"
                  name="vault"
                  type="text"
                  placeholder="Enter vault name (e.g., my-vault)"
                  value={formData.vault}
                  onChange={handleChange}
                  onInput={handleInput}
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  inputMode="text"
                  aria-describedby="vault-description vault-validation"
                  aria-invalid={showValidation.vault && !validation.vault.isValid ? "true" : "false"}
                  disabled={loading}
                  className={`bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:border-blue-500 transition-colors ${
                    showValidation.vault
                      ? validation.vault.isValid
                        ? "focus:ring-green-500 border-green-300 dark:border-green-600"
                        : "focus:ring-red-500 border-red-300 dark:border-red-600"
                      : "focus:ring-blue-500"
                  }`}
                />
                <p id="vault-description" className="text-xs text-gray-500 dark:text-gray-500">
                  Only lowercase letters, numbers, and hyphens allowed
                </p>
                {showValidation.vault && (
                  <div
                    id="vault-validation"
                    className={`flex items-center space-x-2 text-xs ${
                      validation.vault.isValid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {validation.vault.isValid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span>{validation.vault.message}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 dark:text-gray-100">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  onInput={handleInput}
                  required
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  aria-describedby="password-description password-validation password-strength"
                  aria-invalid={showValidation.password && !validation.password.isValid ? "true" : "false"}
                  disabled={loading}
                  className={`bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:border-blue-500 transition-colors ${
                    showValidation.password
                      ? validation.password.isValid
                        ? "focus:ring-green-500 border-green-300 dark:border-green-600"
                        : "focus:ring-red-500 border-red-300 dark:border-red-600"
                      : "focus:ring-blue-500"
                  }`}
                />
                <p id="password-description" className="text-xs text-gray-500 dark:text-gray-500">
                  At least 8 characters with a mix of letters, numbers, and symbols
                </p>
                {showValidation.password && (
                  <>
                    <div
                      id="password-validation"
                      className={`flex items-center space-x-2 text-xs ${
                        validation.password.isValid
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {validation.password.isValid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      <span>{validation.password.message}</span>
                    </div>
                    <div id="password-strength" className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Password strength:</span>
                        <span
                          className={`font-medium ${
                            validation.password.strength <= 2
                              ? "text-red-600 dark:text-red-400"
                              : validation.password.strength <= 3
                                ? "text-yellow-600 dark:text-yellow-400"
                                : validation.password.strength <= 4
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {getPasswordStrengthText(validation.password.strength)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(validation.password.strength)}`}
                          style={{ width: `${(validation.password.strength / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-900 dark:text-gray-100">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onInput={handleInput}
                  required
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  aria-describedby="confirm-password-description confirm-password-validation"
                  aria-invalid={
                    showValidation.confirmPassword && !validation.confirmPassword.isValid ? "true" : "false"
                  }
                  disabled={loading}
                  className={`bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:border-blue-500 transition-colors ${
                    showValidation.confirmPassword
                      ? validation.confirmPassword.isValid
                        ? "focus:ring-green-500 border-green-300 dark:border-green-600"
                        : "focus:ring-red-500 border-red-300 dark:border-red-600"
                      : "focus:ring-blue-500"
                  }`}
                />
                <p id="confirm-password-description" className="text-xs text-gray-500 dark:text-gray-500">
                  Re-enter your password to confirm
                </p>
                {showValidation.confirmPassword && (
                  <div
                    id="confirm-password-validation"
                    className={`flex items-center space-x-2 text-xs ${
                      validation.confirmPassword.isValid
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {validation.confirmPassword.isValid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span>{validation.confirmPassword.message}</span>
                  </div>
                )}
              </div>

              {error && (
                <div
                  className="flex items-start space-x-3 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Creation Failed</h4>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !isFormValid}
                aria-describedby={loading ? "loading-description" : undefined}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span id="loading-description">Creating vault...</span>
                  </>
                ) : (
                  "Create Vault"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have a vault?{" "}
                <Link
                  href="/login"
                  className="text-gray-900 dark:text-gray-100 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-sm"
                >
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
