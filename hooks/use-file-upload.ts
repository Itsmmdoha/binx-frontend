"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { formatFileSize } from "@/utils"
import type { VaultData } from "@/types"

interface FileUploadInfo {
  file: File
  status: "pending" | "uploading" | "completed" | "failed" | "cancelled" | "size-exceeded"
  progress: number
  error?: string
  xhr?: XMLHttpRequest
}

export function useFileUpload(vaultData: VaultData | null, fetchVaultData: (token: string) => void) {
  const [uploadQueue, setUploadQueue] = useState<FileUploadInfo[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [currentUploadIndex, setCurrentUploadIndex] = useState(-1)
  const [uploadCancelled, setUploadCancelled] = useState(false)
  const [showDetailedProgress, setShowDetailedProgress] = useState(false)

  const checkStorageCapacity = useCallback(
    (filesToUpload: File[]): { canUpload: boolean; exceedsStorage: File[] } => {
      if (!vaultData) return { canUpload: false, exceedsStorage: [] }

      const availableSpace = vaultData.size - vaultData.used_storage
      let totalSizeNeeded = 0
      const exceedsStorage: File[] = []

      for (const file of filesToUpload) {
        totalSizeNeeded += file.size
        if (totalSizeNeeded > availableSpace) {
          exceedsStorage.push(...filesToUpload.slice(filesToUpload.indexOf(file)))
          break
        }
      }

      return {
        canUpload: exceedsStorage.length === 0,
        exceedsStorage,
      }
    },
    [vaultData],
  )

  const uploadFileWithProgress = useCallback((fileInfo: FileUploadInfo, token: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append("file", fileInfo.file)

      setUploadQueue((prev) => prev.map((item) => (item.file === fileInfo.file ? { ...item, xhr } : item)))

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setUploadQueue((prev) =>
            prev.map((item) => (item.file === fileInfo.file ? { ...item, progress: percentComplete } : item)),
          )
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.file === fileInfo.file ? { ...item, status: "completed" as const, progress: 100 } : item,
            ),
          )
          resolve()
        } else {
          let errorMessage = "Upload failed"

          try {
            const errorData = JSON.parse(xhr.responseText)
            errorMessage = errorData.message || errorData.detail || "Upload failed"
          } catch (parseError) {
            if (xhr.status === 507) {
              errorMessage = "Insufficient storage space"
            } else if (xhr.status === 413) {
              errorMessage = "File too large"
            } else if (xhr.status === 415) {
              errorMessage = "File type not supported"
            } else {
              errorMessage = `Upload failed (HTTP ${xhr.status})`
            }
          }

          setUploadQueue((prev) =>
            prev.map((item) =>
              item.file === fileInfo.file
                ? {
                    ...item,
                    status: "failed" as const,
                    progress: 0,
                    error: errorMessage,
                  }
                : item,
            ),
          )

          if (xhr.status === 507) {
            setUploadCancelled(true)
          }

          reject(new Error(errorMessage))
        }
      })

      xhr.addEventListener("error", () => {
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.file === fileInfo.file
              ? {
                  ...item,
                  status: "failed" as const,
                  progress: 0,
                  error: "Network error occurred",
                }
              : item,
          ),
        )
        reject(new Error("Network error"))
      })

      xhr.addEventListener("abort", () => {
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.file === fileInfo.file
              ? {
                  ...item,
                  status: "cancelled" as const,
                  error: "Upload cancelled by user",
                }
              : item,
          ),
        )
        reject(new Error("Upload cancelled"))
      })

      xhr.open("POST", `${process.env.NEXT_PUBLIC_BINX_API_URL}/file/upload`)
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      xhr.send(formData)
    })
  }, [])

  const uploadFilesSequentially = useCallback(
    async (fileInfos: FileUploadInfo[], token: string) => {
      for (let i = 0; i < fileInfos.length; i++) {
        if (uploadCancelled) {
          setUploadQueue((prev) =>
            prev.map((item) => {
              const currentFileIndex = prev.findIndex((prevItem) => prevItem.file === fileInfos[i].file)
              const itemIndex = prev.findIndex((prevItem) => prevItem.file === item.file)
              return currentFileIndex >= 0 && itemIndex >= currentFileIndex
                ? { ...item, status: "cancelled" as const, error: "Upload cancelled by user" }
                : item
            }),
          )
          break
        }

        setCurrentUploadIndex(i)

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.file === fileInfos[i].file ? { ...item, status: "uploading" as const, progress: 0 } : item,
          ),
        )

        try {
          await uploadFileWithProgress(fileInfos[i], token)
        } catch (error) {
          console.error("Upload error:", error)
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.file === fileInfos[i].file
                ? {
                    ...item,
                    status: "failed" as const,
                    progress: 0,
                    error: "Network error occurred",
                  }
                : item,
            ),
          )
        }

        if (!uploadCancelled) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      setTimeout(() => {
        setIsUploading(false)
        setUploadQueue([])
        setCurrentUploadIndex(-1)
        setUploadCancelled(false)
        setShowDetailedProgress(false)
        fetchVaultData(localStorage.getItem("token") || "")
      }, 5000)
    },
    [uploadCancelled, uploadFileWithProgress, fetchVaultData],
  )

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files
      if (!selectedFiles || selectedFiles.length === 0) return

      const token = localStorage.getItem("token")
      if (!token) return

      const fileArray = Array.from(selectedFiles)
      const { canUpload, exceedsStorage } = checkStorageCapacity(fileArray)

      const fileInfos: FileUploadInfo[] = fileArray.map((file) => {
        const isExceeded = exceedsStorage.includes(file)
        return {
          file,
          status: isExceeded ? "size-exceeded" : "pending",
          progress: 0,
          error: isExceeded
            ? `File size exceeds available storage (${formatFileSize(vaultData!.size - vaultData!.used_storage)} remaining)`
            : undefined,
        }
      })

      setUploadQueue(fileInfos)
      setIsUploading(true)
      setUploadCancelled(false)
      setShowDetailedProgress(false)

      if (!canUpload || fileInfos.every((f) => f.status === "size-exceeded")) {
        setTimeout(() => {
          setIsUploading(false)
          setUploadQueue([])
          setCurrentUploadIndex(-1)
        }, 5000)
        event.target.value = ""
        return
      }

      const filesToUpload = fileInfos.filter((f) => f.status === "pending")
      await uploadFilesSequentially(filesToUpload, token)

      event.target.value = ""
    },
    [checkStorageCapacity, vaultData, uploadFilesSequentially],
  )

  const cancelUpload = useCallback(() => {
    setUploadCancelled(true)

    setUploadQueue((prev) =>
      prev.map((item) => {
        if ((item.status === "pending" || item.status === "uploading") && item.xhr) {
          item.xhr.abort()
        }
        return item.status === "pending" || item.status === "uploading"
          ? { ...item, status: "cancelled" as const, error: "Upload cancelled by user" }
          : item
      }),
    )

    setTimeout(() => {
      setIsUploading(false)
      setUploadQueue([])
      setCurrentUploadIndex(-1)
      setUploadCancelled(false)
      setShowDetailedProgress(false)
    }, 2000)
  }, [])

  const getCurrentUploadingFile = useCallback(() => {
    return uploadQueue.find((file) => file.status === "uploading") || null
  }, [uploadQueue])

  const getUploadSummary = useCallback(() => {
    const completed = uploadQueue.filter((f) => f.status === "completed").length
    const failed = uploadQueue.filter((f) => f.status === "failed").length
    const cancelled = uploadQueue.filter((f) => f.status === "cancelled").length
    const sizeExceeded = uploadQueue.filter((f) => f.status === "size-exceeded").length
    const uploadable = uploadQueue.filter((f) => f.status !== "size-exceeded").length

    return { completed, failed, cancelled, sizeExceeded, uploadable, total: uploadQueue.length }
  }, [uploadQueue])

  return {
    uploadQueue,
    isUploading,
    showDetailedProgress,
    setShowDetailedProgress,
    handleFileUpload,
    cancelUpload,
    getCurrentUploadingFile,
    getUploadSummary,
  }
}
