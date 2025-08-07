"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { formatFileSize } from "@/utils"
import type { VaultData, MultipartUpload } from "@/types"
import {
  shouldUseMultipart,
  createChunks,
  generateUploadId,
  initiateMultipartUpload,
  uploadChunk,
  completeMultipartUpload,
  abortMultipartUpload,
  saveIncompleteUpload,
  removeIncompleteUpload,
  calculateUploadProgress,
  MULTIPART_THRESHOLD,
  DEFAULT_CHUNK_SIZE
} from "@/utils/multipart-upload"

interface FileUploadInfo {
  file: File
  status: "pending" | "uploading" | "completed" | "failed" | "cancelled" | "size-exceeded" | "paused"
  progress: number
  error?: string
  xhr?: XMLHttpRequest
  multipartUpload?: MultipartUpload
  pauseResolve?: () => void
}

export function useFileUpload(vaultData: VaultData | null, fetchVaultData: (token: string) => void) {
  const [uploadQueue, setUploadQueue] = useState<FileUploadInfo[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [currentUploadIndex, setCurrentUploadIndex] = useState(-1)
  const [uploadCancelled, setUploadCancelled] = useState(false)
  const [showDetailedProgress, setShowDetailedProgress] = useState(false)
  const activeUploadsRef = useRef<Map<string, { abort: () => void; pause: () => void; resume: () => void }>>(new Map())

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

  const uploadFileWithMultipart = useCallback(async (fileInfo: FileUploadInfo, token: string): Promise<void> => {
    const { file } = fileInfo
    
    try {
      // Create multipart upload record
      const uploadId = generateUploadId()
      const chunks = createChunks(file, DEFAULT_CHUNK_SIZE)
      
      const multipartUpload: MultipartUpload = {
        id: uploadId,
        uploadId,
        fileName: file.name,
        fileSize: file.size,
        chunkSize: DEFAULT_CHUNK_SIZE,
        totalChunks: chunks.length,
        uploadedChunks: new Set(),
        status: "pending",
        createdAt: Date.now(),
        lastActivity: Date.now(),
      }
      
      // Update file info with multipart upload
      setUploadQueue(prev => 
        prev.map(item => 
          item.file === file 
            ? { ...item, multipartUpload, status: "uploading" as const }
            : item
        )
      )
      
      // Save to local storage
      saveIncompleteUpload(multipartUpload)
      
      // Initiate multipart upload with API
      const initResponse = await initiateMultipartUpload(file.name, file.size, token)
      
      // Update with actual upload ID from API
      multipartUpload.uploadId = initResponse.uploadId
      multipartUpload.chunkSize = initResponse.chunkSize || DEFAULT_CHUNK_SIZE
      
      // Recalculate chunks if chunk size changed
      const finalChunks = multipartUpload.chunkSize !== DEFAULT_CHUNK_SIZE 
        ? createChunks(file, multipartUpload.chunkSize)
        : chunks
        
      multipartUpload.totalChunks = finalChunks.length
      
      saveIncompleteUpload(multipartUpload)
      
      let isPaused = false
      let isAborted = false
      
      const uploadControls = {
        abort: () => {
          isAborted = true
          abortMultipartUpload(multipartUpload.uploadId, token).catch(console.error)
          removeIncompleteUpload(multipartUpload.id)
        },
        pause: () => {
          isPaused = true
          multipartUpload.status = "paused"
          saveIncompleteUpload(multipartUpload)
        },
        resume: () => {
          isPaused = false
          multipartUpload.status = "uploading"
          saveIncompleteUpload(multipartUpload)
        }
      }
      
      activeUploadsRef.current.set(uploadId, uploadControls)
      
      const completedParts: { chunkNumber: number; etag: string }[] = []
      
      // Upload chunks sequentially
      for (let i = 0; i < finalChunks.length; i++) {
        if (isAborted || uploadCancelled) break
        
        // Wait if paused
        while (isPaused && !isAborted && !uploadCancelled) {
          await new Promise(resolve => {
            fileInfo.pauseResolve = resolve
            setTimeout(resolve, 1000) // Check every second
          })
        }
        
        if (isAborted || uploadCancelled) break
        
        const chunk = finalChunks[i]
        
        try {
          const chunkResponse = await uploadChunk(
            multipartUpload.uploadId,
            chunk.chunkNumber,
            chunk.data,
            token,
            (loaded, total) => {
              const chunkProgress = (loaded / total) * 100
              const overallProgress = Math.round(
                ((multipartUpload.uploadedChunks.size + chunkProgress / 100) / multipartUpload.totalChunks) * 100
              )
              
              setUploadQueue(prev =>
                prev.map(item =>
                  item.file === file ? { ...item, progress: overallProgress } : item
                )
              )
            }
          )
          
          // Mark chunk as completed
          multipartUpload.uploadedChunks.add(chunk.chunkNumber)
          multipartUpload.lastActivity = Date.now()
          completedParts.push({
            chunkNumber: chunk.chunkNumber,
            etag: chunkResponse.etag
          })
          
          // Update progress
          const progress = calculateUploadProgress(multipartUpload.uploadedChunks, multipartUpload.totalChunks)
          
          setUploadQueue(prev =>
            prev.map(item =>
              item.file === file ? { ...item, progress } : item
            )
          )
          
          // Save progress
          saveIncompleteUpload(multipartUpload)
          
        } catch (error) {
          if (isAborted || uploadCancelled) break
          
          multipartUpload.status = "failed"
          multipartUpload.error = error instanceof Error ? error.message : "Chunk upload failed"
          saveIncompleteUpload(multipartUpload)
          
          setUploadQueue(prev =>
            prev.map(item =>
              item.file === file
                ? { ...item, status: "failed" as const, error: multipartUpload.error }
                : item
            )
          )
          
          throw error
        }
      }
      
      if (!isAborted && !uploadCancelled) {
        // Complete multipart upload
        const completeResponse = await completeMultipartUpload(
          multipartUpload.uploadId,
          completedParts,
          token
        )
        
        // Mark as completed
        multipartUpload.status = "completed"
        removeIncompleteUpload(multipartUpload.id)
        
        setUploadQueue(prev =>
          prev.map(item =>
            item.file === file ? { ...item, status: "completed" as const, progress: 100 } : item
          )
        )
      }
      
      activeUploadsRef.current.delete(uploadId)
      
    } catch (error) {
      activeUploadsRef.current.delete(fileInfo.multipartUpload?.id || '')
      
      const errorMessage = error instanceof Error ? error.message : "Multipart upload failed"
      
      setUploadQueue(prev =>
        prev.map(item =>
          item.file === file
            ? { ...item, status: "failed" as const, error: errorMessage, progress: 0 }
            : item
        )
      )
      
      if (fileInfo.multipartUpload) {
        fileInfo.multipartUpload.status = "failed"
        fileInfo.multipartUpload.error = errorMessage
        saveIncompleteUpload(fileInfo.multipartUpload)
      }
      
      throw error
    }
  }, [uploadCancelled])

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
          // Check if file should use multipart upload
          if (shouldUseMultipart(fileInfos[i].file.size)) {
            await uploadFileWithMultipart(fileInfos[i], token)
          } else {
            await uploadFileWithProgress(fileInfos[i], token)
          }
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

        // Reduced delay between uploads from 500ms to 100ms
        if (!uploadCancelled && i < fileInfos.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      // Check if all uploads are complete
      const allComplete = uploadQueue.every(
        (file) =>
          file.status === "completed" ||
          file.status === "failed" ||
          file.status === "cancelled" ||
          file.status === "size-exceeded",
      )

      if (allComplete) {
        // Refresh vault data immediately when uploads complete
        fetchVaultData(localStorage.getItem("token") || "")

        // Show completion state briefly, then cleanup
        setTimeout(() => {
          setIsUploading(false)
          setUploadQueue([])
          setCurrentUploadIndex(-1)
          setUploadCancelled(false)
          setShowDetailedProgress(false)
        }, 1500) // Reduced from 5000ms to 1500ms
      }
    },
    [uploadCancelled, uploadFileWithProgress, uploadFileWithMultipart, fetchVaultData, uploadQueue],
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
        }, 3000) // Reduced from 5000ms to 3000ms for size exceeded cases
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

    // Cancel all active multipart uploads
    activeUploadsRef.current.forEach(controls => {
      controls.abort()
    })
    activeUploadsRef.current.clear()

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
    }, 1000) // Reduced from 2000ms to 1000ms
  }, [])

  const pauseUpload = useCallback((uploadId?: string) => {
    if (uploadId) {
      const controls = activeUploadsRef.current.get(uploadId)
      if (controls) {
        controls.pause()
      }
    } else {
      // Pause all active uploads
      activeUploadsRef.current.forEach(controls => {
        controls.pause()
      })
    }
    
    setUploadQueue(prev =>
      prev.map(item =>
        item.multipartUpload && (!uploadId || item.multipartUpload.id === uploadId)
          ? { ...item, status: "paused" as const }
          : item
      )
    )
  }, [])

  const resumeUpload = useCallback((uploadId?: string) => {
    if (uploadId) {
      const controls = activeUploadsRef.current.get(uploadId)
      if (controls) {
        controls.resume()
      }
    } else {
      // Resume all paused uploads
      activeUploadsRef.current.forEach(controls => {
        controls.resume()
      })
    }
    
    setUploadQueue(prev =>
      prev.map(item =>
        item.status === "paused" && (!uploadId || item.multipartUpload?.id === uploadId)
          ? { ...item, status: "uploading" as const }
          : item
      )
    )
  }, [])

  const retryMultipartUpload = useCallback(async (incompleteUpload: MultipartUpload) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      // Create a new file info for the retry
      const fileInfo: FileUploadInfo = {
        file: new File([], incompleteUpload.fileName), // Placeholder file object
        status: "pending",
        progress: calculateUploadProgress(incompleteUpload.uploadedChunks, incompleteUpload.totalChunks),
        multipartUpload: { ...incompleteUpload, status: "uploading" }
      }

      setUploadQueue([fileInfo])
      setIsUploading(true)
      setUploadCancelled(false)
      setShowDetailedProgress(false)

      // Note: Since we don't have the actual file data, we would need to
      // prompt the user to select the file again or store the file path in the incomplete upload
      // For now, we'll show an error asking the user to reselect the file
      
      if (!incompleteUpload.filePath) {
        throw new Error("File not found. Please select the file again to continue upload.")
      }

      // In a real implementation, you would need to recreate the File object
      // from the stored path or prompt user to reselect
      throw new Error("Please select the original file again to continue upload.")

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to retry upload"
      
      setUploadQueue(prev =>
        prev.map(item => ({ ...item, status: "failed" as const, error: errorMessage }))
      )
      
      setTimeout(() => {
        setIsUploading(false)
        setUploadQueue([])
      }, 3000)
    }
  }, [])

  const abortMultipartUploadHandler = useCallback(async (incompleteUpload: MultipartUpload) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await abortMultipartUpload(incompleteUpload.uploadId, token)
      removeIncompleteUpload(incompleteUpload.id)
    } catch (error) {
      console.error("Failed to abort multipart upload:", error)
      // Still remove from local storage even if API call fails
      removeIncompleteUpload(incompleteUpload.id)
    }
  }, [])

  const getCurrentUploadingFile = useCallback(() => {
    return uploadQueue.find((file) => file.status === "uploading" || file.status === "paused") || null
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
    pauseUpload,
    resumeUpload,
    retryMultipartUpload,
    abortMultipartUpload: abortMultipartUploadHandler,
    getCurrentUploadingFile,
    getUploadSummary,
  }
}
