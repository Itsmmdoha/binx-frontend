"use client"

import { useState } from "react"
import { useToast } from "./use-toast"

export interface FileOperation {
  id: string
  name: string
  size: number
  visibility: "public" | "private"
  date_created: string
}

export function useFileOperations(token: string) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/file/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
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
        title: "Success",
        description: "File download started",
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/file/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete file")
      }

      toast({
        title: "Success",
        description: "File deleted successfully",
      })
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRename = async (fileId: string, newName: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/file/${fileId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_name: newName }),
      })

      if (!response.ok) {
        throw new Error("Failed to rename file")
      }

      toast({
        title: "Success",
        description: "File renamed successfully",
      })
    } catch (error) {
      console.error("Rename error:", error)
      toast({
        title: "Error",
        description: "Failed to rename file",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVisibilityChange = async (fileId: string, visibility: "public" | "private") => {
    try {
      setIsLoading(true)
      const response = await fetch(`/file/${fileId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ visibility }),
      })

      if (!response.ok) {
        throw new Error("Failed to update file visibility")
      }

      toast({
        title: "Success",
        description: `File is now ${visibility}`,
      })
    } catch (error) {
      console.error("Visibility change error:", error)
      toast({
        title: "Error",
        description: "Failed to update file visibility",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkDelete = async (fileIds: string[]) => {
    try {
      setIsLoading(true)
      const response = await fetch("/file/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ file_ids: fileIds }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete files")
      }

      const data = await response.json()

      // Notify about deleted files
      data.deleted_files.file_ids.forEach((fileId: string) => {
        toast({
          title: "Success",
          description: `File ${fileId} deleted successfully`,
        })
      })

      if (data.files_not_found.count > 0) {
        toast({
          title: "Warning",
          description: `${data.files_not_found.count} file(s) were not found`,
          variant: "destructive",
        })
      }

      setIsLoading(false)
      return data
    } catch (error) {
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Failed to delete files",
        variant: "destructive",
      })
      console.error("Bulk delete error:", error)
      return null
    }
  }

  const handleUpdateFile = async (
    fileId: string,
    updates: { new_name?: string; visibility?: "public" | "private" },
  ) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/file/${fileId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error("Failed to update file")
      }

      toast({
        title: "Success",
        description: "File updated successfully",
      })
    } catch (error) {
      console.error("Update error:", error)
      toast({
        title: "Error",
        description: "Failed to update file",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    handleDownload,
    handleDelete,
    handleRename,
    handleVisibilityChange,
    handleBulkDelete,
    handleUpdateFile,
    isLoading,
  }
}
