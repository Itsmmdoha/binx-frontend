"use client"

import { useState, useCallback } from "react"
import { toast } from "@/hooks/use-toast"
import type { FileData } from "@/types"

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

interface BulkDeleteDialogState {
  open: boolean
  fileIds: string[]
  fileNames: string[]
}

export function useFileOperations(
  fetchVaultData: (token: string) => void, 
  clearAuthAndRedirect: () => void,
  clearSelectionMode?: () => void
) {
  const [renameDialog, setRenameDialog] = useState<RenameDialogState>({
    open: false,
    file: null,
    newName: "",
  })

  const [deleteDialog, setDeleteDialog] = useState<DialogState>({
    open: false,
    file: null,
  })

  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<BulkDeleteDialogState>({
    open: false,
    fileIds: [],
    fileNames: [],
  })

  const [visibilityDialog, setVisibilityDialog] = useState<VisibilityDialogState>({
    open: false,
    file: null,
    visibility: "",
  })

  const getApiUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_BINX_API_URL
    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_BINX_API_URL environment variable is not set")
    }
    return baseUrl
  }

  // iOS-compatible clipboard function
  const copyToClipboard = async (text: string): Promise<boolean> => {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch (err) {
        console.warn("Clipboard API failed, trying fallback:", err)
      }
    }

    // Fallback for iOS and other browsers
    try {
      // Create a temporary textarea element
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      textArea.setAttribute("readonly", "")
      textArea.style.opacity = "0"

      document.body.appendChild(textArea)

      // For iOS, we need to set contentEditable and focus
      if (/iP(ad|hone|od)/.test(navigator.userAgent)) {
        textArea.contentEditable = "true"
        textArea.readOnly = false
        const range = document.createRange()
        range.selectNodeContents(textArea)
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
        textArea.setSelectionRange(0, 999999)
      } else {
        textArea.select()
      }

      const successful = document.execCommand("copy")
      document.body.removeChild(textArea)

      return successful
    } catch (err) {
      console.error("Fallback clipboard method failed:", err)
      return false
    }
  }

  const handleDownload = useCallback(
    async (fileId: string, fileName: string) => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          clearAuthAndRedirect()
          return
        }

        const apiUrl = getApiUrl()
        const response = await fetch(`${apiUrl}/file/${fileId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            clearAuthAndRedirect()
            return
          }
          throw new Error("Failed to get download URL")
        }

        const data = await response.json()

        // Create a temporary anchor element and trigger download
        const link = document.createElement("a")
        link.href = data.download_url
        link.download = fileName
        link.style.display = "none"

        // Add to DOM, click, and remove
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Download started",
          description: `Downloading ${fileName}`,
        })
      } catch (error) {
        console.error("Download error:", error)
        toast({
          title: "Download failed",
          description: "Failed to download file. Please try again.",
          variant: "destructive",
        })
      }
    },
    [clearAuthAndRedirect],
  )

  const handleRename = useCallback(async () => {
    if (!renameDialog.file || !renameDialog.newName.trim()) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        clearAuthAndRedirect()
        return
      }

      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/file/${renameDialog.file.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          new_name: renameDialog.newName.trim(),
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthAndRedirect()
          return
        }
        throw new Error("Failed to rename file")
      }

      toast({
        title: "File renamed",
        description: `File renamed to ${renameDialog.newName}`,
      })

      setRenameDialog({ open: false, file: null, newName: "" })
      fetchVaultData(token)
    } catch (error) {
      console.error("Rename error:", error)
      toast({
        title: "Rename failed",
        description: "Failed to rename file. Please try again.",
        variant: "destructive",
      })
    }
  }, [renameDialog, fetchVaultData, clearAuthAndRedirect])

  const handleDelete = useCallback(async () => {
    if (!deleteDialog.file) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        clearAuthAndRedirect()
        return
      }

      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/file/${deleteDialog.file.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthAndRedirect()
          return
        }
        throw new Error("Failed to delete file")
      }

      toast({
        title: "File deleted",
        description: `${deleteDialog.file.file} has been deleted`,
      })

      setDeleteDialog({ open: false, file: null })
      fetchVaultData(token)
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      })
    }
  }, [deleteDialog, fetchVaultData, clearAuthAndRedirect])

  const handleBulkDelete = useCallback((fileIds: string[], fileNames: string[]) => {
    setBulkDeleteDialog({
      open: true,
      fileIds,
      fileNames,
    })
  }, [])

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (bulkDeleteDialog.fileIds.length === 0) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        clearAuthAndRedirect()
        return
      }

      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/file/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file_ids: bulkDeleteDialog.fileIds,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthAndRedirect()
          return
        }
        throw new Error("Failed to delete files")
      }

      const result = await response.json()

      toast({
        title: "Files deleted",
        description: `${result.deleted_files.count} file(s) deleted successfully`,
      })

      setBulkDeleteDialog({ open: false, fileIds: [], fileNames: [] })
      
      // Clear selection mode after successful bulk delete
      if (clearSelectionMode) {
        clearSelectionMode()
      }
      
      fetchVaultData(token)
    } catch (error) {
      console.error("Bulk delete error:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete files. Please try again.",
        variant: "destructive",
      })
    }
  }, [bulkDeleteDialog, fetchVaultData, clearAuthAndRedirect, clearSelectionMode])

  const handleVisibilityChange = useCallback(async () => {
    if (!visibilityDialog.file || !visibilityDialog.visibility) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        clearAuthAndRedirect()
        return
      }

      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/file/${visibilityDialog.file.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          visibility: visibilityDialog.visibility,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthAndRedirect()
          return
        }
        throw new Error("Failed to change visibility")
      }

      toast({
        title: "Visibility changed",
        description: `File visibility changed to ${visibilityDialog.visibility}`,
      })

      setVisibilityDialog({ open: false, file: null, visibility: "" })
      fetchVaultData(token)
    } catch (error) {
      console.error("Visibility change error:", error)
      toast({
        title: "Visibility change failed",
        description: "Failed to change file visibility. Please try again.",
        variant: "destructive",
      })
    }
  }, [visibilityDialog, fetchVaultData, clearAuthAndRedirect])

  const handleCopyPublicLink = useCallback(
    async (file: FileData, vaultName: string) => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          clearAuthAndRedirect()
          return
        }

        // First, make the file public if it's not already
        if (file.visibility !== "public") {
          const apiUrl = getApiUrl()
          const response = await fetch(`${apiUrl}/file/${file.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              visibility: "public",
            }),
          })

          if (!response.ok) {
            if (response.status === 401) {
              clearAuthAndRedirect()
              return
            }
            throw new Error("Failed to make file public")
          }

          // Refresh vault data to update the UI
          fetchVaultData(token)
        }

        // Generate the correct public URL format
        const apiUrl = getApiUrl()
        const publicUrl = `${apiUrl}/${vaultName}/file/${file.id}`

        // Copy to clipboard using iOS-compatible method
        const success = await copyToClipboard(publicUrl)

        if (success) {
          toast({
            title: "Public link copied",
            description:
              file.visibility !== "public"
                ? "File made public and link copied to clipboard"
                : "Public link copied to clipboard",
          })
        } else {
          // If copying fails, show the URL in a toast for manual copying
          toast({
            title: "Copy failed",
            description: `Please copy manually: ${publicUrl}`,
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Copy public link error:", error)
        toast({
          title: "Copy link failed",
          description: "Failed to copy public link. Please try again.",
          variant: "destructive",
        })
      }
    },
    [clearAuthAndRedirect, fetchVaultData],
  )

  return {
    renameDialog,
    deleteDialog,
    bulkDeleteDialog,
    visibilityDialog,
    handleDownload,
    handleRename,
    handleDelete,
    handleBulkDelete,
    handleBulkDeleteConfirm,
    handleVisibilityChange,
    handleCopyPublicLink,
    setRenameDialog,
    setDeleteDialog,
    setBulkDeleteDialog,
    setVisibilityDialog,
  }
}
