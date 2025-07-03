"use client"

import { useState, useCallback } from "react"
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
    async (fileId: string, fileName: string) => {
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
        } else if (response.status === 401) {
          clearAuthAndRedirect()
        }
      } catch (error) {
        console.error("Download failed:", error)
      }
    },
    [clearAuthAndRedirect],
  )

  const handleRename = useCallback(async () => {
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
      } else if (response.status === 401) {
        clearAuthAndRedirect()
      }
    } catch (error) {
      console.error("Rename failed:", error)
    }
  }, [renameDialog, fetchVaultData, clearAuthAndRedirect])

  const handleDelete = useCallback(async () => {
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
      } else if (response.status === 401) {
        clearAuthAndRedirect()
      }
    } catch (error) {
      console.error("Delete failed:", error)
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
    const token = localStorage.getItem("token")
    if (!token || bulkDeleteDialog.fileIds.length === 0) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/file/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file_ids: bulkDeleteDialog.fileIds,
        }),
      })

      if (response.ok) {
        setBulkDeleteDialog({ open: false, fileIds: [], fileNames: [] })
        fetchVaultData(token)
      } else if (response.status === 401) {
        clearAuthAndRedirect()
      }
    } catch (error) {
      console.error("Bulk delete failed:", error)
    }
  }, [bulkDeleteDialog, fetchVaultData, clearAuthAndRedirect])

  const handleVisibilityChange = useCallback(async () => {
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
      } else if (response.status === 401) {
        clearAuthAndRedirect()
      }
    } catch (error) {
      console.error("Visibility change failed:", error)
    }
  }, [visibilityDialog, fetchVaultData, clearAuthAndRedirect])

  const handleCopyPublicLink = useCallback(
    async (file: FileData) => {
      const token = localStorage.getItem("token")
      const vaultName = localStorage.getItem("vaultName")
      if (!token || !vaultName) return

      try {
        // First, make the file public
        const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/file/${file.file_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ visibility: "public" }),
        })

        if (response.ok) {
          // Generate the public link
          const publicLink = `${process.env.NEXT_PUBLIC_BINX_API_URL}/${vaultName}/file/${file.file_id}`

          // Copy to clipboard
          try {
            await navigator.clipboard.writeText(publicLink)
            // You might want to show a toast notification here
            console.log("Public link copied to clipboard:", publicLink)
          } catch (clipboardError) {
            console.error("Failed to copy to clipboard:", clipboardError)
            // Fallback: show the link in an alert or modal
            alert(`Public link: ${publicLink}`)
          }

          // Refresh the vault data to show updated visibility
          fetchVaultData(token)
        } else if (response.status === 401) {
          clearAuthAndRedirect()
        } else {
          console.error("Failed to make file public")
        }
      } catch (error) {
        console.error("Copy public link failed:", error)
      }
    },
    [fetchVaultData, clearAuthAndRedirect],
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
