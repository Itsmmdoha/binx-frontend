"use client"

import type { MultipartUpload, UploadChunk, MultipartInitResponse, ChunkUploadResponse, MultipartCompleteResponse } from "@/types"

// Constants
export const MULTIPART_THRESHOLD = 20 * 1024 * 1024 // 20MB
export const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
export const STORAGE_KEY = "binx_incomplete_uploads"

// Local storage management
export function getIncompleteUploads(): MultipartUpload[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const uploads: MultipartUpload[] = JSON.parse(stored)
    return uploads.map(upload => ({
      ...upload,
      uploadedChunks: new Set(Array.from(upload.uploadedChunks || []))
    }))
  } catch (error) {
    console.error('Failed to load incomplete uploads:', error)
    return []
  }
}

export function saveIncompleteUpload(upload: MultipartUpload): void {
  try {
    const uploads = getIncompleteUploads()
    const index = uploads.findIndex(u => u.id === upload.id)
    
    const uploadToSave = {
      ...upload,
      uploadedChunks: Array.from(upload.uploadedChunks)
    }
    
    if (index >= 0) {
      uploads[index] = uploadToSave
    } else {
      uploads.push(uploadToSave)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads))
  } catch (error) {
    console.error('Failed to save incomplete upload:', error)
  }
}

export function removeIncompleteUpload(uploadId: string): void {
  try {
    const uploads = getIncompleteUploads()
    const filtered = uploads.filter(u => u.id !== uploadId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to remove incomplete upload:', error)
  }
}

export function clearIncompleteUploads(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear incomplete uploads:', error)
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
      size: chunk.size
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
  token: string
): Promise<MultipartInitResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/file/multipart/initiate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
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
  onProgress?: (loaded: number, total: number) => void
): Promise<ChunkUploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('chunk', chunk)
    formData.append('part_number', partNumber.toString())
    
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded, event.total)
        }
      })
    }
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch (error) {
          reject(new Error('Invalid response format'))
        }
      } else {
        reject(new Error(`Chunk upload failed: HTTP ${xhr.status}`))
      }
    })
    
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during chunk upload'))
    })
    
    xhr.addEventListener('abort', () => {
      reject(new Error('Chunk upload aborted'))
    })
    
    xhr.open('PUT', `${process.env.NEXT_PUBLIC_BINX_API_URL}/file/multipart/${fileId}/chunk`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  })
}

export async function completeMultipartUpload(
  fileId: string,
  token: string
): Promise<MultipartCompleteResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/file/multipart/${fileId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to complete multipart upload: ${errorText}`)
  }
  
  return response.json()
}

export async function abortMultipartUpload(fileId: string, token: string): Promise<void> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/file/multipart/${fileId}/abort`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to abort multipart upload: ${errorText}`)
  }
}

export async function getIncompleteUploadsFromAPI(token: string): Promise<MultipartUpload[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/file/multipart/list_incomplete`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get incomplete uploads: ${errorText}`)
  }
  
  const data = await response.json()
  
  // Convert API response to our internal format
  return (data.uploads || []).map((upload: any) => ({
    id: upload.file_id,
    uploadId: upload.file_id,
    fileName: upload.file,
    fileSize: upload.size,
    chunkSize: DEFAULT_CHUNK_SIZE, // Default as API doesn't provide this
    totalChunks: Math.ceil(upload.size / DEFAULT_CHUNK_SIZE),
    uploadedChunks: new Set(upload.uploaded_parts || []),
    status: 'pending' as const,
    createdAt: new Date(upload.date_created).getTime(),
    lastActivity: new Date(upload.date_created).getTime(),
  }))
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
    return `${days} day${days !== 1 ? 's' : ''} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}