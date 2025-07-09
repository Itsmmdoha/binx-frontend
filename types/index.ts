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
