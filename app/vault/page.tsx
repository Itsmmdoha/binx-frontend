"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Upload,
  Download,
  Trash2,
  Edit,
  MoreVertical,
  FolderOpen,
  LogOut,
  Crown,
  Users,
  Check,
  Eye,
  EyeOff,
} from "lucide-react"
import { getFileIcon, getFileIconColor } from "@/utils/fileIcons"
import { formatFileSize, formatDate, formatDateShort } from "@/utils"
import type { VaultData, FileData, UserType, VaultResponse } from "@/types"

interface DialogState {
  open: boolean
  file: FileData | null
}

interface RenameDialogState extends DialogState {
  newName: string
}

interface VisibilityDialogState extends DialogState {
  visibility: string
}

export default function VaultPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [vaultData, setVaultData] = useState<VaultData | null>(null)
  const [files, setFiles] = useState<FileData[]>([])
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<UserType>("owner")
  const [vaultName, setVaultName] = useState("")

  // Upload states
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)

  // Dialog states
  const [renameDialog, setRenameDialog] = useState<RenameDialogState>({
    open: false,
    file: null,
    newName: "",
  })
  const [deleteDialog, setDeleteDialog] = useState<DialogState>({
    open: false,
    file: null,
  })
  const [visibilityDialog, setVisibilityDialog] = useState<VisibilityDialogState>({
    open: false,
    file: null,
    visibility: "",
  })

  useEffect(() => {
    const token = localStorage.getItem("token")
    const type = localStorage.getItem("userType") as UserType
    const vault = localStorage.getItem("vaultName")

    if (!token || !type || !vault) {
      router.push("/login")
      return
    }

    setUserType(type)
    setVaultName(vault)
    fetchVaultData(token)
  }, [router])

  const fetchVaultData = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/vault/fetch`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data: VaultResponse = await response.json()
        setVaultData(data.vault)
        setFiles(data.files)
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Failed to fetch vault data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const token = localStorage.getItem("token")
    if (!token) return

    const formData = new FormData()
    formData.append("file", file)

    setUploading(true)
    setUploadProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/file/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        setUploadComplete(true)
        setTimeout(() => {
          setUploadComplete(false)
          setUploading(false)
          setUploadProgress(0)
          fetchVaultData(token)
        }, 1500)
      }
    } catch (error) {
      console.error("Upload failed:", error)
      setUploading(false)
      setUploadProgress(0)
    }

    event.target.value = ""
  }

  const handleDownload = async (fileId: string, fileName: string) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/file/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        window.open(data.download_url, "_blank")
      }
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const handleRename = async () => {
    const token = localStorage.getItem("token")
    if (!token || !renameDialog.file) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/file/${renameDialog.file.file_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_name: renameDialog.newName }),
      })

      if (response.ok) {
        setRenameDialog({ open: false, file: null, newName: "" })
        fetchVaultData(token)
      }
    } catch (error) {
      console.error("Rename failed:", error)
    }
  }

  const handleDelete = async () => {
    const token = localStorage.getItem("token")
    if (!token || !deleteDialog.file) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/file/${deleteDialog.file.file_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setDeleteDialog({ open: false, file: null })
        fetchVaultData(token)
      }
    } catch (error) {
      console.error("Delete failed:", error)
    }
  }

  const handleVisibilityChange = async () => {
    const token = localStorage.getItem("token")
    if (!token || !visibilityDialog.file) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/file/${visibilityDialog.file.file_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ visibility: visibilityDialog.visibility }),
      })

      if (response.ok) {
        setVisibilityDialog({ open: false, file: null, visibility: "" })
        fetchVaultData(token)
      }
    } catch (error) {
      console.error("Visibility change failed:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userType")
    localStorage.removeItem("vaultName")
    router.push("/")
  }

  const getStorageUsagePercentage = (): number => {
    if (!vaultData) return 0
    return (vaultData.used_storage / vaultData.size) * 100
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vault...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 min-w-0">
              <FolderOpen className="w-6 h-6 text-gray-600 flex-shrink-0" />
              <h1 className="text-xl font-semibold truncate">{vaultName}</h1>
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full text-sm flex-shrink-0">
              {userType === "owner" ? (
                <>
                  <Crown className="w-4 h-4 text-yellow-600" />
                  <span className="text-gray-700">Owner</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700">Guest</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {userType === "owner" && (
              <Button onClick={() => fileInputRef.current?.click()} className="bg-black hover:bg-gray-800 flex-1 sm:flex-none">
                <Upload className="w-4 h-4 mr-2" />
                <span className="hidden xs:inline sm:inline">Upload File</span>
                <span className="xs:hidden sm:hidden">Upload</span>
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout} className="flex-shrink-0">
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Vault Info */}
        {vaultData && (
          <div className="mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-4 sm:gap-8">
                  {/* Total Files */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2">
                      <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-lg sm:text-xl font-bold text-blue-600">{files.length}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm sm:text-base font-semibold text-blue-600">Files</div>
                      <p className="text-xs text-gray-400">Total Files</p>
                    </div>
                  </div>

                  {/* Storage Usage */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-gray-200"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 35}`}
                          strokeDashoffset={`${2 * Math.PI * 35 * (1 - getStorageUsagePercentage() / 100)}`}
                          className={`transition-all duration-500 ${getStorageUsagePercentage() > 90 ? "text-red-500" : "text-green-500"}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          className={`text-xs sm:text-sm font-bold ${getStorageUsagePercentage() > 90 ? "text-red-600" : "text-green-600"}`}
                        >
                          {Math.round(getStorageUsagePercentage())}%
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`text-sm sm:text-base font-semibold ${getStorageUsagePercentage() > 90 ? "text-red-600" : "text-green-600"}`}
                      >
                        {formatFileSize(vaultData.used_storage)}
                      </div>
                      <p className="text-xs text-gray-500">of {formatFileSize(vaultData.size)}</p>
                      <p className="text-xs text-gray-400">Storage Used</p>
                    </div>
                  </div>

                  {/* Date Created */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2">
                      <div className="w-full h-full rounded-full bg-purple-100 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-xs sm:text-sm font-bold text-purple-600 leading-tight">
                            {formatDateShort(vaultData.date_created)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm sm:text-base font-semibold text-purple-600">Created</div>
                      <p className="text-xs text-gray-400">Date Created</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Files List */}
        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No files in this vault yet</p>
                {userType === "owner" && (
                  <p className="text-sm text-gray-500 mt-2">Upload your first file to get started</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file) => {
                  const FileIcon = getFileIcon(file.file)
                  const iconColor = getFileIconColor(file.file)

                  return (
                    <div
                      key={file.file_id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors hover:shadow-sm"
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <FileIcon className={`w-8 h-8 ${iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-lg truncate">{file.file}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 text-sm text-gray-500 mt-1 space-y-1 sm:space-y-0">
                            <span className="font-medium">{formatFileSize(file.size)}</span>
                            <span className="hidden sm:inline">{formatDate(file.date_created)}</span>
                            <div className="flex items-center space-x-1">
                              {file.visibility === "public" ? (
                                <>
                                  <Eye className="w-4 h-4 text-red-500" />
                                  <span className="text-red-600 font-medium">Public</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-600">Private</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file.file_id, file.file)}
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Download className="w-4 h-4" />
                        </Button>

                        {userType === "owner" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() =>
                                  setRenameDialog({
                                    open: true,
                                    file,
                                    newName: file.file,
                                  })
                                }
                                className="cursor-pointer"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setVisibilityDialog({
                                    open: true,
                                    file,
                                    visibility: file.visibility === "public" ? "private" : "public",
                                  })
                                }
                                className="cursor-pointer"
                              >
                                {file.visibility === "public" ? (
                                  <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Make Private
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Make Public
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteDialog({ open: true, file })}
                                className="text-red-600 cursor-pointer focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />

      {/* Upload Progress */}
      {uploading && (
        <div className="fixed bottom-6 right-6 bg-white rounded-full p-4 shadow-lg border">
          <div className="w-16 h-16 relative">
            {uploadComplete ? (
              <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            ) : (
              <>
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - uploadProgress / 100)}`}
                    className="text-black transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium">{uploadProgress}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={renameDialog.open} onOpenChange={(open) => setRenameDialog({ ...renameDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>Enter a new name for "{renameDialog.file?.file}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newName">New Name</Label>
              <Input
                id="newName"
                value={renameDialog.newName}
                onChange={(e) => setRenameDialog({ ...renameDialog, newName: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog({ open: false, file: null, newName: "" })}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.file?.file}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, file: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={visibilityDialog.open} onOpenChange={(open) => setVisibilityDialog({ ...visibilityDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Visibility</DialogTitle>
            <DialogDescription>
              Change "{visibilityDialog.file?.file}" visibility to {visibilityDialog.visibility}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisibilityDialog({ open: false, file: null, visibility: "" })}>
              Cancel
            </Button>
            <Button onClick={handleVisibilityChange}>Change to {visibilityDialog.visibility}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
