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

export function useFileOperations(fetchVaultData: (token: string) => void, clearAuthAndRedirect: () => void) {
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

  const handleDownload = useCallback(
    async (file: FileData) => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          clearAuthAndRedirect()
          return
        }

        const response = await fetch(`/api/file/${file.id}`, {
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
        link.download = file.file
        link.style.display = "none"

        // Add to DOM, click, and remove
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Download started",
          description: `Downloading ${file.file}`,
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

      const response = await fetch(`/api/file/${renameDialog.file.id}`, {
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

      const response = await fetch(`/api/file/${deleteDialog.file.id}`, {
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

      const response = await fetch("/api/file/bulk-delete", {
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
      fetchVaultData(token)
    } catch (error) {
      console.error("Bulk delete error:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete files. Please try again.",
        variant: "destructive",
      })
    }
  }, [bulkDeleteDialog, fetchVaultData, clearAuthAndRedirect])

  const handleVisibilityChange = useCallback(async () => {
    if (!visibilityDialog.file || !visibilityDialog.visibility) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        clearAuthAndRedirect()
        return
      }

      const response = await fetch(`/api/file/${visibilityDialog.file.id}`, {
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

  const handleCopyPublicLink = useCallback(async (file: FileData) => {
    if (file.visibility !== "public") {
      toast({
        title: "File not public",
        description: "Only public files have shareable links",
        variant: "destructive",
      })
      return
    }

    try {
      const publicUrl = `${window.location.origin}/public/${file.id}`
      await navigator.clipboard.writeText(publicUrl)

      toast({
        title: "Link copied",
        description: "Public link copied to clipboard",
      })
    } catch (error) {
      console.error("Copy link error:", error)
      toast({
        title: "Copy failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      })
    }
  }, [])

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
