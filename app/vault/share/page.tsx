"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, Upload } from "lucide-react"

export default function SharePage() {
  const router = useRouter()
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [fileName, setFileName] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const handleSharedFile = async () => {
      // Check if user is logged in
      const token = localStorage.getItem("token")
      if (!token) {
        // Redirect to login with return URL
        localStorage.setItem("returnUrl", "/vault/share")
        router.push("/login")
        return
      }

      // Check if this is a POST request with file data
      if (typeof window !== "undefined" && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search)
        const hasFile = urlParams.has("file") || document.querySelector('input[type="file"]')

        if (hasFile) {
          await processSharedFile(token)
        } else {
          // No file shared, redirect to vault
          router.push("/vault")
        }
      }
    }

    handleSharedFile()
  }, [router])

  const processSharedFile = async (token: string) => {
    try {
      setUploadStatus("uploading")

      // Get the shared file from the form data or URL parameters
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      let file: File | null = null

      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        file = fileInput.files[0]
      } else {
        // Try to get file from URL parameters (Android share)
        const urlParams = new URLSearchParams(window.location.search)
        const fileParam = urlParams.get("file")
        if (fileParam) {
          // This would need to be handled differently based on how Android passes the file
          console.log("File parameter:", fileParam)
        }
      }

      if (!file) {
        setErrorMessage("No file was shared")
        setUploadStatus("error")
        return
      }

      setFileName(file.name)

      // Upload the file
      const formData = new FormData()
      formData.append("file", file)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percentComplete)
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadStatus("success")
          setTimeout(() => {
            router.push("/vault")
          }, 2000)
        } else {
          let errorMessage = "Upload failed"
          try {
            const errorData = JSON.parse(xhr.responseText)
            errorMessage = errorData.message || errorData.detail || "Upload failed"
          } catch {
            errorMessage = `Upload failed (HTTP ${xhr.status})`
          }
          setErrorMessage(errorMessage)
          setUploadStatus("error")
        }
      })

      xhr.addEventListener("error", () => {
        setErrorMessage("Network error occurred")
        setUploadStatus("error")
      })

      xhr.open("POST", `${process.env.NEXT_PUBLIC_BINX_API_URL}/file/upload`)
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      xhr.send(formData)
    } catch (error) {
      console.error("Error processing shared file:", error)
      setErrorMessage("Failed to process shared file")
      setUploadStatus("error")
    }
  }

  const handleRetry = () => {
    const token = localStorage.getItem("token")
    if (token) {
      processSharedFile(token)
    }
  }

  const handleGoToVault = () => {
    router.push("/vault")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Upload className="h-6 w-6" />
            File Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploadStatus === "idle" && (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">Processing shared file...</p>
            </div>
          )}

          {uploadStatus === "uploading" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Uploading to your vault...</p>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">{uploadProgress}% complete</p>
            </div>
          )}

          {uploadStatus === "success" && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">Upload Successful!</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{fileName} has been added to your vault</p>
              </div>
              <Button onClick={handleGoToVault} className="w-full">
                Go to Vault
              </Button>
            </div>
          )}

          {uploadStatus === "error" && (
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">Upload Failed</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{errorMessage}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRetry} variant="outline" className="flex-1 bg-transparent">
                  Retry
                </Button>
                <Button onClick={handleGoToVault} className="flex-1">
                  Go to Vault
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
