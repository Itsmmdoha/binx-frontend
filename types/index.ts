export interface VaultData {
  vault_id?: string
  vault: string
  size: number
  used_storage: number
  date_created: string
}

export interface FileData {
  id: string
  file: string
  size: number
  size: number
  visibility: "public" | "private"
  date_created: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  detail?: string
}

export interface VaultResponse {
  vault: VaultData
  files: FileData[]
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export type UserType = "owner" | "guest"

// Multipart upload types
export interface MultipartUpload {
  id: string
  uploadId: string
  fileName: string
  fileSize: number
  chunkSize: number
  totalChunks: number
  uploadedChunks: Set<number>
  filePath?: string // Local file path stored for retry
  status: "pending" | "uploading" | "paused" | "completed" | "failed" | "aborted"
  createdAt: number
  lastActivity: number
  error?: string
}

export interface UploadChunk {
  chunkNumber: number
  data: Blob
  size: number
  etag?: string
}

export interface MultipartInitResponse {
  message: string
  file_id: string
}

export interface ChunkUploadResponse {
  message: string
}

export interface MultipartCompleteResponse {
  message: string
}
