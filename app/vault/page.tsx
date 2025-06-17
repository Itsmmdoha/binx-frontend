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
import { Progress } from "@/components/ui/progress"
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
  X,
  AlertCircle,
  XCircle,
  AlertTriangle,
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

interface FileUploadInfo {
  file: File
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled' | 'size-exceeded'
  progress: number
  error?: string
}

export default function VaultPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [vaultData, setVaultData] = useState<VaultData | null>(null)
  const [files, setFiles] = useState<FileData[]>([])
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<UserType>("owner")
  const [vaultName, setVaultName] = useState("")

  // Multiple file upload states
  const [uploadQueue, setUploadQueue] = useState<FileUploadInfo[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [currentUploadIndex, setCurrentUploadIndex] = useState(-1)
  const [uploadCancelled, setUploadCancelled] = useState(false)

  // Legacy single upload states (keeping for backward compatibility)
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

  // Check if there's enough storage space for files
  const checkStorageCapacity = (filesToUpload: File[]): { canUpload: boolean; exceedsStorage: File[] } => {
    if (!vaultData) return { canUpload: false, exceedsStorage: [] }

    const availableSpace = vaultData.size - vaultData.used_storage
    let totalSizeNeeded = 0
    const exceedsStorage: File[] = []

    for (const file of filesToUpload) {
      totalSizeNeeded += file.size
      if (totalSizeNeeded > availableSpace) {
        // Mark this file and all remaining files as exceeding storage
        exceedsStorage.push(...filesToUpload.slice(filesToUpload.indexOf(file)))
        break
      }
    }

    return {
      canUpload: exceedsStorage.length === 0,
      exceedsStorage
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    const token = localStorage.getItem("token")
    if (!token) return

    // Convert FileList to array
    const fileArray = Array.from(selectedFiles)
    
    // Check storage capacity before proceeding
    const { canUpload, exceedsStorage } = checkStorageCapacity(fileArray)

    // Create upload info objects with pre-validation
    const fileInfos: FileUploadInfo[] = fileArray.map(file => {
      const isExceeded = exceedsStorage.includes(file)
      return {
        file,
        status: isExceeded ? 'size-exceeded' : 'pending',
        progress: 0,
        error: isExceeded ? `File size exceeds available storage (${formatFileSize(vaultData!.size - vaultData!.used_storage)} remaining)` : undefined
      }
    })

    setUploadQueue(fileInfos)
    setIsUploading(true)
    setUploadCancelled(false)

    // If no files can be uploaded, show the panel and auto-dismiss after delay
    if (!canUpload || fileInfos.every(f => f.status === 'size-exceeded')) {
      setTimeout(() => {
        setIsUploading(false)
        setUploadQueue([])
        setCurrentUploadIndex(-1)
      }, 5000)
      event.target.value = ""
      return
    }

    setCurrentUploadIndex(0)

    // Start uploading only files that can fit
    const filesToUpload = fileInfos.filter(f => f.status === 'pending')
    await uploadFilesSequentially(filesToUpload, token)

    // Reset input value
    event.target.value = ""
  }

  const uploadFilesSequentially = async (fileInfos: FileUploadInfo[], token: string) => {
    for (let i = 0; i < fileInfos.length; i++) {
      // Check if upload was cancelled
      if (uploadCancelled) {
        // Mark remaining files as cancelled
        setUploadQueue(prev => prev.map((item) => {
          const fileIndex = prev.findIndex(prevItem => prevItem.file === fileInfos[i].file)
          return fileIndex >= 0 && prev.findIndex(prevItem => prevItem.file === item.file) >= fileIndex
            ? { ...item, status: 'cancelled' as const, error: 'Upload cancelled by user' }
            : item
        }))
        break
      }

      // Update current upload index based on original queue
      const originalIndex = uploadQueue.findIndex(item => item.file === fileInfos[i].file)
      setCurrentUploadIndex(originalIndex)
      
      // Update status to uploading
      setUploadQueue(prev => prev.map((item) => 
        item.file === fileInfos[i].file ? { ...item, status: 'uploading' as const, progress: 0 } : item
      ))

      try {
        const formData = new FormData()
        formData.append("file", fileInfos[i].file)

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadQueue(prev => prev.map((item) => 
            item.file === fileInfos[i].file && item.progress < 90 
              ? { ...item, progress: item.progress + 10 }
              : item
          ))
        }, 200)

        const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/file/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        clearInterval(progressInterval)

        if (response.ok) {
          // Mark as completed
          setUploadQueue(prev => prev.map((item) => 
            item.file === fileInfos[i].file ? { ...item, status: 'completed' as const, progress: 100 } : item
          ))
        } else {
          let errorMessage = 'Upload failed'
          
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.detail || 'Upload failed'
          } catch (parseError) {
            // If JSON parsing fails, use status-based messages
            if (response.status === 507) {
              errorMessage = 'Insufficient storage space'
            } else if (response.status === 413) {
              errorMessage = 'File too large'
            } else if (response.status === 415) {
              errorMessage = 'File type not supported'
            } else {
              errorMessage = `Upload failed (HTTP ${response.status})`
            }
          }

          console.log(`Upload failed for ${fileInfos[i].file.name}:`, errorMessage)

          // Mark current file as failed
          setUploadQueue(prev => prev.map((item) => 
            item.file === fileInfos[i].file ? { 
              ...item, 
              status: 'failed' as const, 
              progress: 0, 
              error: errorMessage 
            } : item
          ))

          // If it's a 507 error (Insufficient Storage), cancel all remaining uploads
          if (response.status === 507) {
            console.log('507 Error detected - cancelling remaining uploads')
            
            // Mark all remaining files as cancelled
            const remainingFiles = fileInfos.slice(i + 1)
            setUploadQueue(prev => prev.map((item) => {
              const isRemaining = remainingFiles.some(rf => rf.file === item.file)
              return isRemaining ? { 
                ...item, 
                status: 'cancelled' as const,
                error: 'Cancelled due to insufficient storage' 
              } : item
            }))
            
            // Break out of the upload loop
            break
          }
        }
      } catch (error) {
        console.error('Network error during upload:', error)
        setUploadQueue(prev => prev.map((item) => 
          item.file === fileInfos[i].file ? { 
            ...item, 
            status: 'failed' as const, 
            progress: 0, 
            error: 'Network error occurred' 
          } : item
        ))
      }

      // Small delay between uploads (only if not cancelled and not a 507 error)
      if (!uploadCancelled) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    // Auto-hide upload progress after completion
    setTimeout(() => {
      setIsUploading(false)
      setUploadQueue([])
      setCurrentUploadIndex(-1)
      setUploadCancelled(false)
      fetchVaultData(token) // Refresh the file list
    }, 7000) // Extended timeout to 7 seconds to allow users to see the final status
  }

  const cancelUpload = () => {
    setUploadCancelled(true)
    
    // Immediately mark all pending and uploading files as cancelled
    setUploadQueue(prev => prev.map(item => 
      (item.status === 'pending' || item.status === 'uploading') 
        ? { ...item, status: 'cancelled' as const, error: 'Upload cancelled by user' }
        : item
    ))

    // Clean up after a short delay
    setTimeout(() => {
      setIsUploading(false)
      setUploadQueue([])
      setCurrentUploadIndex(-1)
      setUploadCancelled(false)
    }, 2000)
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
                <span className="hidden xs:inline sm:inline">Upload Files</span>
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

      {/* Hidden file input - Updated to accept multiple files */}
      <input 
        ref={fileInputRef} 
        type="file" 
        multiple 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {/* Multiple Files Upload Progress */}
      {isUploading && uploadQueue.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg p-4 shadow-lg border max-w-sm w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Uploading Files</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelUpload}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {uploadQueue.map((fileInfo, index) => {
              const FileIcon = getFileIcon(fileInfo.file.name)
              const iconColor = getFileIconColor(fileInfo.file.name)
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FileIcon className={`w-4 h-4 ${iconColor} flex-shrink-0`} />
                    <span className="text-sm truncate flex-1" title={fileInfo.file.name}>
                      {fileInfo.file.name}
                    </span>
                    <div className="flex-shrink-0">
                      {fileInfo.status === 'completed' && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                      {fileInfo.status === 'failed' && (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      {fileInfo.status === 'cancelled' && (
                        <XCircle className="w-4 h-4 text-gray-500" />
                      )}
                      {fileInfo.status === 'size-exceeded' && (
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      )}
                      {fileInfo.status === 'uploading' && (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {fileInfo.status === 'pending' && (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  {fileInfo.status === 'uploading' && (
                    <Progress value={fileInfo.progress} className="h-1" />
                  )}
                  
                  {(fileInfo.status === 'failed' || fileInfo.status === 'cancelled' || fileInfo.status === 'size-exceeded') && fileInfo.error && (
                    <p className="text-xs text-red-600 break-words">{fileInfo.error}</p>
                  )}
                </div>
              )
            })}
          </div>
          
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {uploadQueue.filter(f => f.status === 'completed').length} of {uploadQueue.filter(f => f.status !== 'size-exceeded').length} completed
              </span>
              {currentUploadIndex >= 0 && currentUploadIndex < uploadQueue.length && !uploadCancelled && (
                <span className="text-blue-600">
                  Uploading {currentUploadIndex + 1} of {uploadQueue.length}
                </span>
              )}
            </div>
            {uploadQueue.some(f => f.status === 'size-exceeded') && (
              <div className="text-xs text-orange-600 mt-1">
                {uploadQueue.filter(f => f.status === 'size-exceeded').length} file(s) exceed storage capacity
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legacy Upload Progress (keeping for backward compatibility) */}
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
