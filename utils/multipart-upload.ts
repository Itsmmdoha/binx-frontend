"use client"

import type {
  MultipartUpload,
  UploadChunk,
  MultipartInitResponse,
  ChunkUploadResponse,
  MultipartCompleteResponse,
} from "@/types"

// Constants
export const MULTIPART_THRESHOLD = 20 * 1024 * 1024 // 20MB
export const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024 // 10MB chunks
export const STORAGE_KEY = "binx_incomplete_uploads"
export const RUNNING_UPLOADS_KEY = "binx_running_uploads"

// Local storage management
export function getIncompleteUploads(): MultipartUpload[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const uploads: MultipartUpload[] = JSON.parse(stored)
    return uploads.map((upload) => ({
      ...upload,
      uploadedChunks: new Set(Array.from(upload.uploadedChunks || [])),
    }))
  } catch (error) {
    console.error("Failed to load incomplete uploads:", error)
    return []
  }
}

export function saveIncompleteUpload(upload: MultipartUpload): void {
  try {
    const uploads = getIncompleteUploads()
    const index = uploads.findIndex((u) => u.id === upload.id)

    const uploadToSave = {
      ...upload,
      uploadedChunks: Array.from(upload.uploadedChunks),
    }

    if (index >= 0) {
      uploads[index] = uploadToSave
    } else {
      uploads.push(uploadToSave)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads))
  } catch (error) {
    console.error("Failed to save incomplete upload:", error)
  }
}

export function removeIncompleteUpload(uploadId: string): void {
  try {
    const uploads = getIncompleteUploads()
    const filtered = uploads.filter((u) => u.id !== uploadId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error("Failed to remove incomplete upload:", error)
  }
}

export function clearIncompleteUploads(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Failed to clear incomplete uploads:", error)
  }
}

// Running uploads tracking
export function getRunningUploads(): Set<string> {
  try {
    const stored = localStorage.getItem(RUNNING_UPLOADS_KEY)
    if (!stored) return new Set()

    const uploadIds: string[] = JSON.parse(stored)
    return new Set(uploadIds)
  } catch (error) {
    console.error("Failed to load running uploads:", error)
    return new Set()
  }
}

export function addRunningUpload(fileId: string): void {
  try {
    const runningUploads = getRunningUploads()
    runningUploads.add(fileId)
    localStorage.setItem(RUNNING_UPLOADS_KEY, JSON.stringify(Array.from(runningUploads)))
  } catch (error) {
    console.error("Failed to add running upload:", error)
  }
}

export function removeRunningUpload(fileId: string): void {
  try {
    const runningUploads = getRunningUploads()
    runningUploads.delete(fileId)
    localStorage.setItem(RUNNING_UPLOADS_KEY, JSON.stringify(Array.from(runningUploads)))
  } catch (error) {
    console.error("Failed to remove running upload:", error)
  }
}

export function clearRunningUploads(): void {
  try {
    localStorage.removeItem(RUNNING_UPLOADS_KEY)
  } catch (error) {
    console.error("Failed to clear running uploads:", error)
  }
}

// File chunking utilities
export function createChunks(file: File, chunkSize: number = DEFAULT_CHUNK_SIZE): UploadChunk[] {
  const chunks: UploadChunk[] = []
  const totalChunks = Math.ceil(file.size / chunkSize)

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)

    chunks.push({
      chunkNumber: i + 1, // 1-based indexing
      data: chunk,
      size: chunk.size,
    })
  }

  return chunks
}

export function generateUploadId(): string {
  return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// API calls for multipart upload
export async function initiateMultipartUpload(
  fileName: string,
  fileSize: number,
  token: string,
): Promise<MultipartInitResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/file/multipart/initiate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file_name: fileName,
      file_size: fileSize,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to initiate multipart upload: ${errorText}`)
  }

  return response.json()
}

export async function uploadChunk(
  fileId: string,
  partNumber: number,
  chunk: Blob,
  token: string,
  onProgress?: (loaded: number, total: number) => void,
  maxRetries = 3,
): Promise<ChunkUploadResponse> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await uploadChunkAttempt(fileId, partNumber, chunk, token, onProgress)
      return response
    } catch (error) {
      lastError = error as Error
      console.warn(`Chunk upload attempt ${attempt} failed:`, error)

      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError
      }

      // Wait before retrying (exponential backoff)
      const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // 1s, 2s, 4s, max 10s
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  throw lastError || new Error("Chunk upload failed after all retries")
}

function uploadChunkAttempt(
  fileId: string,
  partNumber: number,
  chunk: Blob,
  token: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<ChunkUploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append("chunk", chunk)
    formData.append("part_number", partNumber.toString())

    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded, event.total)
        }
      })
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch (error) {
          reject(new Error("Invalid response format"))
        }
      } else {
        reject(new Error(`Chunk upload failed: HTTP ${xhr.status} - ${xhr.responseText}`))
      }
    })

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during chunk upload"))
    })

    xhr.addEventListener("abort", () => {
      reject(new Error("Chunk upload aborted"))
    })

    xhr.open("PUT", `${process.env.NEXT_PUBLIC_BINX_API_URL}/file/multipart/${fileId}/chunk`)
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.send(formData)
  })
}

export async function completeMultipartUpload(fileId: string, token: string): Promise<MultipartCompleteResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/file/multipart/${fileId}/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Failed to complete multipart upload: ${errorText}`

    try {
      const errorData = JSON.parse(errorText)
      if (errorData.detail) {
        errorMessage = errorData.detail
      }
    } catch (parseError) {
      // Use the raw error text if JSON parsing fails
    }

    const error = new Error(errorMessage)
    ;(error as any).status = response.status
    throw error
  }

  return response.json()
}

export async function abortMultipartUpload(fileId: string, token: string): Promise<void> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/file/multipart/${fileId}/abort`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to abort multipart upload: ${errorText}`)
  }
}

export async function getIncompleteUploadsFromAPI(token: string): Promise<MultipartUpload[]> {
  // This function is deprecated and should not be used
  console.warn("getIncompleteUploadsFromAPI is deprecated")
  return []
}

// Utility functions
export function calculateUploadProgress(uploadedChunks: Set<number>, totalChunks: number): number {
  return totalChunks > 0 ? Math.round((uploadedChunks.size / totalChunks) * 100) : 0
}

export function shouldUseMultipart(fileSize: number): boolean {
  return fileSize > MULTIPART_THRESHOLD
}

export function formatUploadTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days} day${days !== 1 ? "s" : ""} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
  } else {
    return "Just now"
  }
}

// File verification utilities for retry
export function verifyFileForRetry(file: File, incompleteUpload: MultipartUpload): boolean {
  return file.name === incompleteUpload.fileName && file.size === incompleteUpload.fileSize
}

export async function promptFileSelection(accept?: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = accept || "*/*"
    input.style.display = "none"

    input.onchange = (event) => {
      const target = event.target as HTMLInputElement
      const file = target.files?.[0]
      document.body.removeChild(input)
      resolve(file || null)
    }

    input.oncancel = () => {
      document.body.removeChild(input)
      resolve(null)
    }

    document.body.appendChild(input)
    input.click()
  })
}
